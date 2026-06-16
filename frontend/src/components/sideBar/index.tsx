import "./sideBar.css";
import logo from "../../assets/WhiteTextLogo.png";
import { auth } from "../../services/firebase";
import { useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../services/firebase";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { getDoc } from "firebase/firestore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartPie,
  faMoneyBillWave,
  faChartLine,
  faBullseye,
  faCalendarAlt,
  faWallet,
  faTags,
  faUsers,
  faSignOutAlt,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../contexts/AuthContext";

const SideBar = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [userPhoto, setUserPhoto] = useState<string | null>(
    auth.currentUser?.photoURL ?? null,
  );
  const [loggingOut, setLoggingOut] = useState(false);
  const username = user?.displayName ?? "";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setUserPhoto(nextUser?.photoURL ?? null);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const uid = user.uid;

    async function loadAvatar() {
      const snap = await getDoc(doc(db, "users", uid));

      if (snap.exists()) {
        const data = snap.data();
        if (data.avatar) {
          setUserPhoto(data.avatar);
        }
      }
    }

    loadAvatar();
  }, [user]);

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
      setLoggingOut(false);
    }
  }

  function handleGo(path: string) {
    navigate(path);
  }

  async function handleAvatarChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    const reader = new FileReader();

    reader.onloadend = async () => {
      const base64 = reader.result as string;

      await setDoc(
        doc(db, "users", user.uid),
        { avatar: base64 },
        { merge: true },
      );
      setUserPhoto(base64);
    };

    reader.readAsDataURL(file);
  }

  function getInitials(name: string | null | undefined) {
    if (!name) return "??";

    const parts = name.trim().split(" ");

    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }

    const first = parts[0][0];
    const last = parts[parts.length - 1][0];

    return (first + last).toUpperCase();
  }

  return (
    <>
      <div className="sideBar">
        <div className="top">
          <div className="avatar-wrapper">
            {userPhoto ? (
              <img src={userPhoto} alt="User Photo" className="avatar" />
            ) : (
              <div className="avatar-placeholder">{getInitials(username)}</div>
            )}

            <div className="avatar-overlay">
              <span>Trocar</span>
            </div>

            <input
              type="file"
              accept="image/*"
              className="avatar-input"
              onChange={handleAvatarChange}
            />
          </div>
        </div>

        <div className="mid">
          <ul className="menu">
            <li onClick={() => handleGo("/home")}>
              <FontAwesomeIcon icon={faChartPie} />
              <span>Dashboard</span>
            </li>

            <li onClick={() => handleGo("/statement")}>
              <FontAwesomeIcon icon={faMoneyBillWave} />
              <span>Extrato</span>
            </li>

            <li onClick={() => handleGo("/reports")}>
              <FontAwesomeIcon icon={faChartLine} />
              <span>Relatórios</span>
            </li>

            <div className="divider" />

            <li onClick={() => handleGo("/goals")}>
              <FontAwesomeIcon icon={faBullseye} />
              <span>Metas</span>
            </li>

            <li onClick={() => handleGo("/budget")}>
              <FontAwesomeIcon icon={faCalendarAlt} />
              <span>Orçamento</span>
            </li>

            <div className="divider" />

            <li onClick={() => handleGo("/accounts")}>
              <FontAwesomeIcon icon={faWallet} />
              <span>Contas</span>
            </li>

            <li onClick={() => handleGo("/categories")}>
              <FontAwesomeIcon icon={faTags} />
              <span>Categorias</span>
            </li>

            {isAdmin && (
              <li onClick={() => handleGo("/users")}>
                <FontAwesomeIcon icon={faUsers} />
                <span>Usuários</span>
              </li>
            )}

            <div className="divider" />

            <li
              onClick={handleLogout}
              className={`logout ${loggingOut ? "disabled" : ""}`}
            >
              <FontAwesomeIcon icon={faSignOutAlt} />
              <span>{loggingOut ? "Saindo..." : "Sair"}</span>
            </li>
          </ul>
        </div>

        <div className="bottom2">
          <img src={logo} alt="FinanceFlow Logo" className="logo2" />
        </div>
      </div>
    </>
  );
};

export default SideBar;
