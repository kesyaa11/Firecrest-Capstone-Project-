import BackToDashboard from "../components/BackToDashboard";

export default function Payroll() {
  return (
    <div className="container mt-4">
      <div className="text-start mb-3">
        <BackToDashboard />
      </div>
      <div className="row">
        <div className="col">
          <h2>Payroll</h2>
        </div>

        <div className="col text-end">
          <button className="btn btn-success">Export CSV</button>
        </div>
      </div>

      <div className="row mt-4">
        <div className="col">
          <table className="table table-striped table-hover">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Hours Worked</th>
                <th>Leave Balance</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>John Doe</td>
                <td>40</td>
                <td>50hrs</td>
                <td>Ready</td>
              </tr>

              <tr>
                <td>Sarah Parker</td>
                <td>38</td>
                <td>48hrs</td>
                <td>Ready</td>
              </tr>

              <tr>
                <td>Michael Green</td>
                <td>40</td>
                <td>80hrs</td>
                <td>Ready</td>
              </tr>

              <tr>
                <td>Emma Wilson</td>
                <td>32</td>
                <td>32hrs</td>
                <td>Leave</td>
              </tr>

              <tr>
                <td>James Will</td>
                <td>40</td>
                <td>10hrs</td>
                <td>Ready</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
