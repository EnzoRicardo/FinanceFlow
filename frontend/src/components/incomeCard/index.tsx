import { useEffect, useState } from "react";
import { auth, db } from "../../services/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { DEFAULT_CATEGORIES } from "../../constants/defaultCategories";
import "./income.css";

const BrazilianCurrencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

type IncomeCardProps = {
  selectedMonth: Date;
};

export default function IncomeCard({ selectedMonth }: IncomeCardProps) {
  const [totalIncome, setTotalIncome] = useState(0);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<"personal" | "business">(
    "personal"
  );
  const [incomeCategories, setIncomeCategories] = useState<
    { id: string; name: string }[]
  >([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  async function loadUserPreset() {
    const user = auth.currentUser;
    if (!user) return;

    const snap = await getDoc(doc(db, "users", user.uid));

    if (snap.exists()) {
      const preset = snap.data().categoryPreset;

      if (preset === "personal" || preset === "business") {
        setActivePreset(preset);
      }
    }
  }

  function openModal() {
    setIsModalOpen(true);
    setError("");
    void loadUserPreset();
    void loadIncomeCategories();
  }

  function closeModal() {
    setIsModalOpen(false);
    setAmount("");
    setCategory("");
    setError("");
  }

  async function addTransaction() {
    if (submitting) return;

    const user = auth.currentUser;
    if (!user) return;

    if (!amount || Number(amount) <= 0) {
      setError("Valor inválido");
      return;
    }

    if (!category.trim()) {
      setError("Categoria obrigatória");
      return;
    }

    const newTransaction = {
      userId: user.uid,
      type: "income",
      amount: Number(amount),
      category: category.trim(),
      createdAt: new Date(),
    };

    setSubmitting(true);
    try {
      await addDoc(collection(db, "transactions"), newTransaction);
      setError("");
      await loadIncome();
      closeModal();
    } catch (err) {
      setError("Erro ao adicionar receita");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  async function loadIncome() {
    const user = currentUser ?? auth.currentUser;
    if (!user) return;

    setLoading(true);

    try {
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
        where("userId", "==", user.uid),
        where("type", "==", "income"),
        where("createdAt", ">=", startOfMonth),
        where("createdAt", "<", startOfNextMonth)
      );

      const snapshot = await getDocs(q);

      let sum = 0;

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const value = Number(data.amount) || 0;
        sum += value;
      });

      setTotalIncome(sum);
    } finally {
      setLoading(false);
    }
  }

  async function loadIncomeCategories() {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "categories"),
      where("userId", "==", user.uid),
      where("type", "==", "income")
    );

    const snapshot = await getDocs(q);

    const list = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        name: String(doc.data().name ?? "").trim(),
      }))
      .filter((c) => c.name.length > 0);

    setIncomeCategories(list);
  }

  useEffect(() => {
    if (!currentUser) return;
    void loadIncome();
  }, [selectedMonth, currentUser]);

  const defaultIncomeCategories = DEFAULT_CATEGORIES[activePreset].income;

  const finalIncomeCategories = [
    ...new Set([
      ...defaultIncomeCategories,
      ...incomeCategories.map((c) => c.name),
    ]),
  ];

  return (
    <>
      <div className="incomeCard">
        <h3 className="titleIncome">Receita</h3>
        <p className="totalIncome">
          {loading
            ? "Carregando..."
            : BrazilianCurrencyFormatter.format(totalIncome)}
        </p>

        <button className="incomeButton" onClick={openModal}>
          Adicionar
        </button>
      </div>

      {isModalOpen && (
        <div className="modalOverlay">
          <div className="incomeModal">
            <h3 className="modalTitle">Registrar entrada</h3>

            <input
              type="number"
              placeholder="Valor"
              className="incomeInput"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />

            <select
              className="incomeInput"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Selecione uma categoria</option>
              {finalIncomeCategories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            {error && <p className="incomeError">{error}</p>}

            <div className="modalActions">
              <button
                className="modalBtn modalBtn--cancel"
                onClick={closeModal}
                disabled={submitting}
              >
                Cancelar
              </button>
              <button
                className="modalBtn modalBtn--save"
                onClick={addTransaction}
                disabled={submitting}
              >
                {submitting ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}