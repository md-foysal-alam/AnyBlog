import { useEffect, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { postApi } from "../api/posts.js";
import { useAuth } from "../context/AuthContext.jsx";

const avatarUrl = (user) =>
  user?.avatarUrl ||
  `https://ui-avatars.com/api/?name=${encodeURIComponent(
    user?.username || "user"
  )}&background=af6a51&color=fff`;

const formatDate = (iso) => {
  const d = new Date(iso);
  return isNaN(d) ? "" : d.toLocaleDateString(undefined, {
    month: "long", day: "numeric", year: "numeric",
  });
};

const formatShortDate = (iso) => {
  const d = new Date(iso);
  return isNaN(d) ? "" : d.toLocaleDateString(undefined, {
    month: "short", day: "numeric", year: "numeric",
  });
};

/* ---------------- React (heart) button ---------------- */
function ReactButton({ post, account, token, onNeedAuth }) {
  const [liked, setLiked] = useState(Boolean(post.likedByMe));
  const [count, setCount] = useState(Number(post.likeCount ?? 0));
  const [busy,  setBusy]  = useState(false);

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
      className={`post-react-btn ${liked ? "liked" : ""}`}
      onClick={click}
      disabled={busy}
      aria-pressed={liked}
    >
      <span className="post-react-icon">{liked ? "❤️" : "🤍"}</span>
      <span className="post-react-count">{count}</span>
    </button>
  );
}

