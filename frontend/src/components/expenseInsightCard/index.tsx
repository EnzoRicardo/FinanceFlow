import { useEffect, useState } from "react";
import { auth, db } from "../../services/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import "./expenseInsightCard.css";

type ExpenseInsightCardProps = {
  selectedMonth: Date;
};

type CategorySlice = {
  name: string;
  value: number;
};

const PIE_COLORS = [
  "#FF6B6B",
  "#FFD93D",
  "#6BCB77",
  "#4D96FF",
  "#C780FA",
  "#FF9F45",
  "#00C2A8",
  "#F38BA8",
];

const BrazilianCurrencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default function ExpenseInsightCard({
  selectedMonth,
}: ExpenseInsightCardProps) {
  const [data, setData] = useState<CategorySlice[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) {
        setLoading(false);
        setData([]);
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
      where("type", "==", "expense"),
      where("createdAt", ">=", startOfMonth),
      where("createdAt", "<", startOfNextMonth)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const totalsByCategory = new Map<string, number>();

      snapshot.docs.forEach((docSnap) => {
        const d = docSnap.data();
        const category = String(d.category ?? "Sem categoria");
        const amount = Number(d.amount) || 0;
        totalsByCategory.set(
          category,
          (totalsByCategory.get(category) ?? 0) + amount
        );
      });

      const list: CategorySlice[] = Array.from(totalsByCategory.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      setData(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedMonth, currentUser]);

  return (
    <div className="expenseInsightCard">
      <h3 className="expenseInsightTitle">Despesas por categoria</h3>

      {loading ? (
        <p className="expenseInsightEmpty">Carregando...</p>
      ) : data.length === 0 ? (
        <p className="expenseInsightEmpty">Sem despesas no período.</p>
      ) : (
        <ResponsiveContainer width="100%" height="85%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius="80%"
            >
              {data.map((_, index) => (
                <Cell
                  key={index}
                  fill={PIE_COLORS[index % PIE_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) =>
                BrazilianCurrencyFormatter.format(Number(value) || 0)
              }
            />
            <Legend
              verticalAlign="bottom"
              wrapperStyle={{ fontSize: "12px" }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
