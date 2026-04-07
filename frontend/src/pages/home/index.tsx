import "./home.css";
import React, { useState } from "react";
import SideBar from "../../components/sideBar";
import IncomeCard from "../../components/incomeCard";
import ExitsCard from "../../components/exitsCard";
import TotalCard from "../../components/totalCard";
import TopHeader from "../../components/topHeader";
import ExpenseInsightCard from "../../components/expenseInsightCard";
import RecentTransactions from "../../components/recentTransactions";

const Home = () => {
  const [selectedMonth, setSelectedMonth] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );

  const handlePreviousMonth = () => {
    setSelectedMonth(
      new Date(
        selectedMonth.getFullYear(),
        selectedMonth.getMonth() - 1,
        1
      )
    );
  };

  const handleNextMonth = () => {
    setSelectedMonth(
      new Date(
        selectedMonth.getFullYear(),
        selectedMonth.getMonth() + 1,
        1
      )
    );
  };

  return (
    <div className="home-container">
      <div className="home-left">
        <SideBar />
      </div>

      <div className="home-right">
        <TopHeader
          selectedMonth={selectedMonth}
          onPreviousMonth={handlePreviousMonth}
          onNextMonth={handleNextMonth}
        />

        <div className="home-mid">
          <IncomeCard selectedMonth={selectedMonth} />
          <ExitsCard selectedMonth={selectedMonth} />
          <TotalCard selectedMonth={selectedMonth} />
          <ExpenseInsightCard selectedMonth={selectedMonth} />
          <RecentTransactions selectedMonth={selectedMonth} />
        </div>
      </div>
    </div>
  );
};

export default Home;