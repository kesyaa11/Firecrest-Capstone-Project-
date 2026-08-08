import BackToDashboard from "../components/BackToDashboard";

export default function Schedule() {
  return (
    <div className="container mt-4">
      <div className="text-start mb-3">
        <BackToDashboard />
      </div>
      <div className="row">
        <div className="col">
          <h2>Schedule</h2>
        </div>

        <div className="col text-end">
          <button className="btn btn-success">+ Assign Shift</button>
        </div>
      </div>

      <div className="row mt-4">
        <div className="col">
          <table className="table table-striped table-hover">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Mon</th>
                <th>Tue</th>
                <th>Wed</th>
                <th>Thu</th>
                <th>Fri</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>John Doe</td>
                <td>3 shifts</td>
                <td>2 shifts</td>
                <td>3 shifts</td>
                <td>3 shifts</td>
                <td>2 shifts</td>
              </tr>
              <tr>
                <td>Sarah Parker</td>
                <td>3 shifts</td>
                <td>3 shifts</td>
                <td>3 shifts</td>
                <td>3 shifts</td>
                <td>2 shifts</td>
              </tr>
              <tr>
                <td>Michael Green</td>
                <td>3 shifts</td>
                <td>3 shifts</td>
                <td>3 shifts</td>
                <td>3 shifts</td>
                <td>3 shifts</td>
              </tr>
              <tr>
                <td>Emma Wilson</td>
                <td>3 shifts</td>
                <td>2 shifts</td>
                <td>2 shifts</td>
                <td>2 shifts</td>
                <td>2 shifts</td>
              </tr>
              <tr>
                <td>James Will</td>
                <td>2 shifts</td>
                <td>3 shifts</td>
                <td>3 shifts</td>
                <td>3 shifts</td>
                <td>2 shifts</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
