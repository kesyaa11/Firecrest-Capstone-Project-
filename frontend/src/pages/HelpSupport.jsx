export default function HelpSupport() {
  return (
    <div className="container-fluid mt-4">
      {/* Page header */}
      <div className="row align-items-center mb-4">
        <div className="col">
          <h1 className="mb-0">Help & Support</h1>
        </div>
      </div>

      {/* Getting Started */}
      <div className="card border mb-4">
        <div className="card-header bg-light">
          <h4 className="mb-0">Getting Started</h4>
        </div>

        <div className="card-body">
          <p className="mb-2">
            Use the Firecrest sidebar navigation to access the tools available
            to your role.
          </p>

          <ul className="mb-0">
            <li>
              Dashboard — view team weekly shift and quick view dashboard
              information.
            </li>
            <li>Projects — view and manage projects.</li>
            <li>Handoff Management — manage project handoffs.</li>
            <li>User Management — manage users.</li>
            <li>Timesheet — view hours and leave info.</li>
          </ul>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="card border mb-4">
        <div className="card-header bg-light">
          <h4 className="mb-0">Frequently Asked Questions</h4>
        </div>

        <div className="card-body">
          <div className="mb-3">
            <strong>How do I request leave?</strong>
            <p className="mb-0 text-muted">
              Open Timesheet and use the Apply for Leave option.
            </p>
          </div>

          <div className="mb-3">
            <strong>How do I assign a shift?</strong>
            <p className="mb-0 text-muted">
              Users with Admin or Manager level of access can assign shifts from
              the Dashboard.
            </p>
          </div>

          <div>
            <strong>How do I manage a handoff?</strong>
            <p className="mb-0 text-muted">
              Open Handoff Management to review and manage project handoffs.
            </p>
          </div>
        </div>
      </div>

      {/* Support */}
      <div className="card border">
        <div className="card-header bg-light">
          <h4 className="mb-0">Need Help?</h4>
        </div>

        <div className="card-body">
          <p className="mb-2">
            If you encounter an issue with Firecrest, contact your system admin.
          </p>

          <small className="text-muted">
            Firecrest — Capstone Operational Visibility Prototype — Version 1.0
          </small>
        </div>
      </div>
    </div>
  );
}
