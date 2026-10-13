import { UserManager, WebStorageStateStore } from "oidc-client-ts";

// "prototype" uses the hardcoded accounts in authUsers.js, "oidc" signs in with authentik.
// This must match Auth:Mode in the API, the login page shows an error if they disagree.
export const AUTH_MODE =
  import.meta.env.VITE_AUTH_MODE === "oidc" ? "oidc" : "prototype";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Authorization Code flow with PKCE, nothing is kept in localStorage
export const userManager =
  AUTH_MODE === "oidc"
    ? new UserManager({
        authority:
          import.meta.env.VITE_OIDC_AUTHORITY ||
          "http://localhost:9000/application/o/firecrest/",
        client_id: import.meta.env.VITE_OIDC_CLIENT_ID || "firecrest-spa",
        redirect_uri:
          import.meta.env.VITE_OIDC_REDIRECT_URI ||
          `${window.location.origin}/auth/callback`,
        response_type: "code",
        scope: "openid profile email",
        // The signed-in user and the temporary login state live in sessionStorage only
        userStore: new WebStorageStateStore({ store: window.sessionStorage }),
        stateStore: new WebStorageStateStore({ store: window.sessionStorage }),
        // The employee comes from the API's /me, so the user info endpoint is not needed
        loadUserInfo: false,
        automaticSilentRenew: false,
        monitorSession: false,
      })
    : null;
