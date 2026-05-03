import "./budget.css";
import SideBar from "../../components/sideBar";
import BudgetPanel from "../../components/budgetPanel";

export default function BudgetPage() {
  return (
    <div className="home-container">
      <div className="home-left">
        <SideBar />
      </div>

      <div className="home-mid-budget">
        <BudgetPanel />
      </div>
    </div>
  );
}
