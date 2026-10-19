import { useAuth } from "../auth/authContext";
import { useLocation } from "react-router-dom";

import RoleAccess from "./RoleAccess";
import RoleBreakdown from "./RoleBreakdown";
import SkillCoverage from "./SkillCoverage";

import RecentProjects from "./RecentProjects";

import UpcomingLeaves from "./UpcomingLeaves";
import LeaveBalance from "./LeaveBalance";
import TeamLeaveBalances from "./TeamLeaveBalances";
import LeaveActivity from "./LeaveActivity";

import SupportFeedback from "./SupportFeedback";

export default function Aside({ leaveRefresh }) {
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
            <UpcomingLeaves refreshTrigger={leaveRefresh} />
          )}
        </>
      )}

      {/* Profile widgets */}
      {location.pathname === "/profile" && <RoleAccess />}

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
          {user?.role === "manager" || user?.role === "admin" ? (
            <TeamLeaveBalances />
          ) : (
            <LeaveBalance />
          )}
          <LeaveActivity refreshTrigger={leaveRefresh} />
        </>
      )}

      {/* Help & Support widgets */}
      {location.pathname === "/help" && <SupportFeedback />}
    </aside>
  );
}
