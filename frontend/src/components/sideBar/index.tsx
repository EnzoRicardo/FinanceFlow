import './sideBar.css'
import logo from '../../assets/WhiteTextLogo.png'
import { auth } from '../../services/firebase';
import { useState } from 'react';
import { signOut, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useNavigate } from "react-router-dom";
import { useEffect } from 'react';
import { getDoc } from 'firebase/firestore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartPie,
  faMoneyBillWave,
  faChartLine,
  faBullseye,
  faCalendarAlt,
  faWallet,
  faTags,
  faUser,
  faCog,
  faSignOutAlt
} from "@fortawesome/free-solid-svg-icons";
import { Navigate } from 'react-router-dom';



const sideBar = () => {
  const user = auth.currentUser;
  const navigate = useNavigate();
  const [userPhoto, setUserPhoto] = useState<string | null>(user?.photoURL ?? null);
  const username = user?.displayName ?? "";

  useEffect(() => {
    if (!user) return;

    const uid = user.uid;

    async function loadAvatar(){
        const snap = await getDoc(doc(db, "users", uid));

        if (snap.exists()) {
            const data = snap.data();
            if(data.avatar){
                setUserPhoto(data.avatar);
            }
        }
    }

    loadAvatar();
  }, [user]);

  async function handleLogout() {
    try {
        await signOut(auth);
        localStorage.removeItem("token");
        navigate("/login");
    } catch (error) {
        console.error("Error signing out:", error);
    }
  }

  function handleGo(path: string) {
    navigate(path)
  }
  
  async function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    const reader = new FileReader();

    reader.onloadend = async () => {
        const base64 = reader.result as string;

        await setDoc(
            doc(db, "users", user.uid),
            { avatar: base64 },
            { merge: true }
        );
        setUserPhoto(base64);
    }

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
        <div className='sideBar'>
            <div className="top">
                <div className="avatar-wrapper">
                 {userPhoto ? (
                    <img src={userPhoto} alt="User Photo" className="avatar" />
                    ) : (
                    <div className="avatar-placeholder">
                        {getInitials(username)}
                    </div>
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

                    <li onClick={() => handleGo("/transactions")}>
                        <FontAwesomeIcon icon={faMoneyBillWave} />
                        <span>Transações</span>
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

                    <div className="divider" />

                    <li onClick={handleLogout} className="logout">
                        <FontAwesomeIcon icon={faSignOutAlt} />
                        <span>Sair</span>
                    </li>
                </ul>
            </div>

            <div className="bottom2">
                <img src={logo} alt="FinanceFlow Logo" className='logo2' />
            </div>
        </div>
    </>
  )
}

export default sideBar;