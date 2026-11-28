import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Profile() {
  const { account, token, refreshAccount } = useAuth();
  const nav = useNavigate();

  const [form, setForm] = useState({
    displayName: account?.displayName || "",
    bio: account?.bio || "",
    websiteUrl: account?.websiteUrl || "",
    twitterUrl: account?.twitterUrl || "",
    githubUrl: account?.githubUrl || "",
    linkedinUrl: account?.linkedinUrl || "",
  });
  
  const [avatar, setAvatar] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formData = new FormData();
      
      // Append all text fields
      formData.append("displayName", form.displayName);
      formData.append("bio", form.bio);
      formData.append("websiteUrl", form.websiteUrl);
      formData.append("twitterUrl", form.twitterUrl);
      formData.append("githubUrl", form.githubUrl);
      formData.append("linkedinUrl", form.linkedinUrl);
      
      // Append the image file if selected (Key MUST be "avatar")
      if (avatar) {
        formData.append("avatar", avatar); 
      }

      const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/anyblog";
      
      const res = await fetch(`${BASE_URL}/profile`, {
        method: "PUT",
        headers: { 
          Authorization: `Bearer ${token}` 
          // DO NOT set Content-Type here. Let the browser do it.
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update profile");

      await refreshAccount(); // Update AuthContext to show new avatar everywhere
      nav("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header className="topbar">
        <strong>anyBlog</strong>
        <button className="btn btn-ghost" onClick={() => nav("/dashboard")}>Cancel</button>
      </header>
      
      <main className="container">
        <form onSubmit={submit} className="card" style={{ maxWidth: 700 }}>
          <h2>Edit Your Profile</h2>
          {error && <div className="alert alert-error">{error}</div>}

          <div style={{ display: "flex", gap: 20, alignItems: "center", marginBottom: 16 }}>
            <img 
              src={avatar ? URL.createObjectURL(avatar) : account?.avatarUrl || "https://ui-avatars.com/api/?name=" + (account?.username || "U")} 
              alt="Avatar" 
              style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--border)" }} 
            />
            <div>
              <label style={{ margin: 0, display: "block" }}>Profile Picture</label>
              <input type="file" accept="image/*" onChange={(e) => setAvatar(e.target.files[0])} style={{ border: "none", padding: 0 }} />
            </div>
          </div>

          <label>Display Name</label>
          <input value={form.displayName} onChange={set("displayName")} placeholder="Your Name" />

          <label>Bio</label>
          <textarea value={form.bio} onChange={set("bio")} placeholder="Tell us about yourself..." rows={3} style={{ resize: "vertical" }} />

          <h3 style={{ marginTop: 16 }}>Social Links</h3>
          
          <label>Website</label>
          <input value={form.websiteUrl} onChange={set("websiteUrl")} placeholder="https://yourwebsite.com" />

          <label>Twitter / X</label>
          <input value={form.twitterUrl} onChange={set("twitterUrl")} placeholder="https://twitter.com/username" />

          <label>GitHub</label>
          <input value={form.githubUrl} onChange={set("githubUrl")} placeholder="https://github.com/username" />

          <label>LinkedIn</label>
          <input value={form.linkedinUrl} onChange={set("linkedinUrl")} placeholder="https://linkedin.com/in/username" />

          <button type="submit" className="btn btn-primary block" disabled={loading} style={{ marginTop: 24 }}>
            {loading ? "Saving Profile..." : "Save Profile"}
          </button>
        </form>
      </main>
    </>
  );
}