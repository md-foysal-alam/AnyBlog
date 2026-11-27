import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/auth.js";

export default function ForgotPassword() {
  const nav = useNavigate();
  const [step, setStep] = useState("request");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const requestCode = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try { await api.requestPasswordReset(email.trim()); setStep("reset"); } 
    catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const resetPassword = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try { await api.resetPassword({ email: email.trim(), otp: otp.trim(), newPassword }); setStep("done"); } 
    catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  if (step === "done") {
    return (
      <div className="center">
        <div className="card">
          <h2>Password updated ✅</h2>
          <p className="muted">All existing sessions were signed out. Sign in with your new password.</p>
          <Link to="/signin" className="btn btn-primary block">Go to Signin</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="center">
      <form onSubmit={step === "request" ? requestCode : resetPassword} className="card">
        <h2>Reset your password</h2>
        {error && <div className="alert alert-error">{error}</div>}

        {step === "request" && (
          <>
            <p className="muted">Enter your account email and we'll send a 6-digit reset code.</p>
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
            <button type="submit" className="btn btn-primary block" disabled={loading}>
              {loading ? "Sending…" : "Send reset code"}
            </button>
            <p className="muted center-text"><Link to="/signin">← Back to signin</Link></p>
          </>
        )}

        {step === "reset" && (
          <>
            <p className="muted">We sent a code to <strong>{email}</strong>.</p>
            <label>Reset code</label>
            <input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" placeholder="123456" maxLength={6} required style={{ letterSpacing: 8, textAlign: "center", fontSize: 24 }} />
            
            <label>New password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={8} autoComplete="new-password" required />
            <small className="muted">At least 8 characters</small>

            <button type="submit" className="btn btn-primary block" disabled={loading || otp.length !== 6 || newPassword.length < 8}>
              {loading ? "Updating…" : "Update password"}
            </button>
            <button type="button" className="btn btn-ghost block" onClick={() => { setStep("request"); setOtp(""); setNewPassword(""); setError(""); }} disabled={loading}>
              ← Use a different email
            </button>
          </>
        )}
      </form>
    </div>
  );
}