import "./accounts.css";
import SideBar from "../../components/sideBar";
import AccountsPanel from "../../components/accountsPanel";

export default function AccountsPage() {
  return (
    <div className="home-container">
      <div className="home-left">
        <SideBar />
      </div>

      <div className="home-mid-accounts">
        <AccountsPanel />
      </div>
    </div>
  );
}
