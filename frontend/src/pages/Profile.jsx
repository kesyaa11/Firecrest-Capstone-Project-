// Profile page displaying account information and user skills
import { useAuth } from "../auth/AuthContext";

export default function Profile() {
  const { user } = useAuth();

  const skillsByRole = {
    manager: [
      { name: "Leadership", level: 5 },
      { name: "Project Management", level: 5 },
      { name: "Resource Planning", level: 4 },
      { name: "Stakeholder Management", level: 4 },
      { name: "Scheduling", level: 4 },
    ],

    developer: [
      { name: "C#", level: 5 },
      { name: "React", level: 5 },
      { name: "AWS / Cloud", level: 4 },
      { name: "API Development", level: 4 },
      { name: "Testing", level: 4 },
    ],

    sd: [
      { name: "Service Delivery", level: 5 },
      { name: "Stakeholder Management", level: 5 },
      { name: "Handoff Coordination", level: 5 },
      { name: "Scheduling", level: 4 },
      { name: "Incident Management", level: 4 },
    ],

    admin: [
      { name: "System Administration", level: 5 },
      { name: "User Management", level: 5 },
      { name: "Access Control", level: 5 },
      { name: "Reporting", level: 4 },
      { name: "System Support", level: 4 },
    ],
  };

  const skills = skillsByRole[user?.role] || [];

  return (
    <div className="container-fluid mt-4">
      {/* Page header */}
      <div className="row align-items-center mb-4">
        <div className="col">
          <h1 className="mb-0">Profile</h1>
        </div>
      </div>

      {/* Account information */}
      <div className="card border mb-4">
        <div className="card-header bg-light">
          <h4 className="mb-0">Account Information</h4>
        </div>

        <div className="card-body">
          <div className="row mb-3">
            <div className="col-md-4 fw-semibold">Name</div>
            <div className="col-md-8">{user?.name || "—"}</div>
          </div>

          <div className="row mb-3">
            <div className="col-md-4 fw-semibold">Role</div>
            <div className="col-md-8 text-capitalize">{user?.role || "—"}</div>
          </div>

          <div className="row">
            <div className="col-md-4 fw-semibold">Username</div>
            <div className="col-md-8">{user?.username || "—"}</div>
          </div>
        </div>
      </div>

      {/* Skills and expertise */}
      <div className="card border">
        <div className="card-header bg-light">
          <h4 className="mb-0">Skills & Expertise</h4>
        </div>

        <div className="card-body">
          <div className="border rounded overflow-hidden">
            <table className="table table-striped mb-0 align-middle">
              <thead>
                <tr>
                  <th>Skill</th>
                  <th>Level</th>
                </tr>
              </thead>

              <tbody>
                {skills.map((skill) => (
                  <tr key={skill.name}>
                    <td>{skill.name}</td>
                    <td>
                      <span className="me-2">
                        {"●".repeat(skill.level)}
                        {"○".repeat(5 - skill.level)}
                      </span>

                      <small className="text-muted">{skill.level}/5</small>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
