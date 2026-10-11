import { useEffect, useState } from "react";

import { getLeaveBalances } from "../api/leaveBalances";
import { getUsers } from "../api/users";

import TeamLeaveBalancesModal from "./TeamLeaveBalancesModal";

export default function TeamLeaveBalances() {
  const [leaveBalances, setLeaveBalances] = useState([]);
  const [users, setUsers] = useState([]);

  // Load team leave balances and user records when the component loads.
  useEffect(() => {
    async function loadTeamLeaveBalances() {
      try {
        // Fetch both datasets concurrently rather than awaiting each request separately.
        // as they can run independent of each other anyway
        const [balances, userList] = await Promise.all([
          getLeaveBalances(),
          getUsers(),
        ]);

        setLeaveBalances(balances || []);
        setUsers(userList || []);
      } catch (error) {
        console.error("Failed to load team leave balances:", error);
      }
    }

    loadTeamLeaveBalances();
  }, []);

  // Match each leave balance to its user record
  const teamBalances = leaveBalances.map((balance) => {
    const employee = users.find(
      (user) => Number(user.id) === Number(balance.user_id),
    );

    return {
      ...balance,
      name: employee?.name || `User ${balance.user_id}`,
    };
  });

  return (
    <>
      <div className="card border mb-4">
        <div className="card-body">
          {/* Card Header */}
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5 className="card-title mb-0">Team Leave Balances</h5>

            <button
              type="button"
              className="btn btn-outline-primary"
              data-bs-toggle="modal"
              data-bs-target="#teamLeaveBalancesModal"
            >
              View All →
            </button>
          </div>

          {/* Card Description */}
          <p className="small text-muted mb-3">
            Current leave balances for your team
          </p>

          {/* Team Leave Balance Table */}
          <div className="border rounded overflow-hidden">
            <div className="table-responsive">
              <table className="table table-striped table-hover mb-0 align-middle">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th className="text-center" style={{ width: "70px" }}>
                      Annual
                    </th>
                    <th className="text-center" style={{ width: "70px" }}>
                      Sick
                    </th>
                    <th className="text-center" style={{ width: "70px" }}>
                      Alt
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {teamBalances.length > 0 ? (
                    teamBalances.slice(0, 5).map((balance) => (
                      <tr key={balance.id}>
                        <td>{balance.name}</td>

                        <td className="text-center">
                          {balance.al_outstanding ?? 0}
                        </td>

                        <td className="text-center">
                          {balance.sick_days ?? 0}
                        </td>

                        <td className="text-center">
                          {balance.alternative_days ?? 0}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-muted text-center py-3">
                        No leave balances available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <TeamLeaveBalancesModal teamBalances={teamBalances} />
    </>
  );
}
