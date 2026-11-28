import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import Signup from "./pages/Signup.jsx";
import Signin from "./pages/Signin.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import VerifyEmail from "./pages/VerifyEmail.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Feed from "./pages/Feed.jsx";
import WritePost from "./pages/WritePost.jsx";
import PostDetail from "./pages/PostDetail.jsx";
import Profile from "./pages/Profile.jsx";


function Splash() { return <div className="center">Loading…</div>; }

function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();
  if (loading) return <Splash />;
  if (!token) return <Navigate to="/signin" replace />;
  return children;
}

function GuestRoute({ children }) {
  const { token, loading } = useAuth();
  if (loading) return <Splash />;
  if (token) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Make the Feed the homepage */}
      <Route path="/" element={<Feed />} />
      <Route path="/post/:id" element={<PostDetail />} />
      
      <Route path="/signup" element={<GuestRoute><Signup /></GuestRoute>} />
      <Route path="/signin" element={<GuestRoute><Signin /></GuestRoute>} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      
      <Route path="/write" element={<ProtectedRoute><WritePost /></ProtectedRoute>} />
      
      <Route path="*" element={<div className="center">Page not found. <a href="/">Go home</a></div>} />
    </Routes>
  );
}