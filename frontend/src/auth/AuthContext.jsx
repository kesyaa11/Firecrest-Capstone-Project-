import { createContext, useContext, useState } from "react";
import { AUTH_USERS } from "./authUsers";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = sessionStorage.getItem("authUser");
    return saved ? JSON.parse(saved) : null;
  });

  function login(username, password) {
    const found = AUTH_USERS.find(
      (u) => u.username === username && u.password === password,
    );

    if (found) {
      setUser(found);
      sessionStorage.setItem("authUser", JSON.stringify(found));
      return found;
    }

    return null;
  }

  function logout() {
    setUser(null);
    sessionStorage.removeItem("authUser");
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}