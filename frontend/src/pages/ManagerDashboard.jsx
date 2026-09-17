import { useNavigate } from "react-router-dom";
import UpcomingLeaves from "../components/UpcomingLeaves";
import BackToDashboard from "../components/BackToDashboard";
import RecentProjects from "../components/RecentProjects";

export default function ManagerDashboard() {
  const navigate = useNavigate();

  return (
    <div className="container mt-5">
      <div className="text-start mb-3">
        <BackToDashboard to="/dashboard" />
      </div>
      <h1>Manager Dashboard</h1>
      <p>Welcome to the Manager Dashboard</p>

      <div className="row mt-4">
        <div className="col">
          <button
            className="btn btn-primary w-100"
            onClick={() =>
              navigate("/schedule", {
                state: { from: "/manager-dashboard" },
              })
            }
          >
            Schedule
          </button>
        </div>

        <div className="col">
          <button
            className="btn btn-primary w-100"
            onClick={() =>
              navigate("/projects", {
                state: { from: "/manager-dashboard" },
              })
            }
          >
            Projects
          </button>
        </div>

        <div className="col">
          <button
            className="btn btn-primary w-100"
            onClick={() =>
              navigate("/payroll", {
                state: { from: "/manager-dashboard" },
              })
            }
          >
            Payroll
          </button>
        </div>
      </div>

      <RecentProjects />

      <UpcomingLeaves />
    </div>
  );
}
