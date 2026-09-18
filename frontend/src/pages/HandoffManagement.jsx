import BackToDashboard from "../components/BackToDashboard";

export default function HandoffManagement() {
  return (
    <div className="container mt-4">
      <div className="text-start mb-3">
        <BackToDashboard />
      </div>
      <div className="row">
        <div className="col">
          <h2>Handoff Management</h2>
        </div>

        <div className="col text-end">
          <button className="btn btn-primary">+ Create Handoff</button>
        </div>
      </div>

      <div className="row mt-4">
        <div className="col">
          <table className="table table-striped table-hover">
            <thead>
              <tr>
                <th>Project</th>
                <th>Developer</th>
                <th>SD Lead</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>Payroll System</td>
                <td>Michael Green</td>
                <td>Sarah Parker</td>
                <td>Ready for Testing</td>
              </tr>

              <tr>
                <td>Roster System</td>
                <td>James Will</td>
                <td>Emma Wilson</td>
                <td>In Progress</td>
              </tr>

              <tr>
                <td>Customer Portal</td>
                <td>Michael Green</td>
                <td>Sarah Parker</td>
                <td>Blocked</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
