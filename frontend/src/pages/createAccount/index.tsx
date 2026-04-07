import React, { useEffect, useState } from "react"
import "./createAccount.css"
import card from "../../assets/card1.png"
import shadow from "../../assets/shadow1.png"
import logo from "../../assets/financeFlowBlack.png"
import { Link } from "react-router-dom";
import { api } from "../../services/api";
import Swal from "sweetalert2";

export default function CreateAccount() {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [successMessage, setSuccessMessage] = useState(false);


    
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        try {
            const res = await api.post("/auth/register", {
                name,
                email,
                password
            });
            console.log("Criado:", res.data);
            await Swal.fire({
                title: "Conta criada com sucesso!",
                text: "Sua conta foi criada com sucesso! Bem-vindo ao FinanceFlow.",
                icon: "success",
                confirmButtonText: "OK",
                buttonsStyling: false,
                customClass: {
                    popup: "ff-popup",
                    title: "ff-title",
                    htmlContainer: "ff-text",
                    confirmButton: "ff-confirm",
                }
            })
        } catch (err: any) {
            const detail = err?.response?.data?.detail;

            const message =
                typeof detail === "string"
                ? detail
                : Array.isArray(detail)
                    ? detail.map((d) => d?.msg ?? String(d)).join("\n")
                    : "Erro ao criar conta. Tente novamente.";

            Swal.fire({
                title: "Erro ao criar conta",
                text: message,
                icon: "error",
                confirmButtonText: "OK",
                buttonsStyling: false,
                customClass: {
                popup: "ff-popup",
                title: "ff-title",
                htmlContainer: "ff-text",
                confirmButton: "ff-confirm",
                }
            });
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

                        <form className="form" onSubmit={handleSubmit}>
                            <input 
                                className="input"
                                type="text" 
                                placeholder="Nome" 
                                value={name}
                                onChange={(e) => setName(e.target.value)} 
                            />
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

                            <button className="btn" type="submit">Criar conta</button>

                            {successMessage && (
                                <span className="success-message" >Conta criada com sucesso!</span>
                            )}

                            <p className="register">
                                Já possuí conta?{" "}
                                <Link className="register-link" to="/login">
                                    Entrar
                                </Link>
                            </p>    
                        </form>
                    </div>
                </div>
            </section>
        </>
    )
}

