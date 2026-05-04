import "./reports.css";
import SideBar from "../../components/sideBar";
import ReportsPanel from "../../components/reportsPanel";

export default function ReportsPage() {
  return (
    <div className="home-container">
      <div className="home-left">
        <SideBar />
      </div>

      <div className="home-mid-reports">
        <ReportsPanel />
      </div>
    </div>
  );
}
