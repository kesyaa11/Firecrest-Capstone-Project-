import { useNavigate } from "react-router-dom";
import logo from "../assets/FC-colourWeb.png";

export default function Header() {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/");
  };

  return (
    <header className="d-flex align-items-center">
      <img className="p-2" src={logo} />

      <div className="ms-auto p-2">Logged in: John Doe</div>

      <button className="btn btn-outline-danger me-3" onClick={handleLogout}>
        Logout
      </button>
    </header>
  );
}
