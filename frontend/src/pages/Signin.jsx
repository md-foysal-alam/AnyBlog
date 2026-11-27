import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/auth.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Signin() {
  const nav = useNavigate();
  const { signIn } = useAuth();

  const [step, setStep] = useState("password");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submitPassword = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await api.signin({ identifier: identifier.trim(), password });
      setSentTo(res.data.sentTo || "");
      setStep("otp");
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const submitOtp = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await api.verifySigninOtp({ identifier: identifier.trim(), otp: otp.trim() });
      signIn(res.data.token, res.data.account);
      nav("/dashboard", { replace: true });
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="center">
      <form onSubmit={step === "password" ? submitPassword : submitOtp} className="card">
        <h2>Sign in to anyBlog</h2>
        {error && <div className="alert alert-error">{error}</div>}

        {step === "password" && (
          <>
            <label>Email or username</label>
            <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} autoComplete="username" required />

            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />

            <button type="submit" className="btn btn-primary block" disabled={loading}>
              {loading ? "Signing in…" : "Continue"}
            </button>

            <p className="muted center-text"><Link to="/forgot-password">Forgot password?</Link></p>
            <p className="muted center-text">No account? <Link to="/signup">Sign up</Link></p>
          </>
        )}

        {step === "otp" && (
          <>
            <p className="muted">We sent a 6-digit code to <strong>{sentTo || "your email"}</strong>.</p>
            <label>Verification code</label>
            <input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" placeholder="123456" maxLength={6} required style={{ letterSpacing: 8, textAlign: "center", fontSize: 24 }} />
            <button type="submit" className="btn btn-primary block" disabled={loading || otp.length !== 6}>
              {loading ? "Verifying…" : "Verify & sign in"}
            </button>
            <button type="button" className="btn btn-ghost block" onClick={() => { setStep("password"); setOtp(""); setError(""); }} disabled={loading}>
              ← Back
            </button>
          </>
        )}
      </form>
    </div>
  );
}