import { useNavigate } from "react-router-dom";

export default function ForgotPassword() {
  const navigate = useNavigate();

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-5">
          <div className="card shadow-sm">
            <div className="card-body p-4">
              <h3 className="text-center mb-3">Forgot Password</h3>

              <p className="text-muted text-center mb-4">
                Enter your email address and you'll receive a link with
                instructions.
              </p>

              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-control mb-3"
                placeholder="Enter your email"
              />

              <button type="button" className="btn btn-primary w-100">
                Send Reset Link
              </button>

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