/* ---------------- Comment node ---------------- */
function CommentItem({
  comment, replyingTo, setReplyingTo, submitReply, isSubmitting,
  isNew, registerRef,
}) {
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
    <div
      className={`comment ${isNew ? "comment-new" : ""} ${comment._optimistic ? "comment-pending" : ""}`}
      ref={isNew ? registerRef : null}
    >
      <div className="comment-box">
        <div className="comment-meta">
          <img src={avatarUrl(comment.author)} alt="avatar" className="comment-avatar" />
          <span className="comment-author">
            {comment.author?.displayName || comment.author?.username || "…"}
          </span>
          <span className="comment-date">• {formatShortDate(comment.createdAt)}</span>
          {comment._optimistic && <span className="comment-pending-tag">sending…</span>}
        </div>
        <div className="comment-body">{comment.content}</div>

        <button
          onClick={() => setReplyingTo(isReplying ? null : comment.id)}
          className="reply-btn"
          disabled={comment._optimistic}
        >
          {isReplying ? "Cancel" : "Reply"}
        </button>
      </div>

      {isReplying && (
        <form onSubmit={handleReplySubmit} className="reply-form">
          <input
            autoFocus
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a reply…"
          />
          <button type="submit" className="btn btn-primary btn-sm" disabled={isSubmitting}>
            Send
          </button>
        </form>
      )}

      {comment.replies?.length > 0 && (
        <div className="reply-list">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              submitReply={submitReply}
              isSubmitting={isSubmitting}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Page ---------------- */
export default function PostDetail() {
  const { id } = useParams();
  const { account, token } = useAuth();
  const nav = useNavigate();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newCommentId, setNewCommentId] = useState(null);

  const newCommentRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([postApi.getPost(id, token), postApi.getComments(id)])
      .then(([postRes, commentsRes]) => {
        if (cancelled) return;
        setPost(postRes.data);
        setComments(commentsRes.data || []);
      })
      .catch((err) => { if (!cancelled) console.error(err); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, token]);

  useEffect(() => {
    if (newCommentId && newCommentRef.current) {
      newCommentRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [newCommentId]);

  useEffect(() => {
    if (!newCommentId) return;
    const t = setTimeout(() => setNewCommentId(null), 3000);
    return () => clearTimeout(t);
  }, [newCommentId]);

  const countAll = (nodes = []) =>
    nodes.reduce((sum, n) => sum + 1 + countAll(n.replies), 0);

  const needAuth = () => nav("/signin", { state: { from: `/post/${id}` } });

  const handleAddComment = async (e) => {
    e.preventDefault();
    const text = newComment.trim();
    if (!text || !token) return;

    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      id: tempId,
      content: text,
      createdAt: new Date().toISOString(),
      author: {
        id: account.id,
        username: account.username,
        displayName: account.displayName,
        avatarUrl: account.avatarUrl,
      },
      replies: [],
      _optimistic: true,
    };

    setComments((prev) => [...prev, optimistic]);
    setNewComment("");
    setSubmitting(true);

    try {
      const res = await postApi.addComment(id, text, null, token);
      setComments((prev) => prev.map((c) => (c.id === tempId ? res.data : c)));
      setNewCommentId(res.data.id);
    } catch (err) {
      setComments((prev) => prev.filter((c) => c.id !== tempId));
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const submitReply = async (content, parentId, onSuccess) => {
    setSubmitting(true);
    try {
      const res = await postApi.addComment(id, content, parentId, token);
      const addReplyToTree = (nodes) =>
        nodes.map((node) => {
          if (node.id === parentId)
            return { ...node, replies: [...(node.replies || []), res.data] };
          if (node.replies?.length)
            return { ...node, replies: addReplyToTree(node.replies) };
          return node;
        });
      setComments((prev) => addReplyToTree(prev));
      onSuccess();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="center">Loading…</div>;
  if (!post)
    return (
      <div className="center">
        Post not found. <Link to="/">Go back</Link>
      </div>
    );

  return (
    <>
      <header className="topbar">
        <Link to="/" className="brand">anyBlog</Link>
        <Link to="/" className="btn btn-ghost btn-sm">← Back to Feed</Link>
      </header>

      <main className="container reader">
        <article className="post-card">
          {post.media?.[0]?.url && (
            <img src={post.media[0].url} alt={post.title} className="post-cover" />
          )}
          <div className="post-body">
            <h1 className="post-hero-title">{post.title}</h1>
            <div className="post-header-meta">
              <img
                src={avatarUrl(post.author)}
                alt={post.author?.username || "author"}
                className="post-header-avatar"
              />
              <span className="author">
                {post.author?.displayName || post.author?.username || "Anonymous"}
              </span>
              <span className="post-meta-sep">•</span>
              <span className="post-meta-date">{formatDate(post.createdAt)}</span>
            </div>
            <div className="prose">{post.content}</div>
          </div>
        </article>

        {/* ---------- REACTION BAR ---------- */}
        <div className="post-reactions-bar">
          <ReactButton
            post={post}
            account={account}
            token={token}
            onNeedAuth={needAuth}
          />
          <span className="post-reactions-hint">
            {post.likedByMe ? "You loved this" : "Love this post"}
          </span>
        </div>

        {account ? (
          <div className="card wide comment-form-card">
            <h4>Leave a comment</h4>
            <form onSubmit={handleAddComment} className="stack">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts…"
                rows={4}
                required
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
                style={{ alignSelf: "flex-start" }}
              >
                {submitting ? "Posting…" : "Post Comment"}
              </button>
            </form>
          </div>
        ) : (
          <div className="signin-prompt">
            <p>
              <Link to="/signin" state={{ from: `/post/${id}` }}>Sign in</Link> to join
              the discussion — or{" "}
              <Link to="/signup" state={{ from: `/post/${id}` }}>create an account</Link>.
            </p>
          </div>
        )}

        <section className="discussion">
          <div className="discussion-head">
            <h3>Discussion</h3>
            <span className="discussion-count">{countAll(comments)}</span>
          </div>

          {comments.length === 0 ? (
            <p className="muted">No comments yet. Start the conversation!</p>
          ) : (
            <div className="stack" style={{ gap: 18 }}>
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  replyingTo={replyingTo}
                  setReplyingTo={setReplyingTo}
                  submitReply={submitReply}
                  isSubmitting={submitting}
                  isNew={comment.id === newCommentId}
                  registerRef={newCommentRef}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}