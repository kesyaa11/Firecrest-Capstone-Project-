import { AUTH_MODE, userManager } from "../auth/oidc";

// Sent when the API or the session says the user is no longer signed in
export const UNAUTHORIZED_EVENT = "firecrest:unauthorized";

// fetch for the Firecrest API. In oidc mode it adds the access token as a bearer token,
// in prototype mode it is a plain fetch so the existing behaviour is unchanged.
export async function apiFetch(url, options = {}) {
  if (AUTH_MODE !== "oidc") {
    return fetch(url, options);
  }

  const oidcUser = await userManager.getUser();

  // Never send a request without a valid token, and never fall back to prototype behaviour
  if (!oidcUser || oidcUser.expired) {
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    throw new Error("Your session has expired. Please sign in again.");
  }

  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${oidcUser.access_token}`);

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
  }

  return res;
}
