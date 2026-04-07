import { useEffect, useState } from "react";
import { auth, db } from "../../services/firebase";
import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import "./income.css";

const BrazilianCurrencyFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
});

type IncomeCardProps = {
  selectedMonth : Date;
};

export default function IncomeCard({selectedMonth}: IncomeCardProps) {
  const [totalIncome, setTotalIncome] = useState(0);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const incomeCategories = [
    "Salário",
    "Dividendos",
    "Investimentos",
    "Presentes",
    "Outros"
  ]

  function openModal() {
    setIsModalOpen(true);
    setError("");
  }

  function closeModal() {
    setIsModalOpen(false);
    setAmount("");
    setCategory("");
    setError("");
  }
  
  async function addTransaction() {
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
        type: "income",
        amount: Number(amount),
        category: category.trim(),
        createdAt: new Date(),
      };


      try {
        await addDoc(collection(db, "transactions"), newTransaction);
        setError("");
        await loadIncome();
        closeModal();
      } catch (err) {
        setError("Erro ao adicionar receita");
        console.error(err);
      }
  }

  async function loadIncome() {
      const user = auth.currentUser;
      if (!user) return;
      
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
        where("type", "==", "income"),
        where("createdAt", ">=", startOfMonth),
        where("createdAt", "<", startOfNextMonth)
      )

      const snapshot = await getDocs(q);

      let sum = 0;

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const value = Number(data.amount) || 0;
        sum += value;
      })

      setTotalIncome(sum);
  }

  useEffect(() => {
    loadIncome();
  }, [selectedMonth]);

  return (
    <>
    <div className="incomeCard">
      <h3 className="titleIncome">Receita</h3>
      <p className="totalIncome">{BrazilianCurrencyFormatter.format(totalIncome)}</p>

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
              {incomeCategories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

          {error && <p className="incomeError">{error}</p>}

          <div className="modalActions">
            <button className="modalBtn" onClick={addTransaction}>Salvar</button>
            <button className="modalBtn" onClick={closeModal}>Cancelar</button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}