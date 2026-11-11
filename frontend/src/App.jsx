// ================================================================
// FILE: frontend/src/App.jsx
// TUGAS: Definisi routing + auto-redirect berdasarkan role
//
// ROUTING MAP:
//   /login            → halaman login (publik)
//   /privacy          → kebijakan privasi (publik)
//   /admin-dashboard  → Admin only (role="Admin")
//   /user-portal      → semua user yang sudah login
//   / atau lainnya    → redirect otomatis berdasarkan role
// ================================================================

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute     from "./components/ProtectedRoute";
import LoginPage          from "./pages/LoginPage";
import AdminDashboard     from "./pages/AdminDashboard";
import UserPortal         from "./pages/UserPortal";
import ECanteenSystem     from "./pages/Ecanteensystem";
import WhatsGoingOnPage   from "./pages/Whatsgoingonpage";
import PrivacyPolicy      from "./pages/PrivacyPolicy";

/** Redirect root "/" berdasarkan status login & role */
function RootRedirect() {
  const { user } = useAuth();
  if (!user)                  return <Navigate to="/login"           replace />;
  if (user.role === "Admin")  return <Navigate to="/admin-dashboard" replace />;
  return                             <Navigate to="/user-portal"     replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Halaman publik — tidak perlu login */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />

      {/* Hanya Admin */}
      <Route
        path="/admin-dashboard"
        element={
          <ProtectedRoute roles={["Admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Semua user yang sudah login */}
      <Route
        path="/user-portal"
        element={
          <ProtectedRoute>
            <UserPortal />
          </ProtectedRoute>
        }
      />

      {/* eCanteen System — internal app page */}
      <Route
        path="/ecanteen"
        element={
          <ProtectedRoute>
            <ECanteenSystem />
          </ProtectedRoute>
        }
      />

      {/* What's Going On — dedicated announcements page */}
      <Route
        path="/whats-going-on"
        element={
          <ProtectedRoute>
            <WhatsGoingOnPage />
          </ProtectedRoute>
        }
      />

      {/* Redirect otomatis untuk / dan semua route tidak dikenal */}
      <Route path="/"  element={<RootRedirect />} />
      <Route path="*"  element={<RootRedirect />} />
    </Routes>
  );
}