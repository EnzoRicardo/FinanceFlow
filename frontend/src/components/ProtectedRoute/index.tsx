import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

type ProtectedRouteProps = {
  children: React.ReactNode;
};

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { firebaseUser, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!firebaseUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
