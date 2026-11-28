import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const SOCIAL_FIELDS = [
  { key: "websiteUrl",  label: "Website",     icon: "🌐", placeholder: "https://yourwebsite.com" },
  { key: "twitterUrl",  label: "Twitter / X", icon: "🐦", placeholder: "https://twitter.com/username" },
  { key: "githubUrl",   label: "GitHub",      icon: "💻", placeholder: "https://github.com/username" },
  { key: "linkedinUrl", label: "LinkedIn",    icon: "💼", placeholder: "https://linkedin.com/in/username" },
];

const BIO_MAX  = 280;
const URL_RE   = /^https?:\/\/[^\s]+\.[^\s]+$/i;
const isUrlLike = (v) => v === "" || URL_RE.test(v.trim());

export default function Profile() {
  const { account, token, refreshAccount } = useAuth();
  const nav = useNavigate();

  const [form, setForm] = useState({
    displayName: account?.displayName || "",
    bio:         account?.bio         || "",
    websiteUrl:  account?.websiteUrl  || "",
    twitterUrl:  account?.twitterUrl  || "",
    githubUrl:   account?.githubUrl   || "",
    linkedinUrl: account?.linkedinUrl || "",
  });

  const [avatar,  setAvatar]  = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [touched, setTouched] = useState({});

  const fileInputRef = useRef(null);
  const submitRef    = useRef(null);

  /* ---------------- avatar preview ---------------- */
  useEffect(() => {
    if (!avatar) { setPreview(null); return; }
    const url = URL.createObjectURL(avatar);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatar]);

  const previewAvatar =
    preview ||
    account?.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(account?.username || "U")}&background=af6a51&color=fff`;

  /* ---------------- dirty detection ---------------- */
  const dirty = useMemo(() => (
    avatar !== null ||
    form.displayName !== (account?.displayName || "") ||
    form.bio         !== (account?.bio         || "") ||
    form.websiteUrl  !== (account?.websiteUrl  || "") ||
    form.twitterUrl  !== (account?.twitterUrl  || "") ||
    form.githubUrl   !== (account?.githubUrl   || "") ||
    form.linkedinUrl !== (account?.linkedinUrl || "")
  ), [form, avatar, account]);

  /* ---------------- url validation ---------------- */
  const urlErrors = useMemo(() => {
    const e = {};
    for (const f of SOCIAL_FIELDS) {
      if (!isUrlLike(form[f.key])) e[f.key] = "Must start with http:// or https://";
    }
    return e;
  }, [form]);
  const hasErrors = Object.keys(urlErrors).length > 0;

  /* ---------------- handlers ---------------- */
  const set   = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const blur  = (key) => ()  => setTouched((t) => ({ ...t, [key]: true }));

  const onAvatarPick = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please pick an image file."); return; }
    if (file.size > 5 * 1024 * 1024)     { setError("Avatar must be under 5 MB."); return; }
    setError("");
    setAvatar(file);
  };

  const clearAvatar = () => {
    setAvatar(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const submit = async (e) => {
    if (e) e.preventDefault();
    if (loading || hasErrors) return;

    setError("");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("displayName", form.displayName);
      fd.append("bio",         form.bio);
      fd.append("websiteUrl",  form.websiteUrl);
      fd.append("twitterUrl",  form.twitterUrl);
      fd.append("githubUrl",   form.githubUrl);
      fd.append("linkedinUrl", form.linkedinUrl);
      if (avatar) fd.append("avatar", avatar);

      const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/anyblog";
      const res  = await fetch(`${BASE_URL}/profile`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to update profile");

      await refreshAccount();
      nav("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // keep ref pointing at the latest submit
  submitRef.current = submit;

  /* ---------------- ⌘/Ctrl + S ---------------- */
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        setTouched((t) => ({
          ...t,
          ...Object.fromEntries(SOCIAL_FIELDS.map((f) => [f.key, true])),
        }));
        if (hasErrors) return;
        submitRef.current?.(e);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [hasErrors]);

  /* ---------------- unsaved-changes guard ---------------- */
  useEffect(() => {
    if (!dirty) return;
    const handler = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  /* ---------------- render ---------------- */
  return (
    <>
      <header className="topbar">
        <Link to="/" className="brand">anyBlog</Link>
        <div className="topbar-right">
          <span className="muted">@{account?.username}</span>
          <button
            className="btn btn-ghost btn-sm"
            type="button"
            onClick={() => nav("/dashboard")}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </header>

      <main className="profile-container">
        <form onSubmit={submit} className="profile-card">
          {error && <div className="alert alert-error">{error}</div>}

          {/* ---------- section header ---------- */}
          <div className="profile-section">
            <h2>Edit your profile</h2>
            <p className="muted">Update how you appear across anyBlog.</p>
          </div>

          {/* ---------- avatar ---------- */}
          <div className="profile-avatar-row">
            <label
              className="profile-avatar-btn"
              htmlFor="avatar-upload"
              title="Change profile picture"
            >
              <img src={previewAvatar} alt="Avatar preview" className="profile-avatar-img" />
              <span className="profile-avatar-overlay">Change</span>
            </label>
            <input
              id="avatar-upload"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => onAvatarPick(e.target.files?.[0])}
            />

            <div className="profile-avatar-meta">
              <div className="profile-avatar-label">Profile picture</div>
              <p className="muted">JPG, PNG or GIF · max 5 MB</p>
              {avatar && (
                <button type="button" className="profile-avatar-remove" onClick={clearAvatar}>
                  Remove new photo
                </button>
              )}
            </div>
          </div>

          {/* ---------- display name ---------- */}
          <div className="profile-field">
            <label htmlFor="displayName">Display name</label>
            <input
              id="displayName"
              value={form.displayName}
              onChange={set("displayName")}
              placeholder="Your name"
              maxLength={64}
            />
          </div>

          {/* ---------- bio ---------- */}
          <div className="profile-field">
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              value={form.bio}
              onChange={set("bio")}
              placeholder="Tell readers a little about yourself…"
              rows={3}
              maxLength={BIO_MAX}
            />
            <div className={`profile-char ${form.bio.length > BIO_MAX * 0.9 ? "warn" : ""}`}>
              {form.bio.length} / {BIO_MAX}
            </div>
          </div>

          {/* ---------- socials ---------- */}
          <div className="profile-section-head">
            <h3>Social links</h3>
            <p className="muted">Optional — shown on your dashboard.</p>
          </div>

          <div className="profile-social-grid">
            {SOCIAL_FIELDS.map((f) => {
              const showErr = touched[f.key] && urlErrors[f.key];
              return (
                <div key={f.key} className={`profile-field ${showErr ? "has-error" : ""}`}>
                  <label htmlFor={f.key}>
                    <span className="profile-field-icon">{f.icon}</span>
                    {f.label}
                  </label>
                  <input
                    id={f.key}
                    value={form[f.key]}
                    onChange={set(f.key)}
                    onBlur={blur(f.key)}
                    placeholder={f.placeholder}
                    inputMode="url"
                  />
                  {showErr && (
                    <span className="profile-field-error">{urlErrors[f.key]}</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* ---------- actions ---------- */}
          <div className="profile-actions">
            <button
              type="submit"
              className="btn btn-primary profile-save"
              disabled={loading || hasErrors || !dirty}
            >
              {loading ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => nav("/dashboard")}
              disabled={loading}
            >
              Cancel
            </button>
            {dirty && <span className="profile-dirty-hint">Unsaved changes</span>}
          </div>
        </form>

        {/* ---------- live preview ---------- */}
        <aside className="profile-preview">
          <div className="profile-preview-label">Live preview</div>
          <div className="profile-preview-card">
            <img src={previewAvatar} alt="Avatar" className="profile-preview-avatar" />
            <div className="profile-preview-name">
              {form.displayName || account?.username}
            </div>
            <div className="profile-preview-handle">@{account?.username}</div>

            {form.bio && <p className="profile-preview-bio">"{form.bio}"</p>}

            {SOCIAL_FIELDS.some((f) => form[f.key].trim() && isUrlLike(form[f.key])) && (
              <div className="profile-preview-socials">
                {SOCIAL_FIELDS
                  .filter((f) => form[f.key].trim() && isUrlLike(form[f.key]))
                  .map((f) => (
                    <span key={f.key} className="profile-preview-social" title={f.label}>
                      {f.icon}
                    </span>
                  ))}
              </div>
            )}
          </div>
        </aside>
      </main>
    </>
  );
}