import { createContext, useContext, useEffect, useRef, useState } from "react";
import { AUTH_USERS } from "./authUsers";
import { API_BASE_URL, AUTH_MODE, userManager } from "./oidc";
import { apiFetch, UNAUTHORIZED_EVENT } from "../api/apiFetch";

const AuthContext = createContext(null);

// Frontend role names used by the pages, keyed by the role the API returns from /me
const ROLE_BY_API_ROLE = {
  manager: "manager",
  dev: "developer",
  developer: "developer",
  sd: "sd",
  admin: "admin",
};

// Messages shown on the login page for each way sign in can fail
const ERROR_MESSAGES = {
  session_expired: "Your session has expired. Please sign in again.",
  not_signed_in: "Sign in failed. Please try again.",
  identity_not_linked:
    "Your account is not linked to a Firecrest employee. Ask an administrator to link it.",
  no_application_role:
    "Your account has no Firecrest role. Ask an administrator to add you to a group.",
  ambiguous_application_roles:
    "Your account has more than one Firecrest role. Ask an administrator to fix it.",
  role_mismatch:
    "Your Firecrest role does not match your employee record. Ask an administrator to check it.",
  mode_mismatch:
    "The API is not in OIDC mode. Set Auth:Mode to Oidc on the API, or VITE_AUTH_MODE to prototype here.",
  api_unreachable: "The Firecrest API could not be reached.",
  login_failed: "Sign in failed. Please try again.",
};

function makeError(code, detail) {
  return { code, message: ERROR_MESSAGES[code] || ERROR_MESSAGES.login_failed, detail };
}

// Ask the API who the signed-in user is. Resolves to { user } or { error }.
async function loadEmployee(oidcUser) {
  let res;
  try {
    res = await apiFetch(`${API_BASE_URL}/me`);
  } catch {
    return { error: makeError("api_unreachable") };
  }

  if (res.status === 401) return { error: makeError("session_expired") };
  // Prototype mode does not expose /me
  if (res.status === 404) return { error: makeError("mode_mismatch") };

  if (res.status === 403) {
    let code = "identity_not_linked";
    try {
      const body = await res.json();
      if (ERROR_MESSAGES[body.error]) code = body.error;
    } catch {
      // Keep the default message
    }
    return { error: makeError(code) };
  }

  if (!res.ok) return { error: makeError("login_failed", res.status) };

  const me = await res.json();
  const role = ROLE_BY_API_ROLE[String(me.role).toLowerCase()];
  if (!role) return { error: makeError("no_application_role") };

  return {
    user: {
      // The employee ID comes from the API, an admin without an employee record has none
      id: me.id,
      name: me.name || oidcUser.profile.preferred_username,
      username: oidcUser.profile.preferred_username,
      role,
      managerId: me.manager_id,
      isEmployee: me.is_employee,
    },
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    if (AUTH_MODE === "oidc") return null;

    const saved = sessionStorage.getItem("authUser");
    if (!saved) return null;

    // Use the current login definition so older sessions pick up new fields like id
    const savedUser = JSON.parse(saved);
    return (
      AUTH_USERS.find((u) => u.username === savedUser.username) || savedUser
    );
  });

  // In oidc mode wait for the stored session to be checked before showing any page
  const [loading, setLoading] = useState(
    AUTH_MODE === "oidc" && window.location.pathname !== "/auth/callback",
  );
  const [error, setError] = useState(null);
  const callbackPromise = useRef(null);

  // Restore an existing authentik session when the app loads
  useEffect(() => {
    if (AUTH_MODE !== "oidc" || window.location.pathname === "/auth/callback") {
      return;
    }

    let cancelled = false;

    async function restoreSession() {
      const oidcUser = await userManager.getUser();

      if (!oidcUser || oidcUser.expired) {
        if (oidcUser) await userManager.removeUser();
        if (!cancelled) setLoading(false);
        return;
      }

      const result = await loadEmployee(oidcUser);
      if (cancelled) return;

      setUser(result.user || null);
      setError(result.error || null);
      setLoading(false);
    }

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  // End the session when the API or the token says it is no longer valid
  useEffect(() => {
    if (AUTH_MODE !== "oidc") return;

    async function handleExpired() {
      await userManager.removeUser();
      setUser(null);
      setError(makeError("session_expired"));
    }

    window.addEventListener(UNAUTHORIZED_EVENT, handleExpired);
    userManager.events.addAccessTokenExpired(handleExpired);

    return () => {
      window.removeEventListener(UNAUTHORIZED_EVENT, handleExpired);
      userManager.events.removeAccessTokenExpired(handleExpired);
    };
  }, []);

  // Finish the redirect back from authentik, called once by the callback page
  function completeLogin() {
    if (!callbackPromise.current) {
      callbackPromise.current = (async () => {
        try {
          const oidcUser = await userManager.signinRedirectCallback();
          const result = await loadEmployee(oidcUser);

          setUser(result.user || null);
          setError(result.error || null);
          setLoading(false);

          return result;
        } catch (err) {
          const result = { error: makeError("not_signed_in", err.message) };
          setError(result.error);
          setLoading(false);
          return result;
        }
      })();
    }

    return callbackPromise.current;
  }

  // Prototype mode checks the hardcoded accounts, oidc mode sends the user to authentik
  function login(username, password) {
    if (AUTH_MODE === "oidc") {
      setError(null);
      userManager.signinRedirect();
      return null;
    }

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
    setError(null);

    if (AUTH_MODE === "oidc") {
      // Ends the authentik session too, so the next sign in asks for credentials again
      userManager.signoutRedirect().catch(() => userManager.removeUser());
      return;
    }

    sessionStorage.removeItem("authUser");
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        loading,
        error,
        mode: AUTH_MODE,
        completeLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
