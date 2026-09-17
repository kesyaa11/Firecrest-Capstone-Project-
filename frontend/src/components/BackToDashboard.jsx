import { useNavigate } from "react-router-dom";

export default function BackToDashboard({ to = "/dashboard" }) {
  const navigate = useNavigate();

  return (
    <button
      className="btn btn-outline-secondary mb-3"
      onClick={() => navigate(to)}
    >
      ← Dashboard
    </button>
  );
}
