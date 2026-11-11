// src/pages/WhatsGoingOnPage.jsx
// Halaman dedicated: Portal > What's Going On

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { announcementsApi } from "../api";
import Icon from "../components/Icon";
import cereaLogo from "../assets/cerea-logo.png";
import PortalFooter from "../components/PortalFooter";
import PreviewBanner from "../components/PreviewBanner";
import { viewerFor } from "../preview";

/* ─── Shared constants ─────────────────────────────────────── */
const FONT = "Montserrat, sans-serif";

const PRIORITY_ACCENT = {
  high:   "#12365F",
  medium: "#f59e0b",
  low:    "#22c55e",
};

const PRIORITY_LABEL = {
  high:   "High",
  medium: "Medium",
  low:    "Low",
};

/* ─── Single announcement row ──────────────────────────────── */
function AnnounceRow({ ann, index }) {
  const bgMap     = { high: "#fff5f5", medium: "#fffbeb", low: "#f0fdf4" };
  const borderMap = { high: "#fecaca", medium: "#fde68a", low: "#a7f3d0" };
  const dateStr   = ann.announce_date
    ? new Date(ann.announce_date).toLocaleDateString("en-US", { month:"long", day:"numeric", year:"numeric" })
    : "";

  return (
    <div style={{
      display: "flex", alignItems: "stretch",
      background: bgMap[ann.priority] ?? "#f9fafb",
      border: `1px solid ${borderMap[ann.priority] ?? "#e5e7eb"}`,
      borderRadius: 10, overflow: "hidden",
      animation: `slideUp .18s ease ${index * 0.04}s both`,
    }}>
      {/* Priority accent bar */}
      <div style={{ width: 4, flexShrink: 0, background: PRIORITY_ACCENT[ann.priority] }} />

      <div style={{
        display: "grid",
        gridTemplateColumns: "130px 170px 1fr 120px 160px 160px",
        alignItems: "center", gap: 14,
        padding: "16px 18px", width: "100%",
      }}>
        {/* Date */}
        <p style={{ ...valStyle, fontWeight: 600, margin: 0 }}>{dateStr}</p>

        {/* Activity */}
        <p style={{ ...valStyle, fontWeight: 600, color: "#374151", margin: 0 }}>{ann.activity}</p>

        {/* Description */}
        <p style={{ ...valStyle, color: "#4b5563", lineHeight: 1.5, margin: 0 }}>{ann.description}</p>

        {/* Department */}
        <div>
          <span style={{
            display: "inline-block", padding: "3px 10px", borderRadius: 20,
            background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe",
            fontSize: "0.60rem", fontWeight: 600,
          }}>{ann.department || "All"}</span>
        </div>

        {/* Priority */}
        <div>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "3px 10px", borderRadius: 20, fontSize: "0.60rem", fontWeight: 700,
            background: PRIORITY_ACCENT[ann.priority] + "18",
            color: PRIORITY_ACCENT[ann.priority],
            border: `1px solid ${PRIORITY_ACCENT[ann.priority]}30`,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: PRIORITY_ACCENT[ann.priority], flexShrink: 0 }} />
            {PRIORITY_LABEL[ann.priority]}
          </span>
        </div>

        {/* Link */}
        <div>
          {ann.link_url ? (
            <a href={ann.link_url} target="_blank" rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "4px 12px", borderRadius: 20,
                background: "#EEF6FA", color: "#12365F",
                border: "1px solid rgba(18,54,95,0.15)",
                fontSize: "0.60rem", fontWeight: 700,
                textDecoration: "none", fontFamily: FONT, transition: "all 0.2s",
              }}
              onMouseOver={e => { e.currentTarget.style.background = "#12365F"; e.currentTarget.style.color = "white"; }}
              onMouseOut={e  => { e.currentTarget.style.background = "#EEF6FA"; e.currentTarget.style.color = "#12365F"; }}
            >
              {ann.link_label || "Open"} <Icon name="externalLink" size={9} />
            </a>
          ) : <span style={{ fontSize: "0.60rem", color: "#d1d5db" }}>—</span>}
        </div>
      </div>
    </div>
  );
}

const valStyle = {
  fontSize: "0.68rem", color: "#374151", margin: 0,
};

