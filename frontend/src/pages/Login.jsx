import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../auth/AuthContext";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    const found = login(username, password);
    if (found) {
      navigate("/dashboard");
    } else {
      setError("Invalid username or password.");
    }
  };

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
            {error && <div className="text-center text-danger mb-3">{error}</div>}
            <div className="text-center">
              <button type="submit" className="btn btn-primary">
                Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
