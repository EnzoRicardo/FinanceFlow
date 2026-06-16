import { useEffect, useMemo, useState, type ReactNode } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";
import type { UserRole } from "../types/user";
import { AuthContext } from "./auth-context";

function normalizeRole(value: unknown): UserRole {
  return value === "admin" ? "admin" : "user";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState(auth.currentUser);
  const [role, setRole] = useState<UserRole>("user");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setFirebaseUser(nextUser);

      if (!nextUser) {
        setRole("user");
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const snap = await getDoc(doc(db, "users", nextUser.uid));
        const storedRole = snap.exists() ? snap.data()?.role : undefined;
        setRole(normalizeRole(storedRole));
      } catch (error) {
        console.error("Erro ao carregar perfil do usuário:", error);
        setRole("user");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const value = useMemo(
    () => ({
      firebaseUser,
      role,
      isAdmin: role === "admin",
      loading,
    }),
    [firebaseUser, role, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
