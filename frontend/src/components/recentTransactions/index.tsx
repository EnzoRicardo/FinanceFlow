import { useEffect, useState } from "react";
import { auth, db } from "../../services/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import "./recentTransactions.css";

type RecentTransactionsCardProps = {
  selectedMonth: Date;
};

type Transaction = {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  createdAt: Date;
  isGoalTransfer: boolean;
};

const BrazilianCurrencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default function RecentTransactions({
  selectedMonth,
}: RecentTransactionsCardProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) {
        setLoading(false);
        setTransactions([]);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

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
      where("createdAt", ">=", startOfMonth),
      where("createdAt", "<", startOfNextMonth),
      orderBy("createdAt", "desc"),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Transaction[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          type: d.type === "income" ? "income" : "expense",
          amount: Number(d.amount) || 0,
          category: String(d.category ?? "Sem categoria"),
          createdAt: d.createdAt?.toDate ? d.createdAt.toDate() : new Date(),
          isGoalTransfer: d.isGoalTransfer === true,
        };
      });

      setTransactions(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedMonth, currentUser]);

  function formatDate(date: Date) {
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });
  }

  return (
    <div className="recentTransactionsCard">
      <h3 className="recentTransactionsTitle">Transações recentes</h3>

      {loading ? (
        <p className="recentTransactionsEmpty">Carregando...</p>
      ) : transactions.length === 0 ? (
        <p className="recentTransactionsEmpty">
          Nenhuma transação no período.
        </p>
      ) : (
        <ul className="recentTransactionsList">
          {transactions.map((item) => {
            const typeClass = item.isGoalTransfer
              ? "recentTransactionTypeGoal"
              : item.type === "income"
                ? "recentTransactionTypeIncome"
                : "recentTransactionTypeExpense";

            const amountClass = item.isGoalTransfer
              ? "recentTransactionAmountGoal"
              : item.type === "income"
                ? "recentTransactionAmountIncome"
                : "recentTransactionAmountExpense";

            const label = item.isGoalTransfer
              ? item.type === "expense"
                ? "Meta"
                : "Resgate"
              : item.type === "income"
                ? "Entrada"
                : "Saída";

            return (
              <li key={item.id} className="recentTransactionItem">
                <span className={typeClass}>{label}</span>

                <span className="recentTransactionCategory">
                  {item.category}
                </span>

                <span className={amountClass}>
                  {item.type === "income" ? "+" : "-"}{" "}
                  {BrazilianCurrencyFormatter.format(item.amount)}
                </span>

                <span className="recentTransactionDate">
                  {formatDate(item.createdAt)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
