import BackToDashboard from "../components/BackToDashboard";

export default function EmployeeList() {
  return (
    <div className="container mt-4">
      <div className="text-start mb-3">
        <BackToDashboard />
      </div>
      <div className="row">
        <div className="col">
          <h2>Employee Management</h2>
        </div>

        <div className="col text-end">
          <button className="btn btn-success">+ Add Employee</button>
        </div>
      </div>

      <div className="row mt-4">
        <div className="col">
          <table className="table table-striped table-hover">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Shift</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>John Doe</td>
                <td>Manager</td>
                <td>Morning</td>
                <td>Active</td>
              </tr>

              <tr>
                <td>Sarah Parker</td>
                <td>Service Delivery</td>
                <td>Afternoon</td>
                <td>Active</td>
              </tr>

              <tr>
                <td>Michael Green</td>
                <td>Developer</td>
                <td>Flexible</td>
                <td>Active</td>
              </tr>

              <tr>
                <td>Emma Wilson</td>
                <td>Service Delivery</td>
                <td>Night</td>
                <td>On Leave</td>
              </tr>

              <tr>
                <td>James Will</td>
                <td>Developer</td>
                <td>Flexible</td>
                <td>Active</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
