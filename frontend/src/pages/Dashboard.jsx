import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Dashboard() {
  const { account, stats, myPosts, signOut } = useAuth();
  const nav = useNavigate();

  const [filter, setFilter] = useState("all"); // "all" | "published" | "draft"

  if (!account) return null;

  const logout = async () => {
    await signOut();
    nav("/signin");
  };

  const avatarUrl =
    account.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(account.username)}&background=af6a51&color=fff`;

  const socials = [
    { key: "websiteUrl",  label: "Website",     icon: "🌐", url: account.websiteUrl  },
    { key: "twitterUrl",  label: "Twitter / X", icon: "🐦", url: account.twitterUrl  },
    { key: "githubUrl",   label: "GitHub",      icon: "💻", url: account.githubUrl   },
    { key: "linkedinUrl", label: "LinkedIn",    icon: "💼", url: account.linkedinUrl },
  ].filter((s) => Boolean(s.url));

  const filtered = myPosts.filter((p) =>
    filter === "all" ? true : p.status === filter
  );

  return (
    <>
      <header className="topbar">
        <Link to="/" className="brand">anyBlog</Link>
        <div className="topbar-right">
          <span className="muted">{account.displayName || account.username}</span>
          <button className="btn btn-ghost btn-sm" onClick={logout}>Sign out</button>
        </div>
      </header>

      <main className="container dash-container">
        {/* -------------------- PROFILE HEADER -------------------- */}
        <section className="dash-profile">
          <img src={avatarUrl} alt={account.username} className="dash-avatar" />

          <div className="dash-profile-body">
            <h1 className="dash-name">
              {account.displayName || account.username}
              <span className={`dash-badge ${account.emailVerified ? "ok" : "warn"}`}>
                {account.emailVerified ? "verified" : "unverified"}
              </span>
            </h1>

            <div className="dash-sub">
              <span className="dash-handle">@{account.username}</span>
              <span className="dash-sub-sep">•</span>
              <span>{account.email}</span>
            </div>

            {account.bio && <p className="dash-bio">"{account.bio}"</p>}

            {socials.length > 0 && (
              <div className="dash-socials">
                {socials.map((s) => (
                  <a
                    key={s.key}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="dash-social"
                  >
                    <span>{s.icon}</span> {s.label}
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="dash-actions">
            <Link to="/write" className="btn btn-primary">✍️ Write a Post</Link>
            <Link to="/profile" className="btn btn-ghost">Edit Profile</Link>
          </div>
        </section>

        {/* -------------------- STATS (clickable filters) -------------------- */}
        <section className="dash-stats">
          <button
            type="button"
            className={`dash-stat ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            <span className="dash-stat-num">{stats.totalPosts}</span>
            <span className="dash-stat-label">Total posts</span>
          </button>
          <button
            type="button"
            className={`dash-stat ${filter === "published" ? "active" : ""}`}
            onClick={() => setFilter("published")}
          >
            <span className="dash-stat-num">{stats.publishedPosts}</span>
            <span className="dash-stat-label">Published</span>
          </button>
          <button
            type="button"
            className={`dash-stat ${filter === "draft" ? "active" : ""}`}
            onClick={() => setFilter("draft")}
          >
            <span className="dash-stat-num">{stats.draftPosts}</span>
            <span className="dash-stat-label">Drafts</span>
          </button>
        </section>

        {/* -------------------- POSTS LIST -------------------- */}
        <section className="dash-posts">
          <div className="dash-posts-head">
            <h3>Your Posts</h3>
            {filter !== "all" && (
              <button
                type="button"
                className="dash-clear-filter"
                onClick={() => setFilter("all")}
              >
                Clear filter ✕
              </button>
            )}
          </div>

          {myPosts.length === 0 ? (
            <div className="dash-empty">
              <p className="muted">You haven't written anything yet.</p>
              <Link to="/write" className="btn btn-primary">Write your first post</Link>
            </div>
          ) : filtered.length === 0 ? (
            <p className="muted">No {filter} posts.</p>
          ) : (
            <div className="stack">
              {filtered.map((post) => (
                <div key={post.id} className="dash-post-row">
                  <div className="dash-post-main">
                    <Link to={`/post/${post.id}`} className="dash-post-title">
                      {post.title}
                    </Link>
                    <div className="dash-post-meta">
                      <span className={`dash-status ${post.status}`}>
                        {post.status === "published" ? "Published" : "Draft"}
                      </span>
                      {post.createdAt && (
                        <>
                          <span className="dash-meta-sep">•</span>
                          <span>
                            {new Date(post.createdAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="dash-post-actions">
                    <Link to={`/post/${post.id}`} className="btn btn-ghost btn-sm">
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}