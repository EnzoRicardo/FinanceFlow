import { useEffect, useMemo, useState } from "react";
import { auth, db } from "../../services/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import { DEFAULT_CATEGORIES } from "../../constants/defaultCategories";
import "./budgetPanel.css";

type Budget = {
  id: string;
  category: string;
  monthlyLimit: number;
};

type ExpenseTx = {
  category: string;
  amount: number;
};

const BrazilianCurrencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatMonthYear(date: Date) {
  return date.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

export default function BudgetPanel() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activePreset, setActivePreset] = useState<"personal" | "business">(
    "personal"
  );
  const [selectedMonth, setSelectedMonth] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expensesByCategory, setExpensesByCategory] = useState<
    Map<string, number>
  >(new Map());
  const [customCategories, setCustomCategories] = useState<string[]>([]);

  const [loadingBudgets, setLoadingBudgets] = useState(true);
  const [loadingExpenses, setLoadingExpenses] = useState(true);

  const [newCategory, setNewCategory] = useState("");
  const [newLimit, setNewLimit] = useState("");
  const [creating, setCreating] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const userDocRef = doc(db, "users", currentUser.uid);
    const unsubscribe = onSnapshot(userDocRef, (snap) => {
      if (snap.exists()) {
        const preset = snap.data().categoryPreset;
        if (preset === "personal" || preset === "business") {
          setActivePreset(preset);
        }
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "categories"),
      where("userId", "==", currentUser.uid),
      where("type", "==", "expense")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs
        .map((d) => String(d.data().name ?? "").trim())
        .filter((name) => name.length > 0);
      setCustomCategories(list);
    });

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    setLoadingBudgets(true);

    const q = query(
      collection(db, "budgets"),
      where("userId", "==", currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Budget[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          category: String(d.category ?? "").trim(),
          monthlyLimit: Number(d.monthlyLimit) || 0,
        };
      });

      list.sort((a, b) => a.category.localeCompare(b.category));

      setBudgets(list);
      setLoadingBudgets(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    setLoadingExpenses(true);

    const startOfMonth = new Date(
      selectedMonth.getFullYear(),
      selectedMonth.getMonth(),
      1
    );
    const startOfNextMonth = new Date(
      selectedMonth.getFullYear(),
      selectedMonth.getMonth() + 1,
      1
    );

    const q = query(
      collection(db, "transactions"),
      where("userId", "==", currentUser.uid),
      where("type", "==", "expense"),
      where("createdAt", ">=", startOfMonth),
      where("createdAt", "<", startOfNextMonth)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const totals = new Map<string, number>();

      snapshot.docs.forEach((docSnap) => {
        const d = docSnap.data() as ExpenseTx;
        const category = String(d.category ?? "").trim();
        const amount = Number(d.amount) || 0;
        totals.set(category, (totals.get(category) ?? 0) + amount);
      });

      setExpensesByCategory(totals);
      setLoadingExpenses(false);
    });

    return () => unsubscribe();
  }, [currentUser, selectedMonth]);

  const allCategories = useMemo(() => {
    const defaults = DEFAULT_CATEGORIES[activePreset].expenses;
    const merged = new Set<string>([...defaults, ...customCategories]);
    return Array.from(merged).sort((a, b) => a.localeCompare(b));
  }, [activePreset, customCategories]);

  const usedCategories = useMemo(
    () => new Set(budgets.map((b) => b.category)),
    [budgets]
  );

  const availableCategories = useMemo(
    () => allCategories.filter((c) => !usedCategories.has(c)),
    [allCategories, usedCategories]
  );

  function handlePreviousMonth() {
    setSelectedMonth(
      new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1)
    );
  }

  function handleNextMonth() {
    setSelectedMonth(
      new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1)
    );
  }

  async function createBudget() {
    if (creating) return;

    const user = auth.currentUser;
    if (!user) return;

    const category = newCategory.trim();
    const limit = Number(newLimit);

    if (!category) {
      setError("Selecione uma categoria");
      return;
    }

    if (!limit || limit <= 0) {
      setError("Valor inválido");
      return;
    }

    if (usedCategories.has(category)) {
      setError("Já existe um orçamento para essa categoria");
      return;
    }

    setCreating(true);
    try {
      await addDoc(collection(db, "budgets"), {
        userId: user.uid,
        category,
        monthlyLimit: limit,
        createdAt: Timestamp.now(),
      });

      setNewCategory("");
      setNewLimit("");
      setError("");
    } catch (err) {
      setError("Erro ao criar orçamento");
      console.error(err);
    } finally {
      setCreating(false);
    }
  }

  async function removeBudget(id: string) {
    if (removingId) return;

    setRemovingId(id);
    try {
      await deleteDoc(doc(db, "budgets", id));
    } catch (err) {
      console.error(err);
    } finally {
      setRemovingId(null);
    }
  }

  function statusFor(percent: number): "ok" | "warn" | "over" {
    if (percent >= 100) return "over";
    if (percent >= 70) return "warn";
    return "ok";
  }

  const loading = loadingBudgets || loadingExpenses;

  return (
    <div className="budgetPanel">
      <div className="budgetHeader">
        <h1 className="budgetTitle">Orçamento</h1>
        <p className="budgetSubtitle">
          Defina limites mensais por categoria de despesa.
        </p>

        {error ? <p className="budgetError">{error}</p> : null}
      </div>

      <div className="budgetMonthSelector">
        <button
          type="button"
          className="budgetMonthButton"
          onClick={handlePreviousMonth}
        >
          ‹
        </button>
        <span className="budgetMonthLabel">
          {formatMonthYear(selectedMonth)}
        </span>
        <button
          type="button"
          className="budgetMonthButton"
          onClick={handleNextMonth}
        >
          ›
        </button>
      </div>

      <div className="budgetCreateBlock">
        <h2 className="budgetSectionTitle">Novo orçamento</h2>

        <div className="budgetCreateRow">
          <select
            className="budgetInput"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          >
            <option value="">Selecione uma categoria</option>
            {availableCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Limite mensal"
            className="budgetInput"
            value={newLimit}
            onChange={(e) => setNewLimit(e.target.value)}
          />

          <button
            type="button"
            className="budgetCreateButton"
            onClick={() => void createBudget()}
            disabled={creating}
          >
            {creating ? "Criando..." : "Criar"}
          </button>
        </div>

        {availableCategories.length === 0 ? (
          <p className="budgetHint">
            Você já tem orçamento para todas as categorias disponíveis.
          </p>
        ) : null}
      </div>

      <div className="budgetListBlock">
        <h2 className="budgetSectionTitle">Limites do mês</h2>

        {loading ? (
          <p className="budgetMessage">Carregando...</p>
        ) : budgets.length === 0 ? (
          <p className="budgetMessage">Nenhum orçamento criado ainda.</p>
        ) : (
          <ul className="budgetList">
            {budgets.map((b) => {
              const spent = expensesByCategory.get(b.category) ?? 0;
              const percent =
                b.monthlyLimit > 0 ? (spent / b.monthlyLimit) * 100 : 0;
              const fillWidth = Math.min(100, percent);
              const status = statusFor(percent);

              return (
                <li key={b.id} className="budgetCard">
                  <div className="budgetCardHeader">
                    <h3 className="budgetCategoryName">{b.category}</h3>

                    <button
                      type="button"
                      className="budgetRemoveButton"
                      onClick={() => void removeBudget(b.id)}
                      disabled={removingId !== null}
                    >
                      {removingId === b.id ? "Removendo..." : "Remover"}
                    </button>
                  </div>

                  <div className="budgetProgressInfo">
                    <span>
                      {BrazilianCurrencyFormatter.format(spent)}
                      {" / "}
                      {BrazilianCurrencyFormatter.format(b.monthlyLimit)}
                    </span>
                    <span className={`budgetPercent budgetPercent--${status}`}>
                      {percent.toFixed(0)}%
                    </span>
                  </div>

                  <div className="budgetProgressBar">
                    <div
                      className={`budgetProgressFill budgetProgressFill--${status}`}
                      style={{ width: `${fillWidth}%` }}
                    />
                  </div>

                  {status === "over" ? (
                    <p className="budgetWarn">
                      Estouro de{" "}
                      {BrazilianCurrencyFormatter.format(
                        spent - b.monthlyLimit
                      )}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
