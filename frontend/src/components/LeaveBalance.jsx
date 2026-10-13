import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";

import { getLeaveBalanceByUserId } from "../api/leaveBalances";

import LeaveBalanceModal from "./LeaveBalanceModal";

export default function LeaveBalance() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    async function loadLeaveBalance() {
      if (!user?.id) return;

      const userBalance = await getLeaveBalanceByUserId(user.id);

      setBalance(userBalance || null);
    }

    loadLeaveBalance();
  }, [user]);

  return (
    <>
      <div className="card border mb-4">
        <div className="card-body">
          {/* Card Header */}
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5 className="card-title mb-0">Leave Balance</h5>

            <button
              type="button"
              className="btn btn-outline-primary"
              data-bs-toggle="modal"
              data-bs-target="#leaveBalanceModal"
            >
              View Details →
            </button>
          </div>

          {/* Card Description */}
          <p className="small text-muted mb-3">Current available leave</p>

          {/* Leave Balance List */}
          <div className="border rounded overflow-hidden">
            <div className="table-responsive">
              <table className="table table-striped table-hover mb-0 align-middle">
                <thead>
                  <tr>
                    <th>Leave Type</th>
                    <th className="text-end">Balance</th>
                  </tr>
                </thead>

                <tbody>
                  {balance ? (
                    <>
                      <tr>
                        <td>Annual Leave</td>
                        <td className="text-end">
                          {balance.al_outstanding ?? 0} days
                        </td>
                      </tr>

                      <tr>
                        <td>Sick Leave</td>
                        <td className="text-end">
                          {balance.sick_days ?? 0} days
                        </td>
                      </tr>

                      <tr>
                        <td>Alternative Days</td>
                        <td className="text-end">
                          {balance.alternative_days ?? 0} days
                        </td>
                      </tr>
                    </>
                  ) : (
                    <tr>
                      <td colSpan="2" className="text-muted text-center py-3">
                        No leave balance available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Leave Balance Details Modal */}
      <LeaveBalanceModal balance={balance} />
    </>
  );
}
