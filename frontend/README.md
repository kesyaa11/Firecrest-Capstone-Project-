# Installation Instructions

1. From FIRECREST-CAPSTONE-PROJECT/
2. cd frontend
3. npm install

This should install dependencies for this frontend application.

To start the frontend development server:

1. npm run dev
2.Open the local URL displayed in the terminal to access the application

# Environment configuration

Copy `.env.example` to `.env` and edit it. Only variables starting with `VITE_` are available to the browser, so never put secrets in this file. `.env` is ignored by Git.

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Address of the API, for example `http://localhost:5281` when the API is run with `dotnet run`. |
| `VITE_AUTH_MODE` | `oidc` signs in with authentik. `prototype` (the default) uses the fixed development accounts in `src/auth/authUsers.js` and is for local development only. It must match `Auth:Mode` in the API. |
| `VITE_OIDC_AUTHORITY` | Optional. The authentik issuer URL. Default `http://localhost:9000/application/o/firecrest/`. |
| `VITE_OIDC_CLIENT_ID` | Optional. Default `firecrest-spa`. |
| `VITE_OIDC_REDIRECT_URI` | Optional. Default `<current origin>/auth/callback`. |
| `VITE_OIDC_POST_LOGOUT_REDIRECT_URI` | Optional. Default `<current origin>/`. |

The development server must run on port 5173, because that address is registered with authentik. The authentik setup, test accounts and employee linking are described in `../infra/authentik/README.md`.
