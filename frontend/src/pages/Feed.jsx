import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { postApi } from "../api/posts.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Feed() {
  const { account } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    postApi.getFeed()
      .then((res) => setPosts(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <header className="topbar">
        <Link to="/" className="brand">anyBlog</Link>
        <div className="topbar-right">
          {account ? (
            <Link to="/dashboard" className="btn btn-ghost">Dashboard</Link>
          ) : (
            <Link to="/signin" className="btn btn-primary">Sign In</Link>
          )}
        </div>
      </header>

      <main className="container">
        <div className="page-head" style={{ marginBottom: 8 }}>
          <h1>Latest Stories</h1>
          {account && (
            <Link to="/write" className="btn btn-primary">Write a Post</Link>
          )}
        </div>

        {loading && <p className="muted">Loading feed...</p>}
        {!loading && posts.length === 0 && <p className="muted">No posts yet. Be the first to write one!</p>}

        <div style={{ display: "grid", gap: 32 }}>
          {posts.map((post) => (
            <div key={post.id} className="card wide blog-card" style={{ padding: 0 }}>
              {post.media && post.media.length > 0 && (
                <Link to={`/post/${post.id}`}>
                  <img src={post.media[0].url} alt={post.title} className="blog-image" />
                </Link>
              )}
              <div className="blog-content">
                <h2 className="blog-title">
                  <Link to={`/post/${post.id}`}>{post.title}</Link>
                </h2>
                <div className="blog-meta">
                  <span>By {post.author?.username || "Unknown"}</span>
                  <span>•</span>
                  <span>{new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <p className="blog-excerpt">
                  {post.content.substring(0, 160)}...
                </p>
                <div>
                  <Link to={`/post/${post.id}`} className="read-more">
                    Read Full Story →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}