import { useState } from "react"
import "./login.css"
import card from "../../assets/card2.png"
import shadow from "../../assets/shadow2.png"
import logo from "../../assets/financeFlowBlack.png"
import { Link } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../services/firebase";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2"


export default function Login() {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const isMobile = window.innerWidth <= 768;

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            const token = await user.getIdToken();

            localStorage.setItem("token", token);

            console.log("Usuário logado:", user);

            Swal.fire({
                toast: true,
                position: isMobile ? "top" : "top-end",
                icon: "success",
                title: "Login realizado com sucesso!",
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true,
                customClass: {
                    popup: "ff-toast",
                    title: "ff-toast-title",
                    icon: "ff-toast-icon",
                    timerProgressBar: "ff-toast-progress"
                }
            });

            navigate("/home")
        } catch (error: any) {
            const errorCode = error.code;
            const errorMessage = error.message;

            setError(`Login failed: ${errorMessage}`);

            Swal.fire({
                toast: true,
                position: isMobile ? "top" : "top-end",
                icon: "error",
                title: "Email ou senha incorretos",
                showConfirmButton: false,
                timer: 2500,
                timerProgressBar: true,
                customClass: {
                    popup: "ff-toast error",
                    title: "ff-toast-title",
                    icon: "ff-toast-icon",
                    timerProgressBar: "ff-toast-progress"
                }
            });

            console.error(errorCode, errorMessage);
        }
    }

    return (
        <>
            <section className="login">
                <div className="login-container">
                    <div className="right">
                        <div className="top">
                            <img src={card} alt="card" className="card" />
                            <img src={shadow} alt="shadow" className="shadow" />
                        </div>
                        <div className="bottom">
                            <h2 className="title-gray">
                                Conquiste seus sonhos
                            </h2>
                            <h2 className="title-black">
                                com mais controle.
                            </h2>
                        </div>
                    </div>

                    <div className="left">
                        <img src={logo} alt="logo" className="logo" />

                        <form className="form" onSubmit={handleLogin}>
                            <input 
                                className="input"
                                type="email" 
                                placeholder="Email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)} 
                            />
                            <input 
                                className="input"
                                type="password" 
                                placeholder="Senha" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)} 
                                autoComplete="current-password"
                                required
                            />

                            <button className="btn" type="submit">Entrar</button>

                            <p className="register">
                                Não tem conta?{" "}
                                <Link className="register-link" to="/register">
                                    Registrar-se
                                </Link>
                            </p>
                        </form>
                    </div>
                </div>
            </section>
        </>
    )
}

