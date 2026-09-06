import { useEffect, useState } from "react";
import { getLeaveRequests } from "../api/leaveRequests";
import { getUsers } from "../api/users";

export default function UpcomingLeaves() {
  // Store all leave requests and users returned from the API
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [users, setUsers] = useState([]);

  // Get today's date and date a month from now
  const today = new Date();
  const monthFromNow = new Date(today);
  monthFromNow.setDate(today.getDate() + 30);

  // Filter leaves with Approved state AND whose start date is within a month from now
  const approvedLeaves = leaveRequests.filter((leave) => {
    const startDate = new Date(leave.start_date);
    return (
      leave.status === "Approved" &&
      startDate >= today &&
      startDate <= monthFromNow
    );
  });

  // Load leave requests and users when the component first renders
  useEffect(() => {
    async function loadData() {
      const leaveData = await getLeaveRequests();
      const userData = await getUsers();
      setLeaveRequests(leaveData);
      setUsers(userData);
    }

    loadData();
  }, []);

  return (
    <div className="row mt-4">
      <div className="col-md-8 mx-auto">
        <h4 className="text-center mb-3">Upcoming Leaves</h4>

        {approvedLeaves.length > 0 && (
          <div className="border rounded p-2">
            {/* for each upcoming approved leave do the following */}
            {approvedLeaves.map((leave, index) => {
              // Convert start and end dates into JS comparable
              const startDate = new Date(leave.start_date);
              const endDate = new Date(leave.end_date);

              // Find the user associated with this leave request
              const user = users.find((user) => {
                return user.id === leave.user_id;
              });

              // Format start and end dates to date and month
              const startFormatted = startDate.toLocaleDateString("en-NZ", {
                day: "numeric",
                month: "short",
              });

              const endFormatted = endDate.toLocaleDateString("en-NZ", {
                day: "numeric",
                month: "short",
              });

              return (
                // Add a bottom border between leave entries but not after last entry
                <div
                  className={`py-2 ${
                    index < approvedLeaves.length - 1 ? "border-bottom" : ""
                  }`}
                >
                  {/* Display the user's name */}
                  {user?.name}
                  {" - "}
                  {/* Display one date if start and end are on same day otherwise show a range */}
                  {startDate.getTime() === endDate.getTime()
                    ? startFormatted
                    : `${startFormatted} to ${endFormatted}`}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
