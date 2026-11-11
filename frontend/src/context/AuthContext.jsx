// ================================================================
// FILE: frontend/src/context/AuthContext.jsx
// TUGAS: Menyimpan & menyebarkan state autentikasi ke seluruh app
//
// KONSEP REACT CONTEXT:
//   Tanpa Context: harus kirim props user dari App → Router → Page → Component
//   Dengan Context: komponen manapun bisa langsung ambil data user
//
// CARA PAKAI di komponen lain:
//   import { useAuth } from '../context/AuthContext'
//   const { user, login, logout } = useAuth()
// ================================================================

import { createContext, useContext, useState, useCallback } from "react";
import { clearPreview } from "../preview";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Cek apakah sudah ada data user yang tersimpan di localStorage
  // (supaya halaman tidak kembali ke login saat di-refresh)
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  /**
   * Dipanggil setelah login berhasil.
   * Simpan token di localStorage + set state user.
   */
  const login = useCallback((userData, token) => {
    localStorage.setItem("access_token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  }, []);

  /**
   * Dipanggil saat tombol Logout diklik.
   * Hapus semua data auth dari localStorage + reset state.
   */
  const logout = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    clearPreview();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Custom hook untuk mengakses auth state dari komponen manapun */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus digunakan di dalam <AuthProvider>");
  return ctx;
}
