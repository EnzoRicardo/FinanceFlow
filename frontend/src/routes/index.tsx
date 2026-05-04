import { Navigate, Routes, Route } from "react-router-dom";
import Login from "../pages/login";
import CreateAccount from "../pages/createAccount";
import Home from "../pages/home";
import CategoriesPage from "../pages/categories";
import StatementPage from "../pages/statement";
import GoalsPage from "../pages/goals";
import BudgetPage from "../pages/budget";
import ReportsPage from "../pages/reports";

export default function AppRoutes() {
    return (
        <Routes>

            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" />} />
            <Route path="/register" element={<CreateAccount />} />
            <Route path="/home" element={<Home />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/statement" element={<StatementPage />} />
            <Route path="/goals" element={<GoalsPage />} />
            <Route path="/budget" element={<BudgetPage />} />
            <Route path="/reports" element={<ReportsPage />} />


        </Routes>
    )
}