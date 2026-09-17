import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="container mt-5">
      <div className="row">
        <div className="col">
          <h1>Firecrest Dashboard</h1>
          <p>Select a role to continue</p>
        </div>
      </div>

      <div className="row mt-4">
        <div className="col">
          <button
            className="btn btn-primary w-100"
            onClick={() => navigate("/users")}
          >
            Admin
          </button>
        </div>

        <div className="col">
          <button
            className="btn btn-primary w-100"
            onClick={() => navigate("/manager-dashboard")}
          >
            Manager
          </button>
        </div>

        <div className="col">
          <button
            className="btn btn-primary w-100"
            onClick={() => navigate("/developer-dashboard")}
          >
            Developer
          </button>
        </div>

        <div className="col">
          <button
            className="btn btn-primary w-100"
            onClick={() => navigate("/service-delivery-dashboard")}
          >
            Service Delivery
          </button>
        </div>
      </div>
    </div>
  );
}
