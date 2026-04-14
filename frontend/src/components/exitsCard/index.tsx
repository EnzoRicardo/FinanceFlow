import { useEffect, useState } from "react";
import { auth, db } from "../../services/firebase";
import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
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
  const [exitCategories, setExitCategories] = useState<string []>([]);

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
        type: "expense",
        amount: Number(amount),
        category: category.trim(),
        createdAt: new Date(),
      };


      try {
        await addDoc(collection(db, "transactions"), newTransaction);
        setError("");
        await loadExits();
        closeModal();
      } catch (err) {
        setError("Erro ao adicionar despesa");
        console.error(err);
      }
  }

  async function loadExits() {
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
        where("type", "==", "expense"),
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

      setTotalExits(sum);
  }

  useEffect(() => {
    loadExits();
  }, [selectedMonth]);

  return (
    <>
    <div className="exitsCard">
      <h3 className="titleExits">Despesas</h3>
      <p className="totalExits">{BrazilianCurrencyFormatter.format(totalExits)}</p>

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
              {exitCategories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

          {error && <p className="exitsError">{error}</p>}

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