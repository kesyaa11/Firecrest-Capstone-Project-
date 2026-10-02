import RecentProjects from "./RecentProjects";
import UpcomingLeaves from "./UpcomingLeaves";
import { useAuth } from "../auth/AuthContext";

export default function Aside() {
  const { user } = useAuth();

  return (
    <aside className="aside">
      {/* Recent / Active Projects */}
      {(user?.role === "manager" ||
        user?.role === "sd" ||
        user?.role === "developer") && <RecentProjects />}

      {/* Upcoming Leaves */}
      {(user?.role === "manager" || user?.role === "admin") && (
        <UpcomingLeaves />
      )}
    </aside>
  );
}
