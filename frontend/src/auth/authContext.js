import { createContext, useContext } from "react";

// Shared authContext
export const AuthContext = createContext(null);

// Custom hook to access authContext
export function useAuth() {
  return useContext(AuthContext);
}
