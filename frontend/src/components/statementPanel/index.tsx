import { useEffect, useState } from "react";
import { auth, db } from "../../services/firebase";
import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import "./statementPanel.css";

type TransactionType = "income" | "expense";
type FilterType = "all" | TransactionType;

type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  preset?: "personal" | "business";
  createdAt: Date;
};

const BrazilianCurrencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default function StatementPanel() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [loading, setLoading] = useState(false);

  async function loadTransactions() {
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);

    try {
      const q = query(
        collection(db, "transactions"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);

      const list: Transaction[] = snapshot.docs.map((doc) => {
        const data = doc.data();

        return {
          id: doc.id,
          type: data.type === "income" ? "income" : "expense",
          amount: Number(data.amount) || 0,
          category: String(data.category ?? "Sem categoria"),
          preset: data.preset,
          createdAt: data.createdAt?.toDate
            ? data.createdAt.toDate()
            : new Date(),
        };
      });

      setTransactions(list);
    } catch (err) {
      console.error("Erro ao carregar transações:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTransactions();
  }, []);

  const filteredTransactions =
    filter === "all"
      ? transactions
      : transactions.filter((item) => item.type === filter);

  function formatDate(date: Date) {
    return date.toLocaleDateString("pt-BR");
  }

  function formatTime(date: Date) {
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="statementPanel">
      <div className="statementHeader">
        <h1 className="statementTitle">Extrato</h1>
        <p className="statementSubtitle">
          Acompanhe todas as entradas e saídas registradas.
        </p>
      </div>

      <div className="statementFilters">
        <button
          type="button"
          className={`statementFilterButton ${
            filter === "all" ? "activeStatementFilter" : ""
          }`}
          onClick={() => setFilter("all")}
        >
          Todas
        </button>

        <button
          type="button"
          className={`statementFilterButton ${
            filter === "income" ? "activeStatementFilter" : ""
          }`}
          onClick={() => setFilter("income")}
        >
          Entradas
        </button>

        <button
          type="button"
          className={`statementFilterButton ${
            filter === "expense" ? "activeStatementFilter" : ""
          }`}
          onClick={() => setFilter("expense")}
        >
          Saídas
        </button>
      </div>

      <div className="statementTable">
        <div className="statementTableHeader">
          <span>Tipo</span>
          <span>Categoria</span>
          <span>Valor</span>
          <span>Data</span>
          <span>Hora</span>
        </div>

        {loading ? (
          <p className="statementMessage">Carregando transações...</p>
        ) : filteredTransactions.length === 0 ? (
          <p className="statementMessage">Nenhuma transação encontrada.</p>
        ) : (
          <div className="statementList">
            {filteredTransactions.map((item) => (
              <div key={item.id} className="statementItem">
                <span
                  className={
                    item.type === "income"
                      ? "statementTypeIncome"
                      : "statementTypeExpense"
                  }
                >
                  {item.type === "income" ? "Entrada" : "Saída"}
                </span>

                <span>{item.category}</span>

                <span
                  className={
                    item.type === "income"
                      ? "statementAmountIncome"
                      : "statementAmountExpense"
                  }
                >
                  {item.type === "income" ? "+" : "-"}{" "}
                  {BrazilianCurrencyFormatter.format(item.amount)}
                </span>

                <span>{formatDate(item.createdAt)}</span>
                <span>{formatTime(item.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}