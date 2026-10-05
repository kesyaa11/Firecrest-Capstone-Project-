import { useAuth } from "../auth/AuthContext";
import { useLocation } from "react-router-dom";

import RoleBreakdown from "./RoleBreakdown";
import SkillCoverage from "./SkillCoverage";

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

      {/* Role Breakdown */}
      {location.pathname === "/users" &&
        (user?.role === "manager" || user?.role === "admin") && (
          <RoleBreakdown />
        )}

      {/* Skill Coverage */}
      {location.pathname === "/users" &&
        (user?.role === "manager" || user?.role === "admin") && (
          <SkillCoverage />
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
