import { useNavigate } from "react-router-dom";

export default function BackToDashboard() {
  const navigate = useNavigate();

  return (
    <button
      className="btn btn-outline-secondary mb-3"
      onClick={() => navigate("/dashboard")}
    >
      ← Dashboard
    </button>
  );
}
