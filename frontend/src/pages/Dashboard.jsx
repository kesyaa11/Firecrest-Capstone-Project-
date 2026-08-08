import { useNavigate } from "react-router-dom";

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
            Employees
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

      <div className="row mt-4">
        <div className="col-md-8 mx-auto">
          <h4 className="text-center mb-3">Upcoming Leave</h4>

          <div className="border rounded p-2">
            <div className="py-2 border-bottom">Sarah Parker — 12–16 Aug</div>

            <div className="py-2 border-bottom">Michael Green — 19–21 Aug</div>

            <div className="py-2">Emma Wilson — 25–29 Aug</div>
          </div>
        </div>
      </div>
    </div>
  );
}
