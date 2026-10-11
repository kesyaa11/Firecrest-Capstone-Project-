// Role and access component displaying permissions based on the user's role
import { useAuth } from "../auth/AuthContext";

export default function RoleAccess() {
  const { user } = useAuth();

  // Define the features displayed for each user role.
  const accessByRole = {
    manager: [
      "User Management",
      "Shift Assignment",
      "Team Scheduling",
      "Handoff Management",
      "Timesheet",
    ],

    sd: ["Team Scheduling", "Handoff Management", "Timesheet"],

    developer: ["Team Scheduling", "Handoff Management", "Timesheet"],

    admin: [
      "User Management",
      "Team Scheduling",
      "Handoff Management",
      "Timesheet",
    ],
  };

  // Use the current user's role to retrieve permissions, defaulting to an empty list.
  const permissions = accessByRole[user?.role] || [];

  return (
    <div className="card border mb-4">
      <div className="card-body">
        <h5 className="card-title mb-2">Role & Access</h5>

        <p className="small text-muted mb-3 text-capitalize">
          {user?.role || "User"} access
        </p>

        <div className="border rounded overflow-hidden">
          <ul className="list-unstyled mb-0">
            {permissions.map((permission) => (
              <li key={permission} className="px-3 py-2 border-bottom">
                <span className="text-success me-2">✓</span>
                {permission}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
