import { ApiError } from "./auth.js";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/anyblog";

async function request(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Network error. Is the backend running?", 0);
  }

  let data = null;
  try { data = await res.json(); } catch { /* ignore */ }

  if (!res.ok) {
    throw new ApiError(data?.message || `Request failed (${res.status})`, res.status);
  }
  return data;
}

export const postApi = {
  // Get all published posts (public feed)
  getFeed: () => request("/posts"),

  // Get a single post by ID
  getPost: (id) => request(`/posts/${id}`),

  // Create a new post (requires auth)
  createPost: (payload, token) =>
    request("/posts", { method: "POST", body: payload, token }),

  // Get comments for a post
  getComments: (postId) => request(`/posts/${postId}/comments`),

  // Add a comment to a post (requires auth)
    // Add a comment to a post (requires auth)
  addComment: (postId, content, parentId, token) =>
    request(`/posts/${postId}/comments`, { 
      method: "POST", 
      body: { content, parentId }, // 👈 Now sends parentId
      token 
    }),
};