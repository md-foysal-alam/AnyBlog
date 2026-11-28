import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { postApi } from "../api/posts.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function WritePost() {
  const nav = useNavigate();
  const { token, refreshAccount } = useAuth();

  const [title, setTitle]           = useState("");
  const [content, setContent]       = useState("");
  const [status, setStatus]         = useState("published");
  const [image, setImage]           = useState(null);
  const [imagePreview, setPreview]  = useState(null);
  const [tab, setTab]               = useState("write");    // "write" | "preview"
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const fileInputRef                = useRef(null);

  /* ---------------- derived ---------------- */
  const wordCount   = useMemo(
    () => content.trim().split(/\s+/).filter(Boolean).length,
    [content]
  );
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));
  const canSubmit   = Boolean(title.trim() && content.trim()) && !loading;

  /* ---------------- cover image preview ---------------- */
  useEffect(() => {
    if (!image) { setPreview(null); return; }
    const url = URL.createObjectURL(image);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  const onImagePick = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please choose an image file."); return; }
    if (file.size > 5 * 1024 * 1024)     { setError("Image must be under 5 MB.");    return; }
    setError("");
    setImage(file);
  };

  const removeImage = () => {
    setImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /* ---------------- submit ---------------- */
  const submit = async (e) => {
    if (e) e.preventDefault();
    if (!canSubmit) return;
    setError("");
    setLoading(true);
    try {
      let imageUrl = null;
      if (image) {
        const fd = new FormData();
        fd.append("image", image);
        const upRes  = await fetch(`${import.meta.env.VITE_API_URL}/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        const upData = await upRes.json();
        if (!upRes.ok) throw new Error(upData.message || "Image upload failed");
        imageUrl = upData.data.url;
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

  /* ---------------- unsaved-changes guard ---------------- */
  useEffect(() => {
    if (!title.trim() && !content.trim()) return;
    const handler = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [title, content]);

  /* ---------------- ⌘/Ctrl+Enter to submit ---------------- */
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit(e);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [canSubmit, title, content, status, image]);

  /* ---------------- render ---------------- */
  return (
    <>
      <header className="topbar">
        <Link to="/" className="brand">anyBlog</Link>
        <div className="topbar-right">
          <span className="editor-hint">⌘ / Ctrl + Enter to {status === "published" ? "publish" : "save"}</span>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => nav("/dashboard")}
            disabled={loading}
            type="button"
          >
            Cancel
          </button>
        </div>
      </header>

      <main className="container editor-container">
        <form onSubmit={submit} className="editor-card">
          {error && <div className="alert alert-error">{error}</div>}

          {/* ---------- cover image ---------- */}
          {imagePreview ? (
            <div className="editor-cover-preview">
              <img src={imagePreview} alt="Cover preview" />
              <button
                type="button"
                className="editor-cover-remove"
                onClick={removeImage}
              >
                ✕ Remove
              </button>
            </div>
          ) : (
            <label className="editor-cover-drop" htmlFor="cover-upload">
              <input
                id="cover-upload"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => onImagePick(e.target.files[0])}
                hidden
              />
              <span className="editor-cover-icon">🖼️</span>
              <span className="editor-cover-label">Add a cover image</span>
              <span className="editor-cover-hint">Optional · click to browse</span>
            </label>
          )}

          {/* ---------- title ---------- */}
          <input
            className="editor-title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            maxLength={200}
            required
          />
          <div className="editor-title-count">{title.length} / 200</div>

          {/* ---------- write / preview tabs ---------- */}
          <div className="editor-tabs">
            <button
              type="button"
              className={`editor-tab ${tab === "write" ? "active" : ""}`}
              onClick={() => setTab("write")}
            >
              Write
            </button>
            <button
              type="button"
              className={`editor-tab ${tab === "preview" ? "active" : ""}`}
              onClick={() => setTab("preview")}
            >
              Preview
            </button>
          </div>

          {tab === "write" ? (
            <textarea
              className="editor-content-input"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Tell your story…"
              rows={16}
              required
            />
          ) : (
            <div className="editor-preview">
              {title && <h1 className="editor-preview-title">{title}</h1>}
              {content ? (
                <div className="editor-preview-body">{content}</div>
              ) : (
                <p className="muted">Nothing to preview yet — start writing!</p>
              )}
            </div>
          )}

          {/* ---------- footer ---------- */}
          <div className="editor-footer">
            <div className="editor-stats">
              <span>{wordCount} words</span>
              <span className="editor-stat-sep">•</span>
              <span>{readingTime} min read</span>
            </div>

            <div className="editor-controls">
              <div className="editor-status-toggle" role="group" aria-label="Publish status">
                <button
                  type="button"
                  className={`editor-status-btn ${status === "draft" ? "active" : ""}`}
                  onClick={() => setStatus("draft")}
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  className={`editor-status-btn ${status === "published" ? "active" : ""}`}
                  onClick={() => setStatus("published")}
                >
                  Publish
                </button>
              </div>

              <button type="submit" className="btn btn-primary editor-submit" disabled={!canSubmit}>
                {loading
                  ? "Saving…"
                  : status === "published"
                    ? "Publish Post"
                    : "Save Draft"}
              </button>
            </div>
          </div>
        </form>
      </main>
    </>
  );
}