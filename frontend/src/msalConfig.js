// ================================================================
// FILE: frontend/src/msalConfig.js
// TUGAS: Konfigurasi MSAL — Microsoft Authentication Library
//
// ── SETUP (one-time, by your Azure / Entra ID admin) ─────────────
// 1. https://portal.azure.com → Microsoft Entra ID
//    → App registrations → New registration
//    - Supported account types : single tenant (your organization only)
//    - Redirect URI            : Single-page application → http://localhost:5173
// 2. Copy the Application (client) ID and Directory (tenant) ID into
//    frontend/.env as VITE_MSAL_CLIENT_ID / VITE_MSAL_TENANT_ID.
// 3. Authentication → enable Access tokens and ID tokens; add your
//    production redirect URI when you deploy.
// 4. API permissions → Microsoft Graph → User.Read → Grant admin consent.
//
// ── EMPLOYEE EMAIL FORMAT ───────────────────────────────────────
// Microsoft accounts must follow {NIK}@{VITE_EMAIL_DOMAIN},
// e.g. 100123@example.com. The NIK is matched against users.nik.
// See frontend/.env.example for all variables.
// ================================================================

const CLIENT_ID   = import.meta.env.VITE_MSAL_CLIENT_ID  || "YOUR_CLIENT_ID";
const TENANT_ID   = import.meta.env.VITE_MSAL_TENANT_ID  || "YOUR_TENANT_ID";
export const EMAIL_DOMAIN = import.meta.env.VITE_EMAIL_DOMAIN || "example.com";

// ── Validasi config saat startup ─────────────────────────────────
if (CLIENT_ID === "YOUR_CLIENT_ID" || TENANT_ID === "YOUR_TENANT_ID") {
  console.warn(
    "[MSAL] ⚠ CLIENT_ID / TENANT_ID belum dikonfigurasi.\n" +
    "Buat file frontend/.env dan isi VITE_MSAL_CLIENT_ID dan VITE_MSAL_TENANT_ID.\n" +
    "Login with Microsoft tidak akan berfungsi sampai ini diisi."
  );
}

// ── MSAL instance config ──────────────────────────────────────────
export const msalConfig = {
  auth: {
    clientId:               CLIENT_ID,
    // authority = tenant-specific endpoint — only accounts in your tenant can sign in
    authority:              `https://login.microsoftonline.com/${TENANT_ID}`,
    redirectUri:            window.location.origin,
    // navigateToLoginRequestUrl: false agar popup tidak redirect ke halaman lain
    navigateToLoginRequestUrl: false,
  },
  cache: {
    // sessionStorage: token hilang saat tab ditutup (lebih aman dari localStorage)
    cacheLocation:          "sessionStorage",
    storeAuthStateInCookie: false,
  },
  system: {
    // Matikan log MSAL di production
    loggerOptions: {
      logLevel: import.meta.env.DEV ? 2 : 0,  // 2=Warning, 0=Error only
      piiLoggingEnabled: false,
    },
  },
};

// ── Scopes yang diminta dari Microsoft ────────────────────────────
// openid + profile + email: data dasar user
// User.Read: izin baca profil dari Microsoft Graph
export const loginRequest = {
  scopes: ["openid", "profile", "email", "User.Read"],
  // prompt: "select_account" → paksa user pilih akun jika ada multi-account
  prompt: "select_account",
};

// ── Helper: ekstrak NIK dari email ───────────────────────────────
// "100123@example.com" → "100123"
// Fungsi ini dipakai di LoginPage.jsx SEBELUM kirim ke backend
export function extractNikFromEmail(email) {
  if (!email || !email.includes("@")) return null;
  const [prefix, domain] = email.toLowerCase().split("@");

  // Validasi domain harus cocok dengan konfigurasi
  if (domain !== EMAIL_DOMAIN.toLowerCase()) {
    return null;  // email bukan dari domain korporat
  }

  // Prefix harus berupa angka (format NIK)
  if (!/^\d+$/.test(prefix)) {
    return null;  // prefix bukan angka — bukan format NIK
  }

  return prefix;
}