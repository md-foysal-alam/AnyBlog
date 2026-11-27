import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/auth.js";

export default function Signup() {
  const [form, setForm] = useState({ email: "", username: "", password: "", displayName: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await api.signup({ email: form.email.trim(), username: form.username.trim(), password: form.password, displayName: form.displayName.trim() || null });
      setDone(true);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  if (done) {
    return (
      <div className="center">
        <div className="card">
          <h2>Account created ✅</h2>
          <p className="muted">We sent a verification link to <strong>{form.email}</strong>. Open it to verify your email, then sign in.</p>
          <Link to="/signin" className="btn btn-primary block">Go to Signin</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="center">
      <form onSubmit={submit} className="card">
        <h2>Create your account</h2>
        {error && <div className="alert alert-error">{error}</div>}

        <label>Email</label>
        <input type="email" value={form.email} onChange={set("email")} autoComplete="email" required />

        <label>Username</label>
        <input type="text" value={form.username} onChange={set("username")} autoComplete="username" pattern="[a-z0-9_]{3,30}" title="3-30 lowercase letters, numbers, or underscore" required />
        <small className="muted">3-30 chars: a-z, 0-9, _</small>

        <label>Display name <span className="muted">(optional)</span></label>
        <input type="text" value={form.displayName} onChange={set("displayName")} autoComplete="name" />

        <label>Password</label>
        <input type="password" value={form.password} onChange={set("password")} autoComplete="new-password" minLength={8} required />
        <small className="muted">At least 8 characters</small>

        <button type="submit" className="btn btn-primary block" disabled={loading} style={{ marginTop: 12 }}>
          {loading ? "Creating account…" : "Sign up"}
        </button>
        <p className="muted center-text">Already have an account? <Link to="/signin">Sign in</Link></p>
      </form>
    </div>
  );
}