import { ApiError } from "./auth.js";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/anyblog";

export const profileApi = {
  updateProfile: async (payload, token) => {
    const res = await fetch(`${BASE_URL}/profile`, {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` 
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new ApiError(data?.message || "Failed to update profile", res.status);
    return data;
  }
};