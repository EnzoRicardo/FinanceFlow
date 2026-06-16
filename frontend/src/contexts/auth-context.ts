import { createContext } from "react";
import type { User } from "firebase/auth";
import type { UserRole } from "../types/user";

export interface AuthContextValue {
  firebaseUser: User | null;
  role: UserRole;
  isAdmin: boolean;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
