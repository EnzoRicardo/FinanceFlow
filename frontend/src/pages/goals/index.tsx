import "./goals.css";
import SideBar from "../../components/sideBar";
import GoalsPanel from "../../components/goalsPanel";

export default function GoalsPage() {
  return (
    <div className="home-container">
      <div className="home-left">
        <SideBar />
      </div>

      <div className="home-mid-goals">
        <GoalsPanel />
      </div>
    </div>
  );
}
