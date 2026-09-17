import { useNavigate } from "react-router-dom";
import logo from "../assets/FC-colourWeb.png";
import { useAuth } from "../auth/AuthContext";

export default function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="d-flex align-items-center">
      <img className="p-2" src={logo} />

      {user && (
        <>
          <div className="ms-auto p-2">
            Logged in: {user.name} ({user.role})
          </div>

          <button
            className="btn btn-outline-danger me-3"
            onClick={handleLogout}
          >
            Logout
          </button>
        </>
      )}
    </header>
  );
}
