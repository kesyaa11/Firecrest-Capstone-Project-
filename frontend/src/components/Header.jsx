import { useNavigate } from "react-router-dom";
import logo from "../assets/FC-colourWeb.png";
import { useAuth } from "../auth/AuthContext";
import { useEffect, useState } from "react";

export default function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Statevar to store if profile menu is open
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Close the profile menu when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuOpen && !event.target.closest(".profile-menu-container")) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileMenuOpen]);

  return (
    <header
      className="d-flex align-items-center"
      style={{
        position: "relative",
        zIndex: 1050,
      }}
    >
      <img className="p-2" src={logo} />

      {user && (
        <>
          <div className="ms-auto p-2">
            Logged in: {user.name} ({user.role})
          </div>
          <div className="position-relative profile-menu-container">
            {/* Profile avatar */}
            <button
              type="button"
              className="btn rounded-circle d-inline-flex align-items-center justify-content-center me-3"
              style={{
                width: "48px",
                height: "48px",
                backgroundColor: "#e9ecef",
                fontWeight: "600",
                transition: "0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#dee2e6";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#e9ecef";
              }}
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            >
              {user.name
                ?.split(" ")
                .map((namePart) => namePart[0])
                .join("")
                .toUpperCase()}
            </button>

            {/* Profile Menu */}
            {profileMenuOpen && (
              <div
                className="position-absolute bg-white border rounded shadow-sm p-3"
                style={{
                  top: "100%",
                  right: "0",
                  width: "240px",
                  zIndex: 1000,
                }}
              >
                <div className="fw-semibold">{user.name}</div>
                <div className="text-muted small mb-3">{user.role}</div>

                <button
                  type="button"
                  className="btn w-100 text-start"
                  style={{
                    padding: "8px 10px",
                    color: "#212529",
                    borderRadius: "6px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#e9ecef";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                  onClick={() => {
                    setProfileMenuOpen(false);
                    navigate("/profile");
                  }}
                >
                  Profile
                </button>

                <button
                  type="button"
                  className="btn w-100 text-start"
                  style={{
                    padding: "8px 10px",
                    color: "#212529",
                    borderRadius: "6px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#e9ecef";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                  onClick={() => {
                    setProfileMenuOpen(false);
                    navigate("/preferences");
                  }}
                >
                  Preferences
                </button>
                <hr />
                <button
                  type="button"
                  className="btn w-100 text-start"
                  style={{
                    padding: "8px 10px",
                    color: "#212529",
                    borderRadius: "6px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#e9ecef";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                  onClick={() => {
                    setProfileMenuOpen(false);
                    navigate("/help");
                  }}
                >
                  Help & Support
                </button>

                <hr />

                <button
                  type="button"
                  className="btn w-100 text-start"
                  style={{
                    padding: "8px 10px",
                    color: "#dc3545",
                    borderRadius: "6px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#e9ecef";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </header>
  );
}
