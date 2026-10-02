import { NavLink } from "react-router-dom";

export default function Sidebar() {
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

        <NavLink to="/users" className="sidebar-link">
          User Management
        </NavLink>

        <NavLink to="/timesheet" className="sidebar-link">
          Timesheet
        </NavLink>
      </nav>
    </aside>
  );
}
