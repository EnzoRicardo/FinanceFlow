import "./users.css";
import SideBar from "../../components/sideBar";
import UsersPanel from "../../components/usersPanel";

export default function UsersPage() {
  return (
    <div className="home-container">
      <div className="home-left">
        <SideBar />
      </div>

      <div className="home-mid-users">
        <UsersPanel />
      </div>
    </div>
  );
}
