import { useNavigate } from "react-router-dom";
import UpcomingLeaves from "../components/UpcomingLeaves";

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="container mt-5">
      <div className="row">
        <div className="col">
          <h1>Manager Dashboard</h1>
          <p>Welcome John Doe</p>
        </div>
      </div>

      <div className="row mt-4">
        <div className="col">
          <button
            className="btn btn-primary w-100"
            onClick={() => navigate("/employees")}
          >
            Team Members
          </button>
        </div>

        <div className="col">
          <button
            className="btn btn-primary w-100"
            onClick={() => navigate("/schedule")}
          >
            Schedule
          </button>
        </div>

        <div className="col">
          <button
            className="btn btn-primary w-100"
            onClick={() => navigate("/payroll")}
          >
            Payroll
          </button>
        </div>

        <div className="col">
          <button
            className="btn btn-primary w-100"
            onClick={() => navigate("/handoff")}
          >
            Projects
          </button>
        </div>
      </div>

      <div className="row mt-4">
        <div className="col-md-8 mx-auto">
          <h4 className="text-center mb-3">Recent Projects</h4>

          <div className="border rounded p-2">
            <div className="py-2 border-bottom">Project Phoenix — Testing</div>

            <div className="py-2 border-bottom">
              Customer Portal Upgrade — Handoff Pending
            </div>

            <div className="py-2">Network Automation — Development</div>
          </div>
        </div>
      </div>

      <UpcomingLeaves />
    </div>
  );
}
