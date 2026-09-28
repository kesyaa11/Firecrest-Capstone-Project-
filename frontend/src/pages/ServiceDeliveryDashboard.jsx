import { useNavigate } from "react-router-dom";
import UpcomingLeaves from "../components/UpcomingLeaves";
import BackToDashboard from "../components/BackToDashboard";
import RecentProjects from "../components/RecentProjects";

export default function ServiceDeliveryDashboard() {
  const navigate = useNavigate();

  return (
    <div className="container mt-5">
      <div className="text-start mb-3">
        <BackToDashboard to="/dashboard" />
      </div>
      <h1>Service Delivery Dashboard</h1>
      <p>Welcome to the Service Delivery Dashboard</p>

      <div className="row mt-4">
        <div className="col">
          <button
            className="btn btn-primary w-100"
            onClick={() =>
              navigate("/schedule", {
                state: { from: "/service-delivery-dashboard" },
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
                state: { from: "/service-delivery-dashboard" },
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
              navigate("/timesheet", {
                state: { from: "/service-delivery-dashboard" },
              })
            }
          >
            Timesheet
          </button>
        </div>
      </div>

      <RecentProjects />

      <UpcomingLeaves />
    </div>
  );
}
