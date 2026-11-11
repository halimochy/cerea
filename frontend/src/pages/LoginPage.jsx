// src/pages/LoginPage.jsx — Cerea redesign

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { COMPANY, COPYRIGHT_TEXT } from "../config/company";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../api";
import Icon from "../components/Icon";
import cereaLogoWhite    from "../assets/cerea-logo-white.png";
import cereaMark         from "../assets/cerea-mark.png";

/* ─── Forgot Password Modal ──────────────────────────────────────
   No self-service reset: an unauthenticated "reset by username" would
   let anyone take over any account. Passwords are reset by an admin
   in User Management (Admin Dashboard → Users → Edit → new password). */
function ForgotPasswordModal({ onClose }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(0,0,0,0.6)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background:"white", borderRadius:16, padding:"28px 28px 24px", width:"100%", maxWidth:380, boxShadow:"0 24px 60px rgba(0,0,0,0.25)", animation:"slideUp .25s ease" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
          <div>
            <h3 style={{ fontSize:"0.80rem", fontWeight:700, color:"#1a1a1a", margin:0, fontFamily:"Montserrat,sans-serif" }}>Forgot Password</h3>
            <p style={{ fontSize:"0.70rem", color:"#9ca3af", marginTop:3 }}>Password resets are handled by an administrator</p>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ width:30, height:30, borderRadius:"50%", border:"none", background:"#f3f4f6", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#9ca3af" }}>
            <Icon name="x" size={14} />
          </button>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ display:"flex", gap:12, alignItems:"flex-start", background:"#E8F2FF", border:"1px solid #C9DDFB", borderRadius:10, padding:"12px 14px" }}>
            <Icon name="shield" size={18} style={{ color:"#2563EB", flexShrink:0, marginTop:1 }} />
            <p style={{ fontSize:"0.76rem", color:"#0B1F3A", lineHeight:1.55, margin:0 }}>
              For your account's security, passwords can't be reset from this page.
              Please contact your <strong>{COMPANY.department}</strong> or a Cerea administrator
              with your username. They will set a new password for you.
            </p>
          </div>
          <ol style={{ fontSize:"0.74rem", color:"#4b5563", lineHeight:1.6, margin:0, paddingLeft:18, listStyle:"decimal" }}>
            <li>Send your username to an administrator.</li>
            <li>The administrator sets a temporary password in User Management.</li>
            <li>Sign in and ask the administrator to change it to one only you know.</li>
          </ol>
          <button onClick={onClose} style={LS.btnPrimary}>Back to Login</button>
        </div>
        <style>{`@keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
      </div>
    </div>
  );
}

/* ─── Shared input styles ────────────────────────────────────── */
const LS = {
  inputWrap: {
    display:"flex", alignItems:"center", gap:10,
    background:"#f9fafb", border:"1.5px solid #e5e7eb",
    borderRadius:8, padding:"10px 14px", transition:"all 0.2s",
  },
  input: {
    border:"none", outline:"none", background:"none",
    width:"100%", fontFamily:"Montserrat,sans-serif", fontSize:"0.85rem",
    color:"#1a1a1a",
  },
  label: {
    display:"block", fontSize:"0.68rem", fontWeight:600,
    color:"#9ca3af", marginBottom:6,
    textTransform:"uppercase", letterSpacing:"0.08em",
    fontFamily:"Montserrat,sans-serif",
  },
  btnPrimary: {
    width:"100%", padding:"12px 0", borderRadius:8,
    background:"linear-gradient(135deg,#12365F,#0E9AA7)",
    color:"white", border:"none", cursor:"pointer",
    fontWeight:700, fontSize:"0.88rem",
    fontFamily:"Montserrat,sans-serif", letterSpacing:"0.03em",
    boxShadow:"0 4px 14px rgba(18,54,95,0.30)",
    transition:"all 0.2s",
  },
};

/* ════════════════════════════════════════════════════════════ */
export default function LoginPage() {
  const navigate           = useNavigate();
  const { login }          = useAuth();

  const [nik,          setNik]          = useState("");
  const [password,     setPassword]     = useState("");
  const [showPass,     setShowPass]     = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [showForgotPw, setShowForgotPw] = useState(false);
  const [guestEnabled, setGuestEnabled] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);

  // Show "Login as Guest" only when the server has it enabled (GUEST_LOGIN_ENABLED)
  useEffect(() => {
    let alive = true;
    authApi.options()
      .then(r => { if (alive) setGuestEnabled(!!r.data?.guest_login); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const redirectByRole = (role) =>
    navigate(role === "Admin" ? "/admin" : "/portal", { replace: true });

  /* ── Guest Login (read-only, no NIK/password) ── */
  const handleGuestLogin = async () => {
    setError(""); setGuestLoading(true);
    try {
      const res = await authApi.guestLogin();
      login(res.data.user, res.data.access_token);
      redirectByRole(res.data.user.role);
    } catch (err) {
      setError(err.response?.data?.detail || "Guest access is not available right now.");
    } finally { setGuestLoading(false); }
  };

  /* ── Manual Login ── */
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (!nik.trim() || !password.trim()) { setError("Username and password are required."); return; }
    setLoading(true);
    try {
      const res = await authApi.login(nik.trim(), password);
      login(res.data.user, res.data.access_token);
      redirectByRole(res.data.user.role);
    } catch (err) {
      setError(err.response?.data?.detail || "Incorrect username or password. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:"100vh", width:"100%", display:"flex", fontFamily:"Montserrat,sans-serif",
      background:"linear-gradient(150deg,#0A2342 0%,#12365F 45%,#1A4B80 100%)" }}>

      {/* Google Font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing:border-box; }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* ─── LEFT SIDE ─── */}
      <div style={{
        flex:1, display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
        padding:"0 48px", position:"relative", overflow:"hidden",
      }}>
        {/* Subtle bg orbs */}
        <div style={{ position:"absolute", width:500, height:500, borderRadius:"50%", background:"rgba(0,0,0,0.15)", top:-200, left:-200, filter:"blur(60px)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", width:400, height:400, borderRadius:"50%", background:"rgba(255,255,255,0.04)", bottom:-100, right:0, filter:"blur(40px)", pointerEvents:"none" }} />

        {/* Cerea logo — centered */}
        <div style={{
          position:"relative", zIndex:2,
          display:"flex", alignItems:"center", justifyContent:"center",
          marginTop:"auto", marginBottom:"auto",
          animation:"fadeIn 0.7s ease",
        }}>
          <img
            src={cereaLogoWhite}
            alt="Cerea"
            style={{ width:"100%", maxWidth:440, height:"auto", objectFit:"contain" }}
          />
        </div>
      </div>

      {/* ─── RIGHT SIDE — Login Card ─── */}
      <div style={{
        width:"42%", minWidth:440, display:"flex",
        alignItems:"center", justifyContent:"center",
        padding:"40px 48px",
      }}>
        <div style={{
          background:"white", borderRadius:20,
          padding:"40px 36px 32px",
          width:"100%", maxWidth:420,
          boxShadow:"0 32px 80px rgba(0,0,0,0.30)",
          animation:"fadeIn 0.55s 0.1s ease both",
        }}>
          {/* Logo + Brand — Cerea mark, centered, above Welcome */}
          <div style={{ textAlign:"center", marginBottom:28 }}>
            <div style={{ display:"flex", justifyContent:"center", marginBottom:18 }}>
              <img
                src={cereaMark}
                alt="Cerea"
                style={{ height:64, width:"auto", objectFit:"contain" }}
              />
            </div>
            <h2 style={{ fontSize:"1.3rem", fontWeight:700, color:"#1a1a1a", margin:"0 0 6px", letterSpacing:"-0.5px", fontFamily:"DM Sans, sans-serif", textAlign: "left"}}>Welcome</h2>
            <p style={{ fontSize:"0.80rem", color:"#9ca3af", margin:0, fontWeight:400, textAlign: "left" }}>Sign in with your employee account</p>
          </div>

          {/* Error */}
          {error && (
            <div style={{ padding:"10px 13px", borderRadius:8, background:"#fef2f2", border:"1px solid #fecaca", color:"#b91c1c", fontSize:"0.80rem", marginBottom:16, display:"flex", gap:8, alignItems:"center" }}>
              <Icon name="alertCircle" size={14} style={{ flexShrink:0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} style={{ display:"flex", flexDirection:"column", gap:16 }}>
              {/* NIK */}
              <div>
                <label style={{ ...LS.label, fontSize: '11px' }}>USERNAME</label>
                <div style={LS.inputWrap}
                  onFocus={e => e.currentTarget.style.borderColor="#12365F"}
                  onBlur={e  => e.currentTarget.style.borderColor="#e5e7eb"}>
                  <Icon name="user" size={15} style={{ color:"#9ca3af", flexShrink:0 }} />
                  <input style={{ ...LS.input, fontSize: '13px' }} type="text" placeholder="Enter your username"
                    value={nik} onChange={e => setNik(e.target.value)} autoComplete="username" />
                </div>
              </div>

              {/* Password */}
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                  <label style={{ ...LS.label, fontSize: '11px', marginBottom:0 }}>PASSWORD</label>
                  <button type="button" onClick={() => setShowForgotPw(true)}
                    style={{ fontSize:"0.72rem", color:"#12365F", fontWeight:600, background:"none", border:"none", cursor:"pointer", padding:0, fontFamily:"Montserrat,sans-serif" }}>
                    Forgot Password?
                  </button>
                </div>
                <div style={LS.inputWrap}
                  onFocus={e => e.currentTarget.style.borderColor="#12365F"}
                  onBlur={e  => e.currentTarget.style.borderColor="#e5e7eb"}>
                  <Icon name="lock" size={15} style={{ color:"#9ca3af", flexShrink:0 }} />
                  <input style={{ ...LS.input, fontSize: '13px' }} type={showPass?"text":"password"} placeholder="Enter your password"
                    value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
                  <button type="button" onClick={() => setShowPass(p => !p)}
                    style={{ background:"none", border:"none", padding:0, cursor:"pointer", color:"#9ca3af", lineHeight:0 }}>
                    <Icon name={showPass?"eyeOff":"eye"} size={15} />
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                style={{ 
                  ...LS.btnPrimary, 
                  marginTop: 4, 
                  opacity: loading ? 0.75 : 1,
                  fontSize: '13.5px',       // <--- Menentukan ukuran font
                  fontWeight: '615'       // <--- Menentukan ketebalan font (bisa 'bold', 'normal', 500, 600, dll)
                }}
                onMouseOver={e => { if (!loading) e.currentTarget.style.boxShadow="0 6px 20px rgba(18,54,95,0.42)"; }}
                onMouseOut={e  => e.currentTarget.style.boxShadow="0 4px 14px rgba(18,54,95,0.30)"}
              >
                {loading ? "Signing in…" : "Login"}
              </button>
            </form>

          {/* Guest access — only when enabled on the server */}
          {guestEnabled && (
            <div style={{ display:"flex", alignItems:"center", gap:12, margin:"20px 0" }}>
              <div style={{ flex:1, height:1, background:"#f0f0f0" }} />
              <span style={{ fontSize:"0.72rem", color:"#9ca3af", fontWeight:500 }}>or</span>
              <div style={{ flex:1, height:1, background:"#f0f0f0" }} />
            </div>
          )}
          {guestEnabled && (
            <button onClick={handleGuestLogin} disabled={guestLoading || loading}
              style={{ width:"100%", padding:"11px 0", borderRadius:8,
                background:"#E6FAF6", color:"#0B1F3A", border:"1.5px solid #9BE7DC",
                cursor: guestLoading||loading ? "not-allowed" : "pointer",
                fontFamily:"Montserrat,sans-serif", fontWeight:600, fontSize:"0.85rem",
                display:"flex", alignItems:"center", justifyContent:"center", gap:10,
                transition:"all .2s", opacity: loading ? 0.5 : 1 }}
              onMouseOver={e => { if (!guestLoading&&!loading){ e.currentTarget.style.borderColor="#14B8A6"; e.currentTarget.style.background="#D5F5EE"; }}}
              onMouseOut={e  => { e.currentTarget.style.borderColor="#9BE7DC"; e.currentTarget.style.background="#E6FAF6"; }}>
              <Icon name="user" size={16} style={{ color:"#14B8A6" }} />
              {guestLoading ? "Opening guest access…" : "Login as Guest"}
            </button>
          )}
          {guestEnabled && (
            <p style={{ textAlign:"center", fontSize:"0.66rem", color:"#9ca3af", marginTop:6 }}>
              Guest access is read-only.
            </p>
          )}

          {/* Email hint */}
          <p style={{ textAlign:"center", fontSize:"0.68rem", color:"#9ca3af", marginTop:10 }}>
            Example username: <span style={{ fontFamily:"monospace", color:"#6b7280" }}>1234</span>
          </p>

          {/* Footer: copyright + privacy */}
          <p style={{ textAlign:"center", fontSize:"0.66rem", color:"#9ca3af", marginTop:22, paddingTop:16, borderTop:"1px solid #f0f0f0" }}>
            {COPYRIGHT_TEXT} | <Link to="/privacy" style={{ color:"var(--brand)", fontWeight:600 }}>Kebijakan Privasi</Link>
          </p>

        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPw && <ForgotPasswordModal onClose={() => setShowForgotPw(false)} />}
    </div>
  );
}