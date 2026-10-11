import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Sidebar() {
  // Get the logged-in user to determine which navigation links they can access.
  const { user } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span></span>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className="sidebar-link">
          Dashboard
        </NavLink>

        <NavLink to="/projects" className="sidebar-link">
          Projects
        </NavLink>

        <NavLink to="/handoff" className="sidebar-link">
          Handoff Management
        </NavLink>

        {/* User Management */}
        {(user?.role === "manager" || user?.role === "admin") && (
          <NavLink to="/users" className="sidebar-link">
            User Management
          </NavLink>
        )}

        <NavLink to="/timesheet" className="sidebar-link">
          Timesheet
        </NavLink>
      </nav>
    </aside>
  );
}
