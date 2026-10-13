import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

// authentik sends the browser back here after sign in, this finishes the login
export default function AuthCallback() {
  const { completeLogin } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function finish() {
      const result = await completeLogin();
      if (cancelled) return;

      if (result.error) {
        setError(result.error);
      } else {
        navigate("/dashboard", { replace: true });
      }
    }

    finish();

    return () => {
      cancelled = true;
    };
    // The login is completed once, completeLogin reuses the same promise if this runs again
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="container mt-5 py-5 text-center">
        <div className="text-danger mb-3" role="alert">
          {error.message}
        </div>
        <Link to="/">Back to sign in</Link>
      </div>
    );
  }

  return <div className="container mt-5 py-5 text-center">Signing you in...</div>;
}
