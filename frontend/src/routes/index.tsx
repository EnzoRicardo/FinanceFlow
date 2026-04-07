import { Navigate, Routes, Route } from "react-router-dom";
import Login from "../pages/login";
import CreateAccount from "../pages/createAccount";
import Home from "../pages/home";
import CategoriesPage from "../pages/categories";

export default function AppRoutes() {
    return (
        <Routes>

            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" />} />
            <Route path="/register" element={<CreateAccount />} />
            <Route path="/home" element={<Home />} />
            <Route path="/categories" element={<CategoriesPage />} />
            

        </Routes>
    )
}