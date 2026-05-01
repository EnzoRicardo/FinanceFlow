import SideBar from "../../components/sideBar";
import StatementPanel from "../../components/statementPanel";
import "./statement.css";

export default function StatementPage() {
  return (
    <div className="home-container">
      <div className="home-left">
        <SideBar />
      </div>

      <div className="home-mid-categories">
        <StatementPanel />
      </div>
    </div>
  );
}