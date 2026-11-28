import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { postApi } from "../api/posts.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function WritePost() {
  const nav = useNavigate();
  const { token, refreshAccount } = useAuth();
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("published");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      let imageUrl = null;
      if (image) {
        const formData = new FormData();
        formData.append("image", image);
        const uploadRes = await fetch("https://anyblog.onrender.com/upload", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.message || "Image upload failed");
        imageUrl = uploadData.data.url;
      }

      await postApi.createPost({ title, content, status, imageUrl }, token);
      await refreshAccount();
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
          <h2>Write a new post</h2>
          
          {error && <div className="alert alert-error">{error}</div>}

          <label>Cover Image (Optional)</label>
          <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} style={{ border: "1px dashed var(--border)", padding: "12px" }} />
          {image && <small className="muted">Selected: {image.name}</small>}

          <label>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="An interesting title..." required style={{ fontFamily: "var(--font-serif)", fontSize: 24, padding: 16 }} />

          <label>Content</label>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write your thoughts here..." rows={12} required style={{ resize: "vertical", fontSize: 16, lineHeight: 1.6 }} />

          <label>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="published">Publish immediately</option>
            <option value="draft">Save as Draft</option>
          </select>

          <button type="submit" className="btn btn-primary block" disabled={loading} style={{ marginTop: 16, padding: 16, fontSize: 16 }}>
            {loading ? "Uploading and Saving..." : "Publish Post"}
          </button>
        </form>
      </main>
    </>
  );
}