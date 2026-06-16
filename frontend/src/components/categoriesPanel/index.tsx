import { useCallback, useEffect, useState } from "react";
import { auth, db } from "../../services/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { DEFAULT_CATEGORIES } from "../../constants/defaultCategories";
import "./categoriesPanel.css";

export type CategoryType = "income" | "expense";
export type PresetType = "personal" | "business" | "custom";
export type CategoryPreset = "personal" | "business";

export type Category = {
  id: string;
  name: string;
  type: CategoryType;
  isDefault: boolean;
  preset: CategoryPreset;
};

function presetForNewCategory(selectedPreset: PresetType): CategoryPreset {
  return selectedPreset === "business" ? "business" : "personal";
}

function matchesSelectedPreset(
  category: Category,
  selectedPreset: PresetType
): boolean {
  if (selectedPreset === "custom") return true;
  return category.preset === selectedPreset;
}

export default function CategoriesPanel() {
  const [selectedPreset, setSelectedPreset] = useState<PresetType>("personal");
  const [categories, setCategories] = useState<Category[]>([]);
  const [newIncomeCategory, setNewIncomeCategory] = useState("");
  const [newExpenseCategory, setNewExpenseCategory] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingPreset, setSavingPreset] = useState(false);
  const [addingType, setAddingType] = useState<CategoryType | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  function applyPreset(preset: PresetType) {
    setSelectedPreset(preset);
    setError("");
    setSuccessMessage("");
  }

  async function savePresetDefinition() {
    if (savingPreset) return;

    const user = auth.currentUser;
    if (!user) return;

    if (selectedPreset === "custom") {
      setError("Escolha Finanças pessoais ou Negócio para salvar.");
      return;
    }

    setSavingPreset(true);
    try {
      await setDoc(
        doc(db, "users", user.uid),
        { categoryPreset: selectedPreset },
        { merge: true }
      );

      setError("");
      setSuccessMessage("Definição salva com sucesso.");
    } catch (err) {
      setError("Erro ao salvar definição");
      console.error(err);
    } finally {
      setSavingPreset(false);
    }
  }

  const loadCategories = useCallback(async () => {
    const user = currentUser ?? auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "categories"),
      where("userId", "==", user.uid)
    );

    const snapshot = await getDocs(q);

    const loaded: Category[] = snapshot.docs.map((docSnap) => {
      const d = docSnap.data();

      const preset: CategoryPreset =
        d.preset === "business" ? "business" : "personal";

      return {
        id: docSnap.id,
        name: String(d.name ?? "").trim(),
        type: d.type === "expense" ? "expense" : "income",
        isDefault: Boolean(d.isDefault),
        preset,
      };
    });

    setCategories(loaded.filter((category) => category.name.length > 0));
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    async function initCategoriesPanel(user: User) {
      setLoading(true);
      try {
        const userSnap = await getDoc(doc(db, "users", user.uid));

        if (userSnap.exists()) {
          const savedPreset = userSnap.data().categoryPreset;

          if (savedPreset === "personal" || savedPreset === "business") {
            setSelectedPreset(savedPreset);
          }
        }

        await loadCategories();
      } finally {
        setLoading(false);
      }
    }

    void initCategoriesPanel(currentUser);
  }, [currentUser, loadCategories]);

  async function addCategory(type: CategoryType) {
    if (addingType) return;

    const user = auth.currentUser;
    if (!user) return;

    const rawName = type === "income" ? newIncomeCategory : newExpenseCategory;
    const name = rawName.trim();

    if (!name) {
      setError("Nome obrigatório");
      return;
    }

    const preset = presetForNewCategory(selectedPreset);

    const alreadyExists = categories.some(
      (c) =>
        c.type === type &&
        c.preset === preset &&
        c.name.toLowerCase() === name.toLowerCase()
    );

    const activePreset: CategoryPreset =
      selectedPreset === "business" ? "business" : "personal";

    const defaultList =
      type === "income"
        ? DEFAULT_CATEGORIES[activePreset].income
        : DEFAULT_CATEGORIES[activePreset].expenses;

    const existsInDefault = defaultList.some(
      (defaultName) => defaultName.toLowerCase() === name.toLowerCase()
    );

    if (alreadyExists || existsInDefault) {
      setError("Categoria já existe");
      return;
    }

    const payload = {
      userId: user.uid,
      name,
      type,
      isDefault: false,
      preset,
    };

    setAddingType(type);
    try {
      await addDoc(collection(db, "categories"), payload);
      setError("");
      setSuccessMessage("");

      if (type === "income") {
        setNewIncomeCategory("");
      } else {
        setNewExpenseCategory("");
      }

      await loadCategories();
    } catch (err) {
      setError("Erro ao adicionar categoria");
      console.error(err);
    } finally {
      setAddingType(null);
    }
  }

  async function removeCategory(id: string) {
    if (removingId) return;

    setRemovingId(id);
    try {
      await deleteDoc(doc(db, "categories", id));
      await loadCategories();
    } catch (err) {
      console.error(err);
    } finally {
      setRemovingId(null);
    }
  }

  async function updateCategory(id: string, newName: string) {
    const formattedName = newName.trim();
    if (!formattedName) return;

    try {
      await updateDoc(doc(db, "categories", id), { name: formattedName });
      await loadCategories();
    } catch (err) {
      console.error(err);
    }
  }

  const visible = categories.filter((c) =>
    matchesSelectedPreset(c, selectedPreset)
  );

  const activePreset: CategoryPreset =
    selectedPreset === "business" ? "business" : "personal";

  const defaultIncomeCategories: Category[] = DEFAULT_CATEGORIES[
    activePreset
  ].income.map((name) => ({
    id: `default-income-${name}`,
    name,
    type: "income",
    isDefault: true,
    preset: activePreset,
  }));

  const defaultExpenseCategories: Category[] = DEFAULT_CATEGORIES[
    activePreset
  ].expenses.map((name) => ({
    id: `default-expense-${name}`,
    name,
    type: "expense",
    isDefault: true,
    preset: activePreset,
  }));

  const customIncomeCategories = visible.filter((c) => c.type === "income");
  const customExpenseCategories = visible.filter((c) => c.type === "expense");

  const incomeCategories = [
    ...defaultIncomeCategories,
    ...customIncomeCategories.filter(
      (custom) =>
        !defaultIncomeCategories.some(
          (def) => def.name.toLowerCase() === custom.name.toLowerCase()
        )
    ),
  ];

  const expenseCategories = [
    ...defaultExpenseCategories,
    ...customExpenseCategories.filter(
      (custom) =>
        !defaultExpenseCategories.some(
          (def) => def.name.toLowerCase() === custom.name.toLowerCase()
        )
    ),
  ];

  return (
    <div className="categoriesPanel">
        <div className="categoriesHeader">
        <h1 className="categoriesTitle">Categorias</h1>
        <p className="categoriesSubtitle">
            Escolha um modelo base e personalize suas categorias de entrada e
            despesa.
        </p>

        {error ? <p className="categoriesError">{error}</p> : null}
        {successMessage ? (
            <p className="categoriesSuccess">{successMessage}</p>
        ) : null}
        {loading ? (
            <p className="categoriesLoading">Carregando categorias...</p>
        ) : null}
        </div>

        <div className="presetSection">
        <h2 className="sectionTitle">Modo de uso</h2>

        <div className="presetRow">
            <div className="presetButtons">
            <button
                type="button"
                className={`presetButton ${
                selectedPreset === "personal" ? "activePreset" : ""
                }`}
                onClick={() => applyPreset("personal")}
            >
                Finanças pessoais
            </button>

            <button
                type="button"
                className={`presetButton ${
                selectedPreset === "business" ? "activePreset" : ""
                }`}
                onClick={() => applyPreset("business")}
            >
                Negócio
            </button>
            </div>

            <button
            type="button"
            className="savePresetButton"
            onClick={() => void savePresetDefinition()}
            disabled={savingPreset}
            >
            {savingPreset ? "Salvando..." : "Salvar definição"}
            </button>
        </div>
        </div>

        <div className="categoriesGrid">
        <div className="categoryBlock">
            <div className="categoryBlockHeader">
            <h2 className="sectionTitle">Entradas</h2>
            </div>

            <div className="categoryList">
            {incomeCategories.map((category) => (
                <div key={category.id} className="categoryItem">
                <input
                    className="categoryInput"
                    value={category.name}
                    readOnly={category.isDefault}
                    onChange={() => {}}
                    onBlur={(e) => {
                    if (!category.isDefault) {
                        void updateCategory(category.id, e.target.value);
                    }
                    }}
                />

                {category.isDefault ? (
                    <span className="defaultCategoryBadge">Padrão</span>
                ) : (
                    <button
                    type="button"
                    className="removeCategoryButton"
                    onClick={() => void removeCategory(category.id)}
                    disabled={removingId !== null}
                    >
                    {removingId === category.id ? "Removendo..." : "Remover"}
                    </button>
                )}
                </div>
            ))}
            </div>

            <div className="addCategoryRow">
            <input
                type="text"
                placeholder="Nova categoria de entrada"
                className="newCategoryInput"
                value={newIncomeCategory}
                onChange={(e) => setNewIncomeCategory(e.target.value)}
            />

            <button
                type="button"
                className="addCategoryButton"
                onClick={() => void addCategory("income")}
                disabled={addingType !== null}
            >
                {addingType === "income" ? "Adicionando..." : "Adicionar"}
            </button>
            </div>
        </div>

        <div className="categoryBlock">
            <div className="categoryBlockHeader">
            <h2 className="sectionTitle">Despesas</h2>
            </div>

            <div className="categoryList">
            {expenseCategories.map((category) => (
                <div key={category.id} className="categoryItem">
                <input
                    className="categoryInput"
                    value={category.name}
                    readOnly={category.isDefault}
                    onChange={() => {}}
                    onBlur={(e) => {
                    if (!category.isDefault) {
                        void updateCategory(category.id, e.target.value);
                    }
                    }}
                />

                {category.isDefault ? (
                    <span className="defaultCategoryBadge">Padrão</span>
                ) : (
                    <button
                    type="button"
                    className="removeCategoryButton"
                    onClick={() => void removeCategory(category.id)}
                    disabled={removingId !== null}
                    >
                    {removingId === category.id ? "Removendo..." : "Remover"}
                    </button>
                )}
                </div>
            ))}
            </div>

            <div className="addCategoryRow">
            <input
                type="text"
                placeholder="Nova categoria de despesa"
                className="newCategoryInput"
                value={newExpenseCategory}
                onChange={(e) => setNewExpenseCategory(e.target.value)}
            />

            <button
                type="button"
                className="addCategoryButton"
                onClick={() => void addCategory("expense")}
                disabled={addingType !== null}
            >
                {addingType === "expense" ? "Adicionando..." : "Adicionar"}
            </button>
            </div>
        </div>
        </div>
    </div>
    );
}