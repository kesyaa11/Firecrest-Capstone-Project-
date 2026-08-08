import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    navigate("/dashboard");
  };

  return (
    <div className="container mt-5 py-5">
      <div className="row">
        <div className="col-6 offset-3">
          <form onSubmit={handleLogin}>
            <div className="row mb-3">
              <div className="col-4 text-end">Username:</div>

              <div className="col-8">
                <input
                  className="form-control"
                  name="username"
                  placeholder="manager, dev or sd"
                />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-4 text-end">Password:</div>

              <div className="col-8">
                <input
                  className="form-control"
                  name="password"
                  placeholder="leave blank..."
                />
              </div>
            </div>

            <div className="text-center">
              <button type="submit" className="btn btn-primary">
                Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
