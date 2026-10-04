import { useAuth } from "../auth/AuthContext";
import { useLocation } from "react-router-dom";

import RecentProjects from "./RecentProjects";

import UpcomingLeaves from "./UpcomingLeaves";
import LeaveBalance from "./LeaveBalance";
import LeaveActivity from "./LeaveActivity";

export default function Aside({ selectedUser, leaveBalance }) {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <aside className="aside">
      {/* Dashboard widgets */}
      {location.pathname === "/dashboard" && (
        <>
          {/* Recent / Active Projects */}
          {(user?.role === "manager" ||
            user?.role === "sd" ||
            user?.role === "developer") && <RecentProjects />}

          {/* Upcoming Leaves */}
          {(user?.role === "manager" || user?.role === "admin") && (
            <UpcomingLeaves />
          )}
        </>
      )}

      {/* Timesheet widgets */}
      {location.pathname === "/timesheet" && (
        <>
          <LeaveBalance />
          <LeaveActivity />
        </>
      )}
    </aside>
  );
}