/* ─── Filters / search bar ─────────────────────────────────── */
const PRIORITY_FILTERS = ["All", "High", "Medium", "Low"];

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════ */
export default function WhatsGoingOnPage() {
  const { user: authUser, logout } = useAuth();
  const user = viewerFor(authUser);   // previewed identity when an admin is in "Preview as user"
  const navigate = useNavigate();

  const [announcements, setAnnouncements] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState("");
  const [priority,      setPriority]      = useState("All");

  const handleLogout = () => { logout(); navigate("/login", { replace: true }); };

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await announcementsApi.list();
      setAnnouncements(res.data);
    } catch {
      // silent — empty state shown
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

  const filtered = announcements.filter(ann => {
    const matchSearch   = (ann.activity    || "").toLowerCase().includes(search.toLowerCase()) ||
                          (ann.description || "").toLowerCase().includes(search.toLowerCase()) ||
                          (ann.department  || "").toLowerCase().includes(search.toLowerCase());
    const matchPriority = priority === "All" || ann.priority === priority.toLowerCase();
    return matchSearch && matchPriority;
  });

  const roleBadgeColor = {
    Admin: "#12365F", CEO: "#7e22ce", CFO: "#1d4ed8",
    DCFO: "#065f46", "GM/DGM": "#c2410c", User: "#374151",
  }[user?.role] ?? "#374151";

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5", fontFamily: FONT, display: "flex", flexDirection: "column" }}>
      <PreviewBanner />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=DM+Sans:wght@700;800&display=swap');
        * { box-sizing: border-box; }
        @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes slideUp { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
        @keyframes slideDown { from { opacity:0; transform:translateY(-10px) } to { opacity:1; transform:translateY(0) } }
        @keyframes shimmer { 0%,100% { opacity:1 } 50% { opacity:0.5 } }
      `}</style>

      {/* ── Header (sama dengan UserPortal) ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 40,
        background: "rgba(255,255,255,0.97)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid #e5e7eb",
        boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
      }}>
        <div style={{
          maxWidth: 1400, margin: "0 auto", padding: "10px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
        }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <img src={cereaLogo} alt="Cerea" style={{ height: 30, width: "auto" }} />
            <div style={{ width: 1, height: 20, background: "#e5e7eb" }} />
            <p style={{ fontSize: "0.70rem", color: "#9ca3af", fontWeight: 500, margin: 0 }}>Employee Portal</p>
          </div>

          {/* Right: user + logout */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#1a1a1a", margin: 0, lineHeight: 1.2 }}>{user?.full_name}</p>
              <p style={{ fontSize: "0.65rem", color: "#9ca3af", margin: 0, marginTop: 2 }}>{user?.role === "Guest" ? "Read-only access" : `NIK: ${user?.nik}`}</p>
            </div>
            <div style={{
              padding: "3px 10px", borderRadius: 20,
              background: roleBadgeColor + "18",
              border: `1px solid ${roleBadgeColor}30`,
              color: roleBadgeColor, fontSize: "0.68rem", fontWeight: 700,
            }}>
              {user?.role}
            </div>
            <button onClick={handleLogout}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "7px 12px", borderRadius: 8,
                border: "1.5px solid #e5e7eb", background: "white",
                cursor: "pointer", fontSize: "0.75rem", fontWeight: 600,
                color: "#6b7280", fontFamily: FONT, transition: "all .15s",
              }}
              onMouseOver={e => { e.currentTarget.style.borderColor = "#12365F"; e.currentTarget.style.color = "#12365F"; }}
              onMouseOut={e  => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.color = "#6b7280"; }}>
              <Icon name="logOut" size={13} /> Logout
            </button>
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "28px 24px 48px", width: "100%", flex: 1 }}>

        {/* ── Breadcrumb ── */}
        <nav style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20, animation: "fadeIn .2s ease" }}>
          <button
            onClick={() => navigate("/user-portal")}
            style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              background: "none", border: "none", cursor: "pointer",
              fontSize: "0.72rem", fontWeight: 600, color: "#12365F",
              padding: "4px 8px 4px 4px", borderRadius: 6,
              fontFamily: FONT, transition: "background .15s",
            }}
            onMouseOver={e => e.currentTarget.style.background = "#EEF6FA"}
            onMouseOut={e  => e.currentTarget.style.background = "none"}
          >
            <Icon name="home" size={13} /> Portal
          </button>
          <Icon name="chevronRight" size={12} style={{ color: "#d1d5db" }} />
          <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#374151" }}>What's Going On</span>
        </nav>

        {/* ── Page title ── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 20, animation: "slideUp .2s ease" }}>
          <div>
            <h1 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#1a1a1a", margin: "0 0 6px", letterSpacing: "-0.5px", fontFamily: "'DM Sans', sans-serif" }}>
              What's Going On
            </h1>
            <p style={{ fontSize: "0.72rem", color: "#9ca3af", margin: 0, fontWeight: 500 }}>
              Latest announcements and activities across departments
            </p>
          </div>

          {/* Total badge */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "8px 16px", borderRadius: 10,
            background: "white", border: "1px solid #e5e7eb",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}>
            <Icon name="bell" size={14} style={{ color: "#12365F" }} />
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#1a1a1a" }}>
              {announcements.length} Total Announcements
            </span>
          </div>
        </div>

        {/* ── Filter bar ── */}
        <div style={{
          background: "white", borderRadius: 12, border: "1px solid #e5e7eb",
          padding: "14px 18px", marginBottom: 16,
          display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          animation: "slideUp .22s ease .04s both",
        }}>
          {/* Search */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "#f9fafb", border: "1.5px solid #e5e7eb",
            borderRadius: 8, padding: "7px 12px", flex: 1, maxWidth: 280,
            transition: "border-color .2s",
          }}
            onFocusCapture={e => e.currentTarget.style.borderColor = "#12365F"}
            onBlurCapture={e  => e.currentTarget.style.borderColor = "#e5e7eb"}
          >
            <Icon name="search" size={13} style={{ color: "#9ca3af", flexShrink: 0 }} />
            <input
              type="text" placeholder="Search announcements…" value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                border: "none", outline: "none", background: "none",
                fontSize: "0.72rem", color: "#1a1a1a", width: "100%", fontFamily: FONT,
              }}
            />
            {search && (
              <button onClick={() => setSearch("")}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 0, lineHeight: 0 }}>
                <Icon name="x" size={12} />
              </button>
            )}
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 24, background: "#e5e7eb" }} />

          {/* Priority pills */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: "0.65rem", fontWeight: 600, color: "#9ca3af" }}>Priority:</span>
            {PRIORITY_FILTERS.map(p => {
              const active = p === priority;
              const accent = p === "All" ? "#12365F" : PRIORITY_ACCENT[p.toLowerCase()];
              return (
                <button key={p} onClick={() => setPriority(p)} style={{
                  padding: "4px 14px", borderRadius: 20, fontSize: "0.65rem", fontWeight: 600,
                  cursor: "pointer", transition: "all .15s", fontFamily: FONT,
                  border: `1.5px solid ${active ? accent : "#e5e7eb"}`,
                  background: active ? accent : "white",
                  color: active ? "white" : "#6b7280",
                  boxShadow: active ? `0 2px 6px ${accent}33` : "none",
                }}>
                  {p}
                </button>
              );
            })}
          </div>

          {/* Result count */}
          <span style={{ marginLeft: "auto", fontSize: "0.65rem", color: "#9ca3af", fontWeight: 500 }}>
            {filtered.length} of {announcements.length} results
          </span>
        </div>

        {/* ── Announcements list ── */}
        <div style={{
          background: "white", borderRadius: 14, border: "1px solid #e5e7eb",
          boxShadow: "0 1px 6px rgba(0,0,0,0.05)", overflow: "hidden",
          animation: "slideUp .24s ease .08s both",
        }}>
          {/* Table header — mirrors AnnounceRow padding exactly */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "0px 140px 178px 1fr 127px 170px 160px",
            alignItems: "center",
            gap: 5, padding: "10px 18px",
            marginLeft: 18, marginRight: 18,
            borderBottom: "2px solid #f3f4f6",
            background: "#fafafa",
          }}>
            <div /> {/* accent bar spacer */}
            {["Date", "Activity", "Description", "Department", "Priority", "Link"].map(h => (
              <p key={h} style={{
                fontSize: "0.60rem", fontWeight: 700, color: "#9ca3af",
                margin: 0, textTransform: "uppercase", letterSpacing: "0.06em",
              }}>{h}</p>
            ))}
          </div>

          {/* Rows */}
          <div style={{ padding: "12px 0", display: "flex", flexDirection: "column", gap: 0 }}>
            {loading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} style={{ padding: "6px 18px" }}>
                  <div style={{ height: 64, borderRadius: 10, background: "#f3f4f6", animation: "shimmer 1.4s infinite" }} />
                </div>
              ))
            ) : filtered.length > 0 ? (
              filtered.map((ann, i) => (
                <div key={ann.id} style={{ padding: "6px 18px" }}>
                  <AnnounceRow ann={ann} index={i} />
                </div>
              ))
            ) : (
              <div style={{ padding: "48px 0", textAlign: "center" }}>
                <Icon name="bell" size={32} style={{ color: "#d1d5db", marginBottom: 12 }} />
                <p style={{ fontSize: "0.85rem", color: "#9ca3af", fontWeight: 600 }}>No announcements found</p>
                {(search || priority !== "All") && (
                  <button
                    onClick={() => { setSearch(""); setPriority("All"); }}
                    style={{
                      marginTop: 10, padding: "5px 16px", borderRadius: 20,
                      background: "#EEF6FA", color: "#12365F",
                      border: "1px solid rgba(18,54,95,0.12)",
                      cursor: "pointer", fontSize: "0.72rem", fontWeight: 600, fontFamily: FONT,
                    }}
                  >Reset filters</button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <PortalFooter />
    </div>
  );
}