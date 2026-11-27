const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/anyblog";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

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

export const api = {
  signup: (payload) =>
    request("/signup", { method: "POST", body: payload }),

  signin: (payload) =>
    request("/signin", { method: "POST", body: payload }),

  verifySigninOtp: (payload) =>
    request("/signin/verify", { method: "POST", body: payload }),

  logout: (token) =>
    request("/logout", { method: "POST", token }),

  requestPasswordReset: (email) =>
    request("/forgot-password", { method: "POST", body: { email } }),

  resetPassword: (payload) =>
    request("/forgot-password", { method: "POST", body: payload }),

  verifyEmail: (token) =>
    request("/verify-email", { method: "POST", body: { token } }),

  me: (token) =>
    request("/me", { method: "GET", token }),
};