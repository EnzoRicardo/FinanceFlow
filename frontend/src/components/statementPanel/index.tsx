import { useEffect, useState } from "react";
import { auth, db } from "../../services/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import "./statementPanel.css";

type TransactionType = "income" | "expense";
type FilterType = "all" | TransactionType | "goal";

type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  preset?: "personal" | "business";
  createdAt: Date;
  isGoalTransfer: boolean;
};

const BrazilianCurrencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default function StatementPanel() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setTransactions([]);
        setLoading(false);
        return;
      }

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
            isGoalTransfer: data.isGoalTransfer === true,
          };
        });

        setTransactions(list);
      } catch (err) {
        console.error("Erro ao carregar transações:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const filteredTransactions =
    filter === "all"
      ? transactions
      : filter === "goal"
        ? transactions.filter((item) => item.isGoalTransfer)
        : transactions.filter(
            (item) => item.type === filter && !item.isGoalTransfer
          );

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

        <button
          type="button"
          className={`statementFilterButton ${
            filter === "goal" ? "activeStatementFilter" : ""
          }`}
          onClick={() => setFilter("goal")}
        >
          Metas
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
            {filteredTransactions.map((item) => {
              const typeClass = item.isGoalTransfer
                ? "statementTypeGoal"
                : item.type === "income"
                  ? "statementTypeIncome"
                  : "statementTypeExpense";

              const amountClass = item.isGoalTransfer
                ? "statementAmountGoal"
                : item.type === "income"
                  ? "statementAmountIncome"
                  : "statementAmountExpense";

              const label = item.isGoalTransfer
                ? item.type === "expense"
                  ? "Aplicação em meta"
                  : "Resgate de meta"
                : item.type === "income"
                  ? "Entrada"
                  : "Saída";

              return (
                <div key={item.id} className="statementItem">
                  <span className={typeClass}>{label}</span>

                  <span>{item.category}</span>

                  <span className={amountClass}>
                    {item.type === "income" ? "+" : "-"}{" "}
                    {BrazilianCurrencyFormatter.format(item.amount)}
                  </span>

                  <span>{formatDate(item.createdAt)}</span>
                  <span>{formatTime(item.createdAt)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}