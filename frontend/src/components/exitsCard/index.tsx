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
import "./exitsCard.css";

const BrazilianCurrencyFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
});

type ExitCardProps = {
  selectedMonth : Date;
}

export default function ExitsCard({selectedMonth}: ExitCardProps) {
  const [totalExits, setTotalExits] = useState(0);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [exitCategories, setExitCategories] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([]);
  const [accountId, setAccountId] = useState("");
  const [activePreset, setActivePreset] = useState<"personal" | "business">("personal");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  async function loadExpenseCategories() {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "categories"),
      where("userId", "==", user.uid),
      where("type", "==", "expense"),
    );

    const snapshot = await getDocs(q);
    const list = snapshot.docs
      .map((d) => ({
        id: d.id,
        name: String(d.data().name ?? "").trim(),
      }))
      .filter((c) => c.name.length > 0);
    setExitCategories(list);
  }

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
    void loadExpenseCategories();
    void loadUserPreset();
    void loadAccounts();
  }

  function closeModal() {
    setIsModalOpen(false);
    setAmount("");
    setCategory("");
    setAccountId("");
    setError("");
  }

  async function loadAccounts() {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "accounts"),
      where("userId", "==", user.uid)
    );

    const snapshot = await getDocs(q);
    const list = snapshot.docs
      .map((d) => ({ id: d.id, name: String(d.data().name ?? "").trim() }))
      .filter((a) => a.name.length > 0)
      .sort((a, b) => a.name.localeCompare(b.name));

    setAccounts(list);
  }
  
  async function addTransaction() {
      if (submitting) return;

      const user = auth.currentUser;
      if (!user) return;

      if (!amount || Number(amount) <= 0) {
        console.error("Valor inválido");
        setError("Valor inválido");
        return;
      }

      if (!category.trim()) {
        console.error("Categoria obrigatória");
        setError("Categoria obrigatória");
        return;
      }

      const newTransaction = {
        userId: user.uid,
        type: "expense",
        amount: Number(amount),
        category: category.trim(),
        accountId: accountId || null,
        createdAt: new Date(),
      };

      setSubmitting(true);
      try {
        await addDoc(collection(db, "transactions"), newTransaction);
        setError("");
        await loadExits();
        closeModal();
      } catch (err) {
        setError("Erro ao adicionar despesa");
        console.error(err);
      } finally {
        setSubmitting(false);
      }
  }

  async function loadExits() {
      const user = currentUser ?? auth.currentUser;
      if (!user) return;

      setLoading(true);

      try {
        const startOfMonth = new Date(
          selectedMonth.getFullYear(),
          selectedMonth.getMonth(),
          1
        )

        const startOfNextMonth = new Date(
          selectedMonth.getFullYear(),
          selectedMonth.getMonth() + 1,
          1
        )

        const q = query(
          collection(db, "transactions"),
          where("userId", "==", user.uid),
          where("type", "==", "expense"),
          where("createdAt", ">=", startOfMonth),
          where("createdAt", "<", startOfNextMonth)
        )

        const snapshot = await getDocs(q);

        let sum = 0;

        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          if (data.isGoalTransfer === true) return;
          const value = Number(data.amount) || 0;
          sum += value;
        })

        setTotalExits(sum);
      } finally {
        setLoading(false);
      }
  }

  useEffect(() => {
    if (!currentUser) return;
    loadExits();
  }, [selectedMonth, currentUser]);

  const defaultExpenseCategories = DEFAULT_CATEGORIES[activePreset].expenses;

  const finalExpenseCategories = [
    ...new Set([
      ...defaultExpenseCategories,
      ...exitCategories.map((c) => c.name)
    ])
  ]

  return (
    <>
    <div className="exitsCard">
      <h3 className="titleExits">Despesas</h3>
      <p className="totalExits">
        {loading
          ? "Carregando..."
          : BrazilianCurrencyFormatter.format(totalExits)}
      </p>

      <button className="exitsButton" onClick={openModal}>
        Registrar saída
      </button>
    </div>

    {isModalOpen && (
      <div className="modalOverlay">
        <div className="exitsModal">
          <h3 className="modalTitle">Registrar despesa</h3>

           <input
              type="number"
              placeholder="Valor"
              className="exitsInput"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />

            <select
              className="exitsInput"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Selecione uma categoria</option>
              {finalExpenseCategories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            {accounts.length > 0 && (
              <select
                className="exitsInput"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
              >
                <option value="">Sem conta</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            )}

          {error && <p className="exitsError">{error}</p>}

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