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
        <strong>anyBlog</strong>
        <div className="topbar-right">
          {account ? (
            <Link to="/dashboard" className="btn btn-ghost">Dashboard</Link>
          ) : (
            <Link to="/signin" className="btn btn-primary">Sign In</Link>
          )}
        </div>
      </header>

      <main className="container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h1 style={{ margin: 0 }}>Latest Stories</h1>
          {account && (
            <Link to="/write" className="btn btn-primary">Write a Post</Link>
          )}
        </div>

        {loading && <p className="muted">Loading feed...</p>}
        {!loading && posts.length === 0 && <p className="muted">No posts yet. Be the first to write one!</p>}

        <div style={{ display: "grid", gap: 32 }}>
          {posts.map((post) => (
            <div key={post.id} className="card blog-card" style={{ maxWidth: "100%", padding: 0, overflow: "hidden" }}>
              
              {/* Show Cover Image if it exists */}
              {post.media && post.media.length > 0 && (
                <Link to={`/post/${post.id}`}>
                  <img 
                    src={post.media[0].url} 
                    alt={post.title} 
                    className="blog-image"
                  />
                </Link>
              )}

              <div className="blog-content">
                <h2 className="blog-title">
                  <Link to={`/post/${post.id}`} style={{ color: "var(--text)" }}>
                    {post.title}
                  </Link>
                </h2>
                
                {/* 👇 THE UPDATED AUTHOR META SNIPPET */}
                <div className="blog-meta" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <img 
                    src={post.author?.avatarUrl || `https://ui-avatars.com/api/?name=${post.author?.username}&background=random`} 
                    alt="author" 
                    style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover" }} 
                  />
                  <span>By {post.author?.displayName || post.author?.username}</span>
                  <span>•</span>
                  <span>{new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>

                <p className="blog-excerpt">
                  {post.content.substring(0, 160)}...
                </p>
                
                <div>
                  <Link to={`/post/${post.id}`} style={{ fontWeight: 600, fontSize: 15 }}>
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