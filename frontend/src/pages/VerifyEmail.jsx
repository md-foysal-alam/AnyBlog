import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api/auth.js";

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [state, setState] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setState("error");
      setMessage("Missing verification token.");
      return;
    }
    let cancelled = false;
    api.verifyEmail(token)
      .then(() => { if (!cancelled) setState("ok"); })
      .catch((err) => {
        if (cancelled) return;
        setState("error");
        setMessage(err.message);
      });
    return () => { cancelled = true; };
  }, [token]);

  return (
    <div className="center">
      <div className="card center-text">
        {state === "loading" && <h2>Verifying your email…</h2>}

        {state === "ok" && (
          <>
            <h2>Email verified ✅</h2>
            <p className="muted">Your account is ready. Sign in to continue.</p>
            <Link to="/signin" className="btn btn-primary block">Go to Signin</Link>
          </>
        )}

        {state === "error" && (
          <>
            <h2>Verification failed</h2>
            <p className="muted">{message}</p>
            <Link to="/signin" className="btn btn-ghost block">Go to Signin</Link>
          </>
        )}
      </div>
    </div>
  );
}