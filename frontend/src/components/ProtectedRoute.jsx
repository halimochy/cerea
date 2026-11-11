// ================================================================
// FILE: frontend/src/components/ProtectedRoute.jsx
// TUGAS: Guard untuk route — redirect jika belum login atau role salah
// ================================================================

import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Contoh pakai:
 *   <ProtectedRoute>                    ← cukup login
 *     <UserPortal />
 *   </ProtectedRoute>
 *
 *   <ProtectedRoute roles={["Admin"]}>  ← harus role Admin
 *     <AdminDashboard />
 *   </ProtectedRoute>
 */
export default function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();

  // Belum login → ke halaman login
  if (!user) return <Navigate to="/login" replace />;

  // Role tidak sesuai → redirect ke halaman yang benar
  if (roles) {
    const allowed = Array.isArray(roles) ? roles : [roles];
    if (!allowed.includes(user.role)) {
      return <Navigate to={user.role === "Admin" ? "/admin-dashboard" : "/user-portal"} replace />;
    }
  }

  return children;
}
