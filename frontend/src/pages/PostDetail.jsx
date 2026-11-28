import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { postApi } from "../api/posts.js";
import { useAuth } from "../context/AuthContext.jsx";

function CommentItem({ comment, replyingTo, setReplyingTo, submitReply, isSubmitting }) {
  const [replyText, setReplyText] = useState("");
  const isReplying = replyingTo === comment.id;

  const handleReplySubmit = (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    submitReply(replyText, comment.id, () => {
      setReplyText("");
      setReplyingTo(null);
    });
  };

  return (
    <div className="comment">
      <div className="comment-box">
        {/* 👇 Added Avatar to Comment Meta */}
        <div className="comment-meta" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img 
            src={comment.author?.avatarUrl || `https://ui-avatars.com/api/?name=${comment.author?.username}&background=random`} 
            alt="avatar" 
            style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover" }} 
          />
          <span className="comment-author">{comment.author?.displayName || comment.author?.username}</span>
          <span className="comment-date">• {new Date(comment.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="comment-body">{comment.content}</div>

        <button
          onClick={() => setReplyingTo(isReplying ? null : comment.id)}
          className="reply-btn"
        >
          {isReplying ? "Cancel Reply" : "Reply"}
        </button>
      </div>

      {isReplying && (
        <form onSubmit={handleReplySubmit} className="reply-form">
          <input autoFocus value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Write a reply..." />
          <button type="submit" className="btn btn-primary btn-sm" disabled={isSubmitting}>Send</button>
        </form>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className="reply-list">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} replyingTo={replyingTo} setReplyingTo={setReplyingTo} submitReply={submitReply} isSubmitting={isSubmitting} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function PostDetail() {
  const { id } = useParams();
  const { account, token } = useAuth();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([postApi.getPost(id), postApi.getComments(id)])
      .then(([postRes, commentsRes]) => {
        setPost(postRes.data);
        setComments(commentsRes.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const res = await postApi.addComment(id, newComment, null, token);
      setComments((prev) => [...prev, res.data]);
      setNewComment("");
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const submitReply = async (content, parentId, onSuccess) => {
    setSubmitting(true);
    try {
      const res = await postApi.addComment(id, content, parentId, token);
      const addReplyToTree = (nodes) => nodes.map(node => {
        if (node.id === parentId) return { ...node, replies: [...(node.replies || []), res.data] };
        if (node.replies?.length) return { ...node, replies: addReplyToTree(node.replies) };
        return node;
      });
      setComments(prev => addReplyToTree(prev));
      onSuccess();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="center">Loading...</div>;
  if (!post) return <div className="center">Post not found. <Link to="/">Go back</Link></div>;

  return (
    <>
      <header className="topbar">
        <Link to="/" className="brand">anyBlog</Link>
        <Link to="/" className="btn btn-ghost">← Back to Feed</Link>
      </header>

      <main className="container" style={{ maxWidth: 800 }}>
        <div className="card wide" style={{ padding: 0 }}>
          {post.media && post.media.length > 0 && (
            <img
              src={post.media[0].url}
              alt={post.title}
              style={{ width: "100%", maxHeight: 460, objectFit: "cover", display: "block", borderTopLeftRadius: "var(--radius)", borderTopRightRadius: "var(--radius)" }}
            />
          )}
          <div style={{ padding: "48px 40px 44px" }}>
            <h1 className="post-hero-title">{post.title}</h1>
            
            {/* 👇 Added Avatar to Post Header Meta */}
            <div className="post-header-meta" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
              <img 
                src={post.author?.avatarUrl || `https://ui-avatars.com/api/?name=${post.author?.username}&background=random`} 
                alt="author" 
                style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} 
              />
              <span className="author" style={{ fontWeight: 600 }}>{post.author?.displayName || post.author?.username}</span>
              <span>•</span>
              <span className="muted">{new Date(post.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>

            <div className="prose">{post.content}</div>
          </div>
        </div>

        {account ? (
          <div className="card wide">
            <h4 style={{ margin: "0 0 8px" }}>Leave a comment</h4>
            <form onSubmit={handleAddComment} className="stack">
              <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Share your thoughts..." rows={4} required />
              <button type="submit" className="btn btn-primary" disabled={submitting} style={{ alignSelf: "flex-start" }}>
                {submitting ? "Posting..." : "Post Comment"}
              </button>
            </form>
          </div>
        ) : (
          <div className="card wide center-text" style={{ padding: 26 }}>
            <p className="muted" style={{ margin: 0 }}>
              <Link to="/signin" style={{ fontWeight: 600 }}>Sign in</Link> to join the discussion.
            </p>
          </div>
        )}

        <div style={{ marginTop: 8 }}>
          <h3>Discussion ({comments.length})</h3>

          {comments.length === 0 && <p className="muted">No comments yet. Start the conversation!</p>}

          <div className="stack" style={{ marginTop: 24, marginBottom: 32 }}>
            {comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} replyingTo={replyingTo} setReplyingTo={setReplyingTo} submitReply={submitReply} isSubmitting={submitting} />
            ))}
          </div>
        </div>
      </main>
    </>
  );
}