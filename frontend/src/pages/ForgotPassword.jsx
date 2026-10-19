import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!success) return;

    const timer = setTimeout(() => setSuccess(false), 4000);
    return () => clearTimeout(timer);
  }, [success]);

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-5">
          <div className="card shadow-sm">
            <div className="card-body p-4">
              <h3 className="text-center mb-3">Forgot Password</h3>

              {/* password reset instructions */}
              <p className="text-muted text-center mb-4">
                Enter your email address and you&apos;ll receive a link with
                instructions.
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSuccess(true);
                }}
              >
                {/* Email input field for the password reset request */}
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-control mb-3"
                  placeholder="Enter your email"
                  pattern="[^@\s]+@[^@\s]+\.[^@\s]+"
                  title="Please enter a valid email address (e.g. name@example.com)"
                  required
                  onChange={() => setSuccess(false)}
                />

                <button type="submit" className="btn btn-primary w-100">
                  Send Reset Link
                </button>
              </form>

              {success && (
                <div className="alert alert-success mt-3" role="status">
                  Email validated. Password reset functionality is not yet
                  available.
                </div>
              )}

              <div className="text-center mt-3">
                <button
                  type="button"
                  className="btn btn-link text-decoration-none"
                  onClick={() => navigate("/")}
                >
                  Back to Login
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
