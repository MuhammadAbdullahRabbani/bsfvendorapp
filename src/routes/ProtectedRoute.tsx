// src/routes/ProtectedRoute.tsx
import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuthStore();
  if (loading) return <div className="p-6">Loading…</div>;
  if (!user) return <Navigate to="/signin" replace />;
  return children;
}
