import { Navigate, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../auth/AuthContext";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, logout, mode, user, loading, error: authError } = useAuth();
  const navigate = useNavigate();

  // Handle login submission and redirect after successful authentication.
  const handleLogin = (e) => {
    e.preventDefault();
    const found = login(username, password);
    if (found) {
      navigate("/dashboard");
    } else {
      setError("Invalid username or password.");
    }
  };

  // Sign in with authentik, the username and password are only ever typed on authentik's page
  if (mode === "oidc") {
    if (loading) {
      return <div className="container mt-5 py-5 text-center">Loading...</div>;
    }

    if (user) {
      return <Navigate to="/dashboard" replace />;
    }

    return (
      <div className="container mt-5 py-5 text-center">
        {authError && (
          <div className="text-danger mb-3" role="alert">
            {authError.message}
          </div>
        )}
        <button type="button" className="btn btn-primary" onClick={() => login()}>
          Sign in with authentik
        </button>
        {authError && authError.code !== "session_expired" && (
          <div className="mt-3">
            <button type="button" className="btn btn-link" onClick={logout}>
              Sign out of authentik
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container mt-5 py-5">
      <div className="row">
        <div className="col-6 offset-3">
          <form onSubmit={handleLogin}>
            <div className="row mb-3">
              <div className="col-4 text-end">Username:</div>

              <div className="col-8">
                <input
                  className="form-control"
                  name="username"
                  placeholder="manager, admin, sd or dev"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-4 text-end">Password:</div>

              <div className="col-8">
                <input
                  className="form-control"
                  name="password"
                  type="password"
                  placeholder="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            {error && (
              <div className="text-center text-danger mb-3">{error}</div>
            )}
            <div className="text-center">
              <button type="submit" className="btn btn-primary">
                Login
              </button>
            </div>
            <div className="text-center mt-2">
              <button
                type="button"
                className="btn btn-link text-decoration-none"
                onClick={() => navigate("/forgot-password")}
              >
                Forgot Password?
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
