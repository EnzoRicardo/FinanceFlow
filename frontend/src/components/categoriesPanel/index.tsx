import { useEffect, useState } from "react";
import { auth, db } from "../../services/firebase";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    query,
    updateDoc,
    where,
} from "firebase/firestore";
import "./categoriesPanel.css";

export type CategoryType = "income" | "expense";
/** Modo de uso na UI: pessoal, negócio ou ver todos (personalizado). */
export type PresetType = "personal" | "business" | "custom";
/** Tipo persistido no Firestore em cada categoria. */
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
    selectedPreset: PresetType,
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

    function applyPreset(preset: PresetType) {
        setSelectedPreset(preset);
    }

    async function loadCategories() {
        const user = auth.currentUser;
        if (!user) return;

        const q = query(
            collection(db, "categories"),
            where("userId", "==", user.uid),
        );

        const snapshot = await getDocs(q);
        const loaded: Category[] = snapshot.docs.map((docSnap) => {
            const d = docSnap.data();
            const rawPreset = d.preset;
            const preset: CategoryPreset =
                rawPreset === "business" ? "business" : "personal";
            return {
                id: docSnap.id,
                name: String(d.name ?? ""),
                type: d.type === "expense" ? "expense" : "income",
                isDefault: Boolean(d.isDefault),
                preset,
            };
        });
        setCategories(loaded);
    }

    useEffect(() => {
        loadCategories();
    }, []);

    async function addCategory(type: CategoryType) {
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
                c.name.toLowerCase() === name.toLowerCase(),
        );

        if (alreadyExists) {
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

        try {
            await addDoc(collection(db, "categories"), payload);
            setError("");
            if (type === "income") {
                setNewIncomeCategory("");
            } else {
                setNewExpenseCategory("");
            }
            await loadCategories();
        } catch (err) {
            setError("Erro ao adicionar categoria");
            console.error(err);
        }
    }

    async function removeCategory(id: string) {
        const user = auth.currentUser;
        if (!user) return;
        try {
            await deleteDoc(doc(db, "categories", id));
            await loadCategories();
        } catch (err) {
            console.error(err);
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
        matchesSelectedPreset(c, selectedPreset),
    );

    const incomeCategories = visible.filter((c) => c.type === "income");
    const expenseCategories = visible.filter((c) => c.type === "expense");

    return (
        <div className="categoriesPanel">
            <div className="categoriesHeader">
                <h1 className="categoriesTitle">Categorias</h1>
                <p className="categoriesSubtitle">
                Escolha um modelo base e personalize suas categorias de entrada e
                despesa.
                </p>
                {error ? <p className="categoriesError">{error}</p> : null}
            </div>

            <div className="presetSection">
                <h2 className="sectionTitle">Modo de uso</h2>

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

                    <button
                        type="button"
                        className={`presetButton ${
                            selectedPreset === "custom" ? "activePreset" : ""
                        }`}
                        onClick={() => setSelectedPreset("custom")}
                    >
                        Personalizado
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
                            <div
                                key={`${category.id}-${category.name}`}
                                className="categoryItem"
                            >
                                <input
                                    className="categoryInput"
                                    defaultValue={category.name}
                                    onBlur={(e) =>
                                        void updateCategory(
                                            category.id,
                                            e.target.value,
                                        )
                                    }
                                />

                                <button
                                    type="button"
                                    className="removeCategoryButton"
                                    onClick={() =>
                                        void removeCategory(category.id)
                                    }
                                >
                                    Remover
                                </button>
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
                        >
                            Adicionar
                        </button>
                    </div>
                </div>

                <div className="categoryBlock">
                    <div className="categoryBlockHeader">
                        <h2 className="sectionTitle">Despesas</h2>
                    </div>

                    <div className="categoryList">
                        {expenseCategories.map((category) => (
                            <div
                                key={`${category.id}-${category.name}`}
                                className="categoryItem"
                            >
                                <input
                                    className="categoryInput"
                                    defaultValue={category.name}
                                    onBlur={(e) =>
                                        void updateCategory(
                                            category.id,
                                            e.target.value,
                                        )
                                    }
                                />

                                <button
                                    type="button"
                                    className="removeCategoryButton"
                                    onClick={() =>
                                        void removeCategory(category.id)
                                    }
                                >
                                    Remover
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="addCategoryRow">
                        <input
                            type="text"
                            placeholder="Nova categoria de despesa"
                            className="newCategoryInput"
                            value={newExpenseCategory}
                            onChange={(e) =>
                                setNewExpenseCategory(e.target.value)
                            }
                        />

                        <button
                            type="button"
                            className="addCategoryButton"
                            onClick={() => void addCategory("expense")}
                        >
                            Adicionar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
