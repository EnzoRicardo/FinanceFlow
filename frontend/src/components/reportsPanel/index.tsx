import { useEffect, useMemo, useState } from "react";
import { auth, db } from "../../services/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "./reportsPanel.css";

type TransactionType = "income" | "expense";

type Transaction = {
  type: TransactionType;
  amount: number;
  category: string;
  createdAt: Date;
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

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatMonthYear(date: Date) {
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function formatShortMonth(date: Date) {
  return date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
}

function isSameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export default function ReportsPanel() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [transactions, setTransactions] = useState<Transaction[]>([]);
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

    const start = new Date(
      selectedMonth.getFullYear(),
      selectedMonth.getMonth() - 5,
      1
    );
    const end = new Date(
      selectedMonth.getFullYear(),
      selectedMonth.getMonth() + 1,
      1
    );

    const q = query(
      collection(db, "transactions"),
      where("userId", "==", currentUser.uid),
      where("createdAt", ">=", start),
      where("createdAt", "<", end)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Transaction[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          type: d.type === "income" ? "income" : "expense",
          amount: Number(d.amount) || 0,
          category: String(d.category ?? "Sem categoria"),
          createdAt: d.createdAt?.toDate ? d.createdAt.toDate() : new Date(),
        };
      });

      setTransactions(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, selectedMonth]);

  function previousMonth() {
    setSelectedMonth(
      new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1)
    );
  }

  function nextMonth() {
    setSelectedMonth(
      new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1)
    );
  }

  const previousMonthDate = useMemo(
    () => new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1),
    [selectedMonth]
  );

  const currentMonthTx = useMemo(
    () => transactions.filter((t) => isSameMonth(t.createdAt, selectedMonth)),
    [transactions, selectedMonth]
  );

  const previousMonthTx = useMemo(
    () => transactions.filter((t) => isSameMonth(t.createdAt, previousMonthDate)),
    [transactions, previousMonthDate]
  );

  const summary = useMemo(() => {
    const calc = (txs: Transaction[]) => {
      let income = 0;
      let expense = 0;
      txs.forEach((t) => {
        if (t.type === "income") income += t.amount;
        else expense += t.amount;
      });
      const balance = income - expense;
      const savingsRate = income > 0 ? (balance / income) * 100 : 0;
      return { income, expense, balance, savingsRate };
    };

    return { current: calc(currentMonthTx), previous: calc(previousMonthTx) };
  }, [currentMonthTx, previousMonthTx]);

  const monthSeries = useMemo(() => {
    const buckets = new Map<string, { receitas: number; despesas: number; date: Date }>();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(
        selectedMonth.getFullYear(),
        selectedMonth.getMonth() - i,
        1
      );
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      buckets.set(key, { receitas: 0, despesas: 0, date: d });
    }

    transactions.forEach((t) => {
      const key = `${t.createdAt.getFullYear()}-${t.createdAt.getMonth()}`;
      const bucket = buckets.get(key);
      if (!bucket) return;
      if (t.type === "income") bucket.receitas += t.amount;
      else bucket.despesas += t.amount;
    });

    return Array.from(buckets.values()).map((b) => ({
      mes: formatShortMonth(b.date),
      receitas: b.receitas,
      despesas: b.despesas,
    }));
  }, [transactions, selectedMonth]);

  const expenseByCategory = useMemo(() => {
    const totals = new Map<string, number>();
    currentMonthTx.forEach((t) => {
      if (t.type !== "expense") return;
      totals.set(t.category, (totals.get(t.category) ?? 0) + t.amount);
    });
    return Array.from(totals.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [currentMonthTx]);

  const incomeByCategory = useMemo(() => {
    const totals = new Map<string, number>();
    currentMonthTx.forEach((t) => {
      if (t.type !== "income") return;
      totals.set(t.category, (totals.get(t.category) ?? 0) + t.amount);
    });
    return Array.from(totals.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [currentMonthTx]);

  const topExpenses = useMemo(() => {
    const total = expenseByCategory.reduce((s, c) => s + c.value, 0);
    return expenseByCategory.slice(0, 5).map((c) => ({
      ...c,
      percent: total > 0 ? (c.value / total) * 100 : 0,
    }));
  }, [expenseByCategory]);

  type CategoryDelta = {
    category: string;
    current: number;
    previous: number;
    deltaAbs: number;
    deltaPercent: number | null;
    status: "up" | "down" | "same" | "new" | "gone";
  };

  const categoryComparison = useMemo<CategoryDelta[]>(() => {
    const currTotals = new Map<string, number>();
    const prevTotals = new Map<string, number>();

    currentMonthTx.forEach((t) => {
      if (t.type !== "expense") return;
      currTotals.set(t.category, (currTotals.get(t.category) ?? 0) + t.amount);
    });

    previousMonthTx.forEach((t) => {
      if (t.type !== "expense") return;
      prevTotals.set(t.category, (prevTotals.get(t.category) ?? 0) + t.amount);
    });

    const allCategories = new Set<string>([
      ...currTotals.keys(),
      ...prevTotals.keys(),
    ]);

    const list: CategoryDelta[] = [];

    allCategories.forEach((category) => {
      const current = currTotals.get(category) ?? 0;
      const previous = prevTotals.get(category) ?? 0;
      const deltaAbs = current - previous;

      let status: CategoryDelta["status"];
      let deltaPercent: number | null;

      if (previous === 0 && current > 0) {
        status = "new";
        deltaPercent = null;
      } else if (current === 0 && previous > 0) {
        status = "gone";
        deltaPercent = -100;
      } else if (deltaAbs === 0) {
        status = "same";
        deltaPercent = 0;
      } else {
        status = deltaAbs > 0 ? "up" : "down";
        deltaPercent = (deltaAbs / previous) * 100;
      }

      list.push({ category, current, previous, deltaAbs, deltaPercent, status });
    });

    list.sort((a, b) => Math.abs(b.deltaAbs) - Math.abs(a.deltaAbs));

    return list;
  }, [currentMonthTx, previousMonthTx]);

  function deltaPercent(curr: number, prev: number): number | null {
    if (prev === 0) return null;
    return ((curr - prev) / Math.abs(prev)) * 100;
  }

  function renderDelta(delta: number | null, invertColors = false) {
    if (delta === null) return <span className="reportsDeltaNeutral">—</span>;
    const isPositive = delta >= 0;
    const colorClass = invertColors
      ? isPositive
        ? "reportsDeltaBad"
        : "reportsDeltaGood"
      : isPositive
        ? "reportsDeltaGood"
        : "reportsDeltaBad";
    return (
      <span className={colorClass}>
        {isPositive ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}%
      </span>
    );
  }

  const hasData =
    currentMonthTx.length > 0 || monthSeries.some((m) => m.receitas > 0 || m.despesas > 0);

  return (
    <div className="reportsPanel">
      <div className="reportsHeader">
        <h1 className="reportsTitle">Relatórios</h1>
        <p className="reportsSubtitle">
          Visão geral das suas finanças e comparação entre períodos.
        </p>
      </div>

      <div className="reportsMonthSelector">
        <button type="button" className="reportsMonthButton" onClick={previousMonth}>
          ‹
        </button>
        <span className="reportsMonthLabel">{formatMonthYear(selectedMonth)}</span>
        <button type="button" className="reportsMonthButton" onClick={nextMonth}>
          ›
        </button>
      </div>

      {loading ? (
        <p className="reportsMessage">Carregando relatórios...</p>
      ) : !hasData ? (
        <p className="reportsMessage">Sem dados nos últimos 6 meses.</p>
      ) : (
        <>
          <div className="reportsSummaryGrid">
            <div className="reportsSummaryCard">
              <span className="reportsSummaryLabel">Receitas</span>
              <span className="reportsSummaryValueIncome">
                {BRL.format(summary.current.income)}
              </span>
              <span className="reportsSummaryDelta">
                vs mês anterior:{" "}
                {renderDelta(deltaPercent(summary.current.income, summary.previous.income))}
              </span>
            </div>

            <div className="reportsSummaryCard">
              <span className="reportsSummaryLabel">Despesas</span>
              <span className="reportsSummaryValueExpense">
                {BRL.format(summary.current.expense)}
              </span>
              <span className="reportsSummaryDelta">
                vs mês anterior:{" "}
                {renderDelta(
                  deltaPercent(summary.current.expense, summary.previous.expense),
                  true
                )}
              </span>
            </div>

            <div className="reportsSummaryCard">
              <span className="reportsSummaryLabel">Saldo</span>
              <span
                className={
                  summary.current.balance >= 0
                    ? "reportsSummaryValueIncome"
                    : "reportsSummaryValueExpense"
                }
              >
                {BRL.format(summary.current.balance)}
              </span>
              <span className="reportsSummaryDelta">
                vs mês anterior:{" "}
                {renderDelta(deltaPercent(summary.current.balance, summary.previous.balance))}
              </span>
            </div>

            <div className="reportsSummaryCard">
              <span className="reportsSummaryLabel">Taxa de economia</span>
              <span
                className={
                  summary.current.savingsRate >= 0
                    ? "reportsSummaryValueIncome"
                    : "reportsSummaryValueExpense"
                }
              >
                {summary.current.savingsRate.toFixed(1)}%
              </span>
              <span className="reportsSummarySecondary">
                {summary.current.balance >= 0 ? "Guardou " : "Faltou "}
                {BRL.format(Math.abs(summary.current.balance))}
              </span>
              <span className="reportsSummaryDelta">
                mês anterior: {summary.previous.savingsRate.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="reportsChartBlock">
            <h2 className="reportsSectionTitle">Receitas vs Despesas (últimos 6 meses)</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="mes" stroke="#bbb" tick={{ fill: "#bbb", fontSize: 12 }} />
                <YAxis stroke="#bbb" tick={{ fill: "#bbb", fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => BRL.format(Number(value) || 0)}
                  contentStyle={{
                    backgroundColor: "#2c2c2c",
                    border: "1px solid #444",
                    borderRadius: 8,
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="receitas" fill="#6BCB77" radius={[6, 6, 0, 0]} />
                <Bar dataKey="despesas" fill="#FF6B6B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="reportsTwoColumn">
            <div className="reportsChartBlock">
              <h2 className="reportsSectionTitle">Despesas por categoria</h2>
              {expenseByCategory.length === 0 ? (
                <p className="reportsMessage">Sem despesas no mês.</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={expenseByCategory}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius="75%"
                    >
                      {expenseByCategory.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => BRL.format(Number(value) || 0)}
                      contentStyle={{
                        backgroundColor: "#2c2c2c",
                        border: "1px solid #444",
                        borderRadius: 8,
                      }}
                    />
                    <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="reportsChartBlock">
              <h2 className="reportsSectionTitle">Receitas por categoria</h2>
              {incomeByCategory.length === 0 ? (
                <p className="reportsMessage">Sem receitas no mês.</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={incomeByCategory}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius="75%"
                    >
                      {incomeByCategory.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => BRL.format(Number(value) || 0)}
                      contentStyle={{
                        backgroundColor: "#2c2c2c",
                        border: "1px solid #444",
                        borderRadius: 8,
                      }}
                    />
                    <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="reportsChartBlock">
            <h2 className="reportsSectionTitle">Top 5 categorias com maior gasto</h2>
            {topExpenses.length === 0 ? (
              <p className="reportsMessage">Sem despesas no mês.</p>
            ) : (
              <ul className="reportsTopList">
                {topExpenses.map((c, i) => (
                  <li key={c.name} className="reportsTopItem">
                    <span
                      className="reportsTopRank"
                      style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                    >
                      {i + 1}
                    </span>
                    <span className="reportsTopName">{c.name}</span>
                    <div className="reportsTopBar">
                      <div
                        className="reportsTopBarFill"
                        style={{
                          width: `${c.percent}%`,
                          backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                        }}
                      />
                    </div>
                    <span className="reportsTopValue">{BRL.format(c.value)}</span>
                    <span className="reportsTopPercent">{c.percent.toFixed(1)}%</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="reportsChartBlock">
            <h2 className="reportsSectionTitle">
              Comparativo por categoria vs mês anterior
            </h2>
            {categoryComparison.length === 0 ? (
              <p className="reportsMessage">Sem dados para comparar.</p>
            ) : (
              <ul className="reportsCompareList">
                {categoryComparison.map((c) => {
                  const isUp = c.status === "up" || c.status === "new";
                  const isDown = c.status === "down" || c.status === "gone";

                  let badge: React.ReactNode;
                  if (c.status === "new") {
                    badge = <span className="reportsCompareBadgeNew">Novo gasto</span>;
                  } else if (c.status === "gone") {
                    badge = <span className="reportsCompareBadgeGone">Zerou</span>;
                  } else if (c.status === "same") {
                    badge = <span className="reportsCompareBadgeSame">Sem variação</span>;
                  } else {
                    badge = (
                      <span
                        className={
                          isUp ? "reportsCompareBadgeUp" : "reportsCompareBadgeDown"
                        }
                      >
                        {isUp ? "▲" : "▼"} {Math.abs(c.deltaPercent ?? 0).toFixed(1)}%
                      </span>
                    );
                  }

                  const sentence =
                    c.status === "new"
                      ? `Não tinha mês passado`
                      : c.status === "gone"
                        ? `Gastava ${BRL.format(c.previous)} mês passado`
                        : c.status === "same"
                          ? `Igual ao mês anterior`
                          : `${isUp ? "+" : "−"} ${BRL.format(Math.abs(c.deltaAbs))} ${
                              isUp ? "a mais" : "a menos"
                            } que mês passado`;

                  return (
                    <li key={c.category} className="reportsCompareItem">
                      <div className="reportsCompareTop">
                        <span className="reportsCompareName">{c.category}</span>
                        {badge}
                      </div>

                      <div className="reportsCompareValues">
                        <span className="reportsCompareCurrent">
                          {BRL.format(c.current)}
                        </span>
                        <span className="reportsComparePrevious">
                          mês anterior: {BRL.format(c.previous)}
                        </span>
                      </div>

                      <p
                        className={`reportsCompareSentence ${
                          isUp
                            ? "compareSentenceBad"
                            : isDown
                              ? "compareSentenceGood"
                              : "compareSentenceNeutral"
                        }`}
                      >
                        {sentence}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
