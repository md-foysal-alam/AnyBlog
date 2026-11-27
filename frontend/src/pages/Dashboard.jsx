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
          <div>
            <h2 style={{ margin: 0, fontSize: 30 }}>
              Welcome, {account.displayName || account.username} 👋
            </h2>
            <p className="muted" style={{ margin: "6px 0 0" }}>
              {account.email}{" "}
              {account.emailVerified
                ? <span className="badge badge-ok">verified</span>
                : <span className="badge badge-warn">unverified</span>}
            </p>
          </div>
          <Link to="/write" className="btn btn-primary">Write a Post ✍️</Link>
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