import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { postApi } from "../api/posts.js";
import { useAuth } from "../context/AuthContext.jsx";

const readingTime = (content = "") => {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
};

const excerpt = (content = "", max = 180) => {
  const clean = content.replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : clean.slice(0, max).trimEnd() + "…";
};

const formatDate = (iso) => {
  const d = new Date(iso);
  return isNaN(d) ? "" : d.toLocaleDateString(undefined, {
    month: "short", day: "numeric", year: "numeric",
  });
};

const avatarUrl = (user) =>
  user?.avatarUrl ||
  `https://ui-avatars.com/api/?name=${encodeURIComponent(
    user?.username || "user"
  )}&background=af6a51&color=fff`;

/* =====================================================================
 * React button — own state so each card updates independently
 * ===================================================================== */
function ReactButton({ post, account, token, onNeedAuth }) {
  const [liked,  setLiked]  = useState(Boolean(post.likedByMe));
  const [count,  setCount]  = useState(Number(post.likeCount ?? 0));
  const [busy,   setBusy]   = useState(false);

  const click = async () => {
    if (!account) { onNeedAuth(); return; }
    if (busy) return;

    const wasLiked = liked;
    setLiked(!wasLiked);
    setCount((c) => Math.max(0, c + (wasLiked ? -1 : 1)));
    setBusy(true);

    try {
      const res = await postApi.reactToPost(post.id, token);
      setLiked(Boolean(res.data.liked));
      setCount(Number(res.data.likeCount));
    } catch {
      setLiked(wasLiked);
      setCount((c) => Math.max(0, c + (wasLiked ? 1 : -1)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      className={`action-btn action-like ${liked ? "liked" : ""}`}
      onClick={click}
      disabled={busy}
      aria-pressed={liked}
      aria-label={liked ? "Remove reaction" : "React with love"}
    >
      <span className="heart">{liked ? "❤️" : "🤍"}</span> {count}
    </button>
  );
}

/* =====================================================================
 * Feed
 * ===================================================================== */
export default function Feed() {
  const { account, stats, token } = useAuth();
  const nav = useNavigate();

  const [posts,   setPosts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    let cancelled = false;

    postApi.getFeed(token)
      .then((res) => { if (!cancelled) setPosts(res?.data ?? []); })
      .catch((err) => { if (!cancelled) setError(err.message || "Failed to load feed."); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [token]);

  const needAuth = () => nav("/signin", { state: { from: "/" } });

  return (
    <>
      <header className="topbar">
        <Link to="/" className="brand">anyBlog</Link>
        <div className="topbar-right">
          {account ? (
            <Link to="/dashboard" className="btn btn-ghost btn-sm">Dashboard</Link>
          ) : (
            <Link to="/signin" className="btn btn-primary btn-sm">Sign In</Link>
          )}
        </div>
      </header>

      <div className="feed-layout">
        <aside className="feed-sidebar">
          {account ? (
            <div className="side-profile">
              <img src={avatarUrl(account)} alt={account.username} className="side-avatar" />
              <div className="side-name">{account.displayName || account.username}</div>
              <div className="side-handle">@{account.username}</div>

              <Link to="/write" className="btn btn-primary block" style={{ marginTop: 14 }}>
                ✍️ Write a Post
              </Link>
              <Link to="/dashboard" className="btn btn-ghost block" style={{ marginTop: 8 }}>
                📊 Dashboard
              </Link>

              <div className="side-stats">
                <div className="side-stat">
                  <span className="side-stat-num">{stats.totalPosts}</span>
                  <span className="side-stat-label">Posts</span>
                </div>
                <div className="side-stat">
                  <span className="side-stat-num">{stats.publishedPosts}</span>
                  <span className="side-stat-label">Published</span>
                </div>
                <div className="side-stat">
                  <span className="side-stat-num">{stats.draftPosts}</span>
                  <span className="side-stat-label">Drafts</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="side-cta">
              <h3>Welcome to anyBlog</h3>
              <p className="muted">Join a community of writers and readers.</p>
              <Link to="/signin" className="btn btn-primary block">Sign In</Link>
              <Link to="/signup" className="btn btn-ghost block" style={{ marginTop: 8 }}>
                Create Account
              </Link>
            </div>
          )}

          <nav className="side-nav">
            <Link to="/" className="side-nav-item active">🏠 Home</Link>
            <Link to="/tags" className="side-nav-item">🏷️ Tags</Link>
            <Link to="/trending" className="side-nav-item">🔥 Trending</Link>
            <Link to="/about" className="side-nav-item">ℹ️ About</Link>
          </nav>
        </aside>

        <main className="feed-main">
          <div className="page-head">
            <h1>Latest Stories</h1>
            <div className="feed-tabs">
              <button className="feed-tab active">Hot</button>
              <button className="feed-tab">New</button>
              <button className="feed-tab">Top</button>
            </div>
          </div>

          {loading && <p className="muted">Loading feed…</p>}
          {!loading && error && <div className="alert alert-error">{error}</div>}
          {!loading && !error && posts.length === 0 && (
            <p className="muted">No posts yet. Be the first to write one!</p>
          )}

          <div className="feed-list">
            {posts.map((post) => (
              <article key={post.id} className="feed-card">
                <div className="vote-col">
                  <button className="vote-btn" aria-label="Upvote" title="Voting coming soon">▲</button>
                  <span className="vote-count">{post.voteCount ?? 0}</span>
                  <button className="vote-btn" aria-label="Downvote" title="Voting coming soon">▼</button>
                </div>

                <div className="feed-card-body">
                  <div className="feed-card-meta">
                    <img
                      src={avatarUrl(post.author)}
                      alt={post.author?.username || "author"}
                      className="feed-avatar"
                    />
                    <span className="feed-author">
                      {post.author?.displayName || post.author?.username || "Anonymous"}
                    </span>
                    <span className="feed-sep">•</span>
                    <span className="feed-date">{formatDate(post.createdAt)}</span>
                    <span className="feed-sep">•</span>
                    <span className="feed-read">{readingTime(post.content)} min read</span>
                  </div>

                  <h2 className="feed-card-title">
                    <Link to={`/post/${post.id}`}>{post.title}</Link>
                  </h2>

                  {post.media?.[0]?.url && (
                    <Link to={`/post/${post.id}`} className="feed-thumb-link">
                      <img
                        src={post.media[0].url}
                        alt={post.title}
                        className="feed-thumb"
                        loading="lazy"
                      />
                    </Link>
                  )}

                  <p className="feed-card-excerpt">{excerpt(post.content)}</p>

                  <div className="feed-actions">
                    <ReactButton
                      post={post}
                      account={account}
                      token={token}
                      onNeedAuth={needAuth}
                    />
                    <Link to={`/post/${post.id}#comments`} className="action-btn">
                      💬 {post.commentCount != null ? post.commentCount : "Comments"}
                    </Link>
                    <button className="action-btn" type="button">🔖 Save</button>
                    <Link to={`/post/${post.id}`} className="action-btn action-read-more">
                      Read more →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </main>
      </div>
    </>
  );
}