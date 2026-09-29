import { useState } from "react";
import ChangePasswordModal from "../components/ChangePasswordModal";

export default function Preferences() {
  const [darkMode, setDarkMode] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  return (
    <div className="container mt-4">
      <div className="card shadow-sm mx-auto" style={{ maxWidth: "750px" }}>
        <div className="card-body p-4">
          <h3 className="text-center mb-4">⚙️ Preferences</h3>

          <h5 className="mb-2">Appearance</h5>

          <div className="d-flex justify-content-between align-items-center border-top border-bottom py-3 px-4 mb-4">
            <span>Dark Mode</span>

            <div className="form-check form-switch mb-0">
              <input
                className="form-check-input"
                type="checkbox"
                checked={darkMode}
                onChange={(e) => setDarkMode(e.target.checked)}
              />
            </div>
          </div>

          <h5 className="mb-2">Security</h5>

          <div className="d-flex justify-content-between align-items-center border-top py-3 px-4">
            <span>Change Password</span>

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
