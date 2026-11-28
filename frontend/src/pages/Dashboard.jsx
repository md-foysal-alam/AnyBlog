import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Dashboard() {
  const { account, stats, myPosts, signOut } = useAuth();

  const logout = async () => {
    await signOut();
    window.location.href = "/signin";
  };

  if (!account) return null;

  return (
    <>
      <header className="topbar">
        <Link to="/" className="brand">anyBlog</Link>
        <div className="topbar-right">
          <span className="muted">{account.displayName || account.username}</span>
          <button className="btn btn-ghost" onClick={logout}>Sign out</button>
        </div>
      </header>

      <main className="container">
        <div className="card wide split">
          
          <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
            {/* Avatar */}
            <img 
              src={account.avatarUrl || `https://ui-avatars.com/api/?name=${account.username}&background=random`} 
              alt="avatar" 
              style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--border)" }}
            />
            
            <div>
              {/* Name */}
              <h2 style={{ margin: 0, fontSize: 30 }}>
                Welcome, {account.displayName || account.username} 👋
              </h2>
              
              {/* Email & Badge */}
              <p className="muted" style={{ margin: "6px 0 0" }}>
                {account.email}{" "}
                {account.emailVerified
                  ? <span className="badge badge-ok">verified</span>
                  : <span className="badge badge-warn">unverified</span>}
              </p>

              {/* Bio */}
              {account.bio && (
                <p style={{ margin: "12px 0 0", fontSize: 15, color: "var(--text)", fontStyle: "italic", lineHeight: 1.5 }}>
                  "{account.bio}"
                </p>
              )}

              {/* 👇 NEW: Social Link Items */}
              <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
                {account.websiteUrl && (
                  <a href={account.websiteUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ padding: "6px 12px", fontSize: 13, borderRadius: 20 }}>
                    🌐 Website
                  </a>
                )}
                {account.twitterUrl && (
                  <a href={account.twitterUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ padding: "6px 12px", fontSize: 13, borderRadius: 20 }}>
                    🐦 Twitter / X
                  </a>
                )}
                {account.githubUrl && (
                  <a href={account.githubUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ padding: "6px 12px", fontSize: 13, borderRadius: 20 }}>
                    💻 GitHub
                  </a>
                )}
                {account.linkedinUrl && (
                  <a href={account.linkedinUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ padding: "6px 12px", fontSize: 13, borderRadius: 20 }}>
                    💼 LinkedIn
                  </a>
                )}
              </div>

            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 12 }}>
            <Link to="/write" className="btn btn-primary">Write a Post ✍️</Link>
            <Link to="/profile" className="btn btn-ghost">Edit Profile</Link>
          </div>
        </div>

        <div className="card wide">
          <h3>Your stats</h3>
          <div className="stats-grid">
            <div className="stat"><div className="stat-num">{stats.totalPosts}</div><div className="stat-label">Total posts</div></div>
            <div className="stat"><div className="stat-num">{stats.publishedPosts}</div><div className="stat-label">Published</div></div>
            <div className="stat"><div className="stat-num">{stats.draftPosts}</div><div className="stat-label">Drafts</div></div>
          </div>
        </div>

        <div className="card wide">
          <h3>Your Posts</h3>
          {myPosts.length === 0 ? (
            <p className="muted">You haven't written anything yet.</p>
          ) : (
            <div className="stack">
              {myPosts.map((post) => (
                <div key={post.id} className="post-row">
                  <div>
                    <Link to={`/post/${post.id}`} className="post-row-title">{post.title}</Link>
                    <div className="post-row-meta">
                      Status: {post.status === "published" ? "🟢 Published" : "🟡 Draft"}
                    </div>
                  </div>
                  <Link to={`/post/${post.id}`} className="btn btn-ghost btn-sm">View</Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}