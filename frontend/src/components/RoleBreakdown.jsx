import { useEffect, useState } from "react";
import { getUsers } from "../api/users";

export default function RoleBreakdown() {
  const [users, setUsers] = useState([]);

  // Load user data from the API when the component first loads.
  useEffect(() => {
    async function loadUsers() {
      const data = await getUsers();
      setUsers(data || []);
    }

    loadUsers();
  }, []);

  // Count users by role to build the dashboard breakdown.
  const roleCounts = users.reduce(
    (counts, user) => {
      // Normalise the role name before comparing it.
      const role = user.role?.toLowerCase();

      if (role === "manager") counts.manager++;
      if (role === "dev") counts.developer++;
      if (role === "sd") counts.sd++;
      if (role === "admin") counts.admin++;

      return counts;
    },
    {
      manager: 0,
      developer: 0,
      sd: 0,
      admin: 0,
    },
  );

  return (
    <div className="card border mb-4">
      <div className="card-body">
        <h5 className="card-title mb-2">Role Breakdown</h5>

        <p className="small text-muted mb-3">Current users role breakdown</p>

        <div className="border rounded overflow-hidden">
          <table className="table table-striped mb-0 align-middle">
            <tbody>
              <tr>
                <td>Total Users</td>
                <td className="text-end fw-semibold">{users.length}</td>
              </tr>

              <tr>
                <td>Managers</td>
                <td className="text-end">{roleCounts.manager}</td>
              </tr>

              <tr>
                <td>Developers</td>
                <td className="text-end">{roleCounts.developer}</td>
              </tr>

              <tr>
                <td>SD</td>
                <td className="text-end">{roleCounts.sd}</td>
              </tr>

              <tr>
                <td>Admins</td>
                <td className="text-end">{roleCounts.admin}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
