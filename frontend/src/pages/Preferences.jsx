// Preferences page for managing appearance and account security settings
import { useState } from "react";
import ChangePasswordModal from "../components/ChangePasswordModal";

export default function Preferences() {
  const [darkMode, setDarkMode] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  return (
    <div className="container-fluid mt-4">
      {/* Page header */}
      <div className="row align-items-center mb-4">
        <div className="col">
          <h1 className="mb-0">Preferences</h1>
        </div>
      </div>

      {/* Appearance */}
      <div className="card border mb-4">
        <div className="card-header bg-light">
          <h4 className="mb-0">Appearance</h4>
        </div>

        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h6 className="mb-1">Dark Mode</h6>
              <p className="small text-muted mb-0">
                Switch between light and dark appearance.
              </p>
            </div>

            <div className="form-check form-switch mb-0">
              <input
                className="form-check-input"
                type="checkbox"
                checked={darkMode}
                onChange={(e) => setDarkMode(e.target.checked)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="card border mb-4">
        <div className="card-header bg-light">
          <h4 className="mb-0">Security</h4>
        </div>

        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h6 className="mb-1">Change Password</h6>
              <p className="small text-muted mb-0">
                Update your account password.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={() => setShowChangePassword(true)}
            >
              Change Password
            </button>
          </div>
        </div>
      </div>

      {showChangePassword && (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
      )}
    </div>
  );
}
