// src/pages/UserPortal.jsx — Cerea redesign with 3-section layout

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { cardsApi, announcementsApi, resolveUploadUrl } from "../api";
import Icon from "../components/Icon";
import { AppIcon, IconBadge, CATEGORY_ICONS } from "../components/icons";
import cereaLogo from "../assets/cerea-logo.png";
import PortalFooter from "../components/PortalFooter";
import PreviewBanner from "../components/PreviewBanner";
import { viewerFor } from "../preview";
import cereaMarkWhite from "../assets/cerea-mark-white.png";

/* ─── Constants ──────────────────────────────────────────────── */
const FONT = "Montserrat, sans-serif";


const SUB_CATS = ["All", "Website", "Application", "Dashboard", "Form"];

/* ─── Click-counter helpers (per-user, localStorage) ─────────── */
/* ─── (click tracking handled via API — see handleAppOpen in UserPortal) ── */

/* ─── Live Clock ─────────────────────────────────────────────── */
function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ textAlign:"center" }}>
      <p style={{ fontFamily:"monospace", fontSize:"0.85rem", color:"#6b7280", fontWeight:600, lineHeight:1 }}>
        {time.toLocaleTimeString("id-ID", { hour:"2-digit", minute:"2-digit", second:"2-digit" })}
      </p>
      <p style={{ fontSize:"0.68rem", color:"#9ca3af", marginTop:2, fontFamily:FONT }}>
        {time.toLocaleDateString("en-EN", { weekday:"long", day:"2-digit", month:"long", year:"numeric" })}
      </p>
    </div>
  );
}

/* ─── App Card ───────────────────────────────────────────────── */
function AppCard({ card, onOpen }) {
  const [hov, setHov] = useState(false);
  const navigate = useNavigate();

  const INTERNAL_PREFIX = "internal://";
  const isInternal = card.link_url?.startsWith(INTERNAL_PREFIX);
  const internalPath = isInternal ? card.link_url.replace(INTERNAL_PREFIX, "") : null;

  const handleOpen = () => {
    if (onOpen) onOpen(card.id);
    if (isInternal) navigate(internalPath);
    else window.open(card.link_url, "_blank", "noopener,noreferrer");
  };

  const iconType = card.icon_type || "preset";
  const iconValue = card.icon_value || card.icon_name || "globe";
  const iconSrc = resolveUploadUrl(iconValue);
  const useImage = (iconType === "url" || iconType === "upload" || iconType === "auto") && !!iconValue;

  return (
    <div
      className="cx-tile"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={handleOpen}
      style={{
        display:"flex", flexDirection:"column", alignItems:"center",
        gap:10, width:104, maxWidth:"100%", cursor:"pointer",
        transition:"transform 0.15s ease", fontFamily:FONT,
        userSelect: "none", textAlign:"center",
        transform: hov ? "translateY(-2px)" : "none",
      }}
    >
      {/* Icon — illustrated icon in soft circular badge (tone per kategori) */}
      <IconBadge category={card.category} size={72}>
        {useImage ? (
          <img
            src={iconSrc}
            alt=""
            style={{ width:"80%", height:"80%", objectFit:"cover" }}
            onError={(e) => {
              e.target.style.display = "none";
              const fb = e.target.nextElementSibling;
              if (fb) fb.style.display = "flex";
            }}
          />
        ) : null}
        <div style={{
          display: useImage ? "none" : "flex",
          alignItems:"center", justifyContent:"center",
          width:"100%", height:"100%",
        }}>
          <AppIcon
            name={iconType === "preset" ? iconValue : CATEGORY_ICONS[card.category]?.icon}
            size={44}
          />
        </div>
      </IconBadge>

      {/* Name */}
      <p style={{ fontSize:"11px", fontWeight:500, color:"#1a1a2e",
        lineHeight:1.35, margin:0, wordBreak:"break-word" }}>
        {card.page_name}
      </p>
    </div>
  );
}

/* ─── Section Row — reusable ─────────────────────────────────── */
function SectionRow({ title, subtitle, cards, loading, extraFilter, onOpen }) {
  const [search, setSearch] = useState("");
  const [subCat, setSubCat] = useState("All");

  const filtered = cards.filter(c => {
    const matchSearch = c.page_name.toLowerCase().includes(search.toLowerCase()) ||
                        (c.page_detail||"").toLowerCase().includes(search.toLowerCase());
    const matchSub    = !extraFilter || subCat === "All" || c.category === subCat;
    return matchSearch && matchSub;
  });

  return (
    <div style={{ background:"white", borderRadius:14, border:"1px solid #e5e7eb",
      boxShadow:"0 1px 6px rgba(0,0,0,0.05)", overflow:"hidden", fontFamily:FONT }}>

      {/* Section header */}
      <div style={{ padding:"16px 20px 0", borderBottom:"1px solid #f3f4f6" }}>
        {/* Top row: title + search */}
        <div className="up-sec-top" style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:16, marginBottom:12 }}>
          <div>
            <h3 style={{ fontSize:"0.95rem", fontWeight:700, color:"#1a1a1a", margin:"0 0 3px", letterSpacing:"-0.2px", fontFamily:"'DM Sans', sans-serif" }}>
              {title}
            </h3>
            {subtitle && <p style={{ fontSize:"0.65rem", color:"#9ca3af", margin:0, fontWeight:500 }}>{subtitle}</p>}
          </div>

          {/* Search bar */}
          <div className="up-search" style={{
            display:"flex", alignItems:"center", gap:7,
            background:"#f9fafb", border:"1.5px solid #e5e7eb",
            borderRadius:8, padding:"7px 12px", minWidth:180, maxWidth:240,
            transition:"border-color .2s",
          }}
            onFocus={e => e.currentTarget.style.borderColor="#12365F"}
            onBlur={e  => e.currentTarget.style.borderColor="#e5e7eb"}
          >
            <Icon name="search" size={13} style={{ color:"#9ca3af", flexShrink:0 }} />
            <input
              type="text" placeholder="Search…" value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ border:"none", outline:"none", background:"none", fontSize:"0.70rem",
                color:"#1a1a1a", width:"100%", fontFamily:FONT }}
            />
            {search && (
              <button onClick={() => setSearch("")}
                style={{ background:"none", border:"none", cursor:"pointer", color:"#9ca3af", padding:0, lineHeight:0 }}>
                <Icon name="x" size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Sub-category pills — only for "All Apps" */}
        {extraFilter && (
          <div className="up-pills" style={{ display:"flex", gap:6, paddingBottom:14 }}>
            {SUB_CATS.map(cat => {
              const active = cat === subCat;
              const count  = cat === "All"
                ? cards.length
                : cards.filter(c => c.category === cat).length;
              return (
                <button key={cat} onClick={() => setSubCat(cat)} style={{
                  display:"inline-flex", alignItems:"center", gap:6,
                  padding:"4px 14px", borderRadius:20, fontSize:"0.65rem", fontWeight:600,
                  cursor:"pointer", transition:"all .15s", fontFamily:FONT,
                  border:`1.5px solid ${active?"#12365F":"#e5e7eb"}`,
                  background: active?"#12365F":"white",
                  color: active?"white":"#6b7280",
                  boxShadow: active?"0 2px 6px rgba(18,54,95,0.22)":"none",
                }}>
                  {CATEGORY_ICONS[cat] && (
                    <span style={{
                      display:"inline-flex", borderRadius:"50%", margin:"-1px 0 -1px -8px",
                      background: active ? "rgba(255,255,255,0.92)" : (CATEGORY_ICONS[cat].tone === "teal" ? "#E6FAF6" : "#E8F2FF"),
                      padding:2,
                    }}>
                      <AppIcon name={CATEGORY_ICONS[cat].icon} size={14} />
                    </span>
                  )}
                  {cat}
                  <span style={{
                    fontSize:"0.58rem", fontWeight:600, lineHeight:1,
                    padding:"1px 5px", borderRadius:20,
                    background: active ? "rgba(255,255,255,0.25)" : "#f3f4f6",
                    color:       active ? "white"                  : "#9ca3af",
                    minWidth:16, textAlign:"center",
                  }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Cards grid */}
      <div style={{ padding:"16px 20px 20px" }}>
        {loading ? (
          <div className="up-cards" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))", gap:12 }}>
            {Array(6).fill(0).map((_,i) => (
              <div key={i} style={{ height:160, borderRadius:12, background:"#f3f4f6",
                animation:"shimmer 1.4s infinite" }} />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="up-cards" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))", gap:12 }}>
            {filtered.map(card => <AppCard key={card.id} card={card} onOpen={onOpen} />)}
          </div>
        ) : (
          <div style={{ padding:"32px 0", textAlign:"center" }}>
            <Icon name="search" size={28} style={{ color:"#d1d5db", marginBottom:10 }} />
            <p style={{ fontSize:"0.82rem", color:"#9ca3af", fontWeight:600 }}>
              {search ? `No results found for "${search}"` : "No applications available in this section"}
            </p>
            {search && (
              <button onClick={() => setSearch("")}
                style={{ marginTop:8, padding:"5px 16px", borderRadius:20, background:"#EEF6FA",
                  color:"#12365F", border:"1px solid rgba(18,54,95,0.12)", cursor:"pointer",
                  fontSize:"0.72rem", fontWeight:600, fontFamily:FONT }}>
                Reset
              </button>
            )}
          </div>
        )}
        <p style={{ fontSize:"0.65rem", color:"#d1d5db", marginTop:12, textAlign:"right" }}>
          {filtered.length} application{filtered.length !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
}

/* ─── What's Going On ────────────────────────────────────── */

const PRIORITY_ACCENT = {
  high:   "#12365F",
  medium: "#f59e0b",
  low:    "#22c55e",
};

const PREVIEW_LIMIT = 2;

/* ─── Shared: single announcement row ───────────────────────── */
function AnnounceRow({ ann }) {
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
    }}>
      <div style={{ width: 4, flexShrink: 0, background: PRIORITY_ACCENT[ann.priority] }} />
      <div className="up-ann-grid" style={{
        display: "grid",
        gridTemplateColumns: "130px 160px 1fr 120px 160px",
        alignItems: "center", gap: 12,
        padding: "14px 16px", width: "100%",
      }}>
        {/* Date */}
        <p style={{ fontSize:"0.65rem", fontWeight:600, color:"#374151", margin:0, lineHeight:1.45 }}>{dateStr}</p>
        {/* Activity */}
        <p style={{ fontSize:"0.65rem", fontWeight:600, color:"#374151", margin:0, lineHeight:1.45 }}>{ann.activity}</p>
        {/* Description */}
        <p style={{ fontSize:"0.65rem", fontWeight:500, color:"#4b5563", margin:0, lineHeight:1.45 }}>{ann.description}</p>
        {/* Department */}
        <div>
          <span style={{
            display:"inline-block", padding:"2px 8px", borderRadius:20,
            background:"#eff6ff", color:"#1d4ed8", border:"1px solid #bfdbfe",
            fontSize:"0.60rem", fontWeight:600,
          }}>{ann.department || "All"}</span>
        </div>
        {/* Link */}
        <div>
          {ann.link_url ? (
            <a href={ann.link_url} target="_blank" rel="noopener noreferrer"
              style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"4px 12px", borderRadius:20, background:"#EEF6FA", color:"#12365F", border:"1px solid rgba(18,54,95,0.15)", fontSize:"0.60rem", fontWeight:700, textDecoration:"none", fontFamily:FONT, transition:"all 0.2s" }}
              onMouseOver={e=>{ e.currentTarget.style.background="#12365F"; e.currentTarget.style.color="white"; }}
              onMouseOut={e =>{ e.currentTarget.style.background="#EEF6FA"; e.currentTarget.style.color="#12365F"; }}
            >{ann.link_label || "Open"} <Icon name="externalLink" size={9} /></a>
          ) : <span style={{ fontSize:"0.60rem", color:"#d1d5db" }}>—</span>}
        </div>
      </div>
    </div>
  );
}

/* ─── Notification Bell Popup ────────────────────────────────── */
function NotifPopup({ announcements = [], onClose, onViewAll }) {
  return (
    <>
      <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:90 }} />
      <div style={{
        position:"absolute", top:"calc(100% + 10px)", right:0,
        width:340, background:"white", borderRadius:14,
        border:"1px solid #e5e7eb", boxShadow:"0 12px 40px rgba(0,0,0,0.14)",
        zIndex:100, overflow:"hidden", animation:"slideDown .18s ease",
        fontFamily:FONT,
      }}>
        <div style={{ padding:"14px 16px 12px", borderBottom:"1px solid #f3f4f6", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:"0.85rem", fontWeight:700, color:"#1a1a1a", fontFamily:"'DM Sans', sans-serif" }}>Notifications</span>
            <span style={{ padding:"1px 7px", borderRadius:20, fontSize:"0.55rem", fontWeight:700, background:"#12365F", color:"white" }}>{announcements.length}</span>
          </div>
          <button onClick={onViewAll} style={{ fontSize:"0.60rem", fontWeight:600, color:"#12365F", background:"none", border:"none", cursor:"pointer", padding:0 }}>View All</button>
        </div>
        <div style={{ maxHeight:320, overflowY:"auto" }}>
          {announcements.length === 0 ? (
            <div style={{ padding:"24px 16px", textAlign:"center", color:"#9ca3af", fontSize:"0.72rem" }}>No announcements</div>
          ) : announcements.map((ann, i) => (
            <div key={ann.id} style={{
              padding:"12px 16px", borderBottom: i < announcements.length-1 ? "1px solid #f9fafb" : "none",
              display:"flex", alignItems:"flex-start", gap:10, cursor:"pointer", transition:"background .15s",
            }}
              onMouseOver={e=>e.currentTarget.style.background="#fafafa"}
              onMouseOut={e=>e.currentTarget.style.background="white"}
            >
              <div style={{ width:8, height:8, borderRadius:"50%", background:PRIORITY_ACCENT[ann.priority], flexShrink:0, marginTop:4 }} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:6, marginBottom:3 }}>
                  <p style={{ fontSize:"0.72rem", fontWeight:500, color:"#1a1a1a", margin:0, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{ann.activity}</p>
                  <span style={{ fontSize:"0.55rem", color:"#9ca3af", flexShrink:0 }}>
                    {ann.announce_date ? new Date(ann.announce_date).toLocaleDateString("en-US",{month:"short",day:"numeric"}) : ""}
                  </span>
                </div>
                <p style={{ fontSize:"0.65rem", color:"#6b7280", margin:0, lineHeight:1.4,
                  display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{ann.description}</p>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding:"10px 16px", borderTop:"1px solid #f3f4f6", textAlign:"center" }}>
          <button onClick={onViewAll} style={{
            fontSize:"0.68rem", fontWeight:700, color:"#12365F", background:"none", border:"1.5px solid rgba(18,54,95,0.2)",
            borderRadius:20, padding:"5px 20px", cursor:"pointer", fontFamily:FONT, transition:"all .15s",
          }}
            onMouseOver={e=>{ e.currentTarget.style.background="#12365F"; e.currentTarget.style.color="white"; }}
            onMouseOut={e =>{ e.currentTarget.style.background="none"; e.currentTarget.style.color="#12365F"; }}
          >See all announcements</button>
        </div>
      </div>
    </>
  );
}

/* ─── What's Going On section card ──────────────────────────── */
function WhatsGoingOn({ announcements = [], onViewAll }) {
  const hasMore = announcements.length > PREVIEW_LIMIT;
  const visible = announcements.slice(0, PREVIEW_LIMIT);

  return (
    <div style={{
      background: "white", borderRadius: 14, border: "1px solid #e5e7eb",
      boxShadow: "0 1px 6px rgba(0,0,0,0.05)", overflow: "hidden",
      fontFamily: FONT, marginBottom: 16,
    }}>
      {/* Header */}
      <div style={{ padding: "16px 20px 14px", borderBottom: "1px solid #f3f4f6",
        display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1a1a1a", margin: 0, letterSpacing: "-0.2px", fontFamily:"'DM Sans', sans-serif" }}>
            What's Going On
          </h3>
          <span style={{ padding:"1px 8px", borderRadius:20, fontSize:"0.60rem", fontWeight:700, background:"#EEF6FA", color:"#12365F", border:"1px solid rgba(18,54,95,0.15)" }}>
            {announcements.length}
          </span>
        </div>
        {hasMore && (
          <button
            onClick={onViewAll}
            style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "5px 14px", borderRadius: 20, fontSize: "0.68rem", fontWeight: 600,
              background: "white", color: "#12365F",
              border: "1.5px solid #12365F",
              cursor: "pointer", transition: "all 0.2s", fontFamily: FONT,
            }}
            onMouseOver={e=>{ e.currentTarget.style.background="#12365F"; e.currentTarget.style.color="white"; }}
            onMouseOut={e =>{ e.currentTarget.style.background="white"; e.currentTarget.style.color="#12365F"; }}
          >
            View All <Icon name="chevronRight" size={12} />
          </button>
        )}
      </div>

      {/* Column headers */}
      <div className="up-ann-head" style={{
        display: "grid",
        gridTemplateColumns: "27px 132px 160px 1fr 120px 180px",
        gap: 12, padding: "8px 16px 8px 0",
        borderBottom: "1.5px solid #f3f4f6",
        background: "#fafafa",
      }}>
        <div />
        {["Date", "Activity", "Description", "Department", "Go to Link"].map(h => (
          <p key={h} style={{
            fontSize: "0.58rem", fontWeight: 700, color: "#9ca3af",
            margin: 0, textTransform: "uppercase", letterSpacing: "0.06em",
            paddingLeft: h === "Date" ? 1 : 0,
          }}>{h}</p>
        ))}
      </div>

      {/* Announcement rows */}
      <div style={{ padding: "12px 20px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {visible.map(ann => <AnnounceRow key={ann.id} ann={ann} />)}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN USER PORTAL
════════════════════════════════════════════════════════════ */
export default function UserPortal() {
  const { user: authUser, logout } = useAuth();
  const user = viewerFor(authUser);   // previewed identity when an admin is in "Preview as user"
  const navigate = useNavigate();
  const [cards,          setCards]          = useState([]);
  const [frequentlyUsed, setFrequentlyUsed] = useState([]);
  const [announcements,  setAnnouncements]  = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState("");
  const [showNotif,      setShowNotif]      = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [cardsRes, freqRes, annRes] = await Promise.all([
        cardsApi.list(),
        cardsApi.frequentlyUsed?.() ?? Promise.resolve({ data: [] }),
        announcementsApi.list(),
      ]);
      setCards(cardsRes.data);
      setFrequentlyUsed(freqRes.data);
      setAnnouncements(annRes.data);
    } catch {
      setError("Failed to load portal data. Please check your server connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Catat klik ke API — fire-and-forget, lalu refresh frequently used
  const handleAppOpen = useCallback(async (cardId) => {
    try {
      await cardsApi.recordClick?.(cardId);
      const res = await cardsApi.frequentlyUsed?.();
      if (res?.data) setFrequentlyUsed(res.data);
    } catch { /* silent */ }
  }, []);

  const handleLogout = () => { logout(); navigate("/login", { replace:true }); };

  // ── Section logic ──────────────────────────────────────────

  const accessibleCards = cards.filter(c => {
    try {
      const allowedRoles = typeof c.target_roles === "string"
        ? JSON.parse(c.target_roles) : c.target_roles;
      return Array.isArray(allowedRoles) && allowedRoles.includes(user?.role);
    } catch { return false; }
  });

  // Frequently Used: dari API (sudah difilter per user di backend)
  // General Apps: flag is_general dari Admin
  const generalApps = accessibleCards.filter(c => !!c.is_general);

  // All Apps
  const allApps = accessibleCards;

  const roleBadgeColor = {
    Admin:"#12365F", CEO:"#7e22ce", CFO:"#1d4ed8",
    DCFO:"#065f46", "GM/DGM":"#c2410c", User:"#374151",
  }[user?.role] ?? "#374151";

  return (
    <div style={{ minHeight:"100vh", background:"#f5f5f5", fontFamily:FONT, display:"flex", flexDirection:"column" }}>
      <PreviewBanner />

      {/* ── Announcements Modal — removed, now a dedicated page ── */}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=DM+Sans:wght@700;800&display=swap');
        * { box-sizing:border-box; }
        @keyframes shimmer {
          0%   { background:linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%); }
          100% { background:linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%);
                 background-position:200% 0; }
        }
        @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes slideUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
        @keyframes slideDown { from { opacity:0; transform:translateY(-10px) } to { opacity:1; transform:translateY(0) } }

        /* ── Phone layout (inline styles above → overridden here) ── */
        @media (max-width: 640px) {
          .up-hide-sm { display:none !important; }
          .up-header-inner { padding:10px 16px !important; gap:10px !important; }
          .up-body { padding:16px 16px 32px !important; }
          .up-banner { padding:18px !important; }
          .up-banner > div:last-child { display:none !important; }
          .up-ann-head { display:none !important; }
          .up-ann-grid { grid-template-columns:1fr !important; gap:6px !important; padding:12px 14px !important; }
          .up-sec-top { flex-direction:column; gap:10px !important; }
          .up-search { min-width:0 !important; max-width:none !important; width:100%; }
          .up-pills { overflow-x:auto; scrollbar-width:none; margin:0 -20px; padding:0 20px 14px !important; }
          .up-pills::-webkit-scrollbar { display:none; }
          .up-pills > button { flex-shrink:0; }
          .up-cards { grid-template-columns:repeat(auto-fill,minmax(84px,1fr)) !important; gap:16px 6px !important; }
        }
      `}</style>

      {/* ── Header ── */}
      <header style={{
        position:"sticky", top:0, zIndex:40,
        background:"rgba(255,255,255,0.97)", backdropFilter:"blur(12px)",
        borderBottom:"1px solid #e5e7eb",
        boxShadow:"0 1px 6px rgba(0,0,0,0.04)",
      }}>
        <div className="up-header-inner" style={{ maxWidth:1400, margin:"0 auto", padding:"10px 24px",
          display:"flex", alignItems:"center", justifyContent:"space-between", gap:16 }}>

          {/* Left: Cerea logo */}
          <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
            <img src={cereaLogo} alt="Cerea" style={{ height:30, width:"auto" }} />
            <div className="up-hide-sm" style={{ width:1, height:20, background:"#e5e7eb" }} />
            <p className="up-hide-sm" style={{ fontSize:"0.70rem", color:"#9ca3af", fontWeight:500, margin:0 }}>Employee Portal</p>
          </div>

          {/* Center: clock */}
          <div className="up-hide-sm"><LiveClock /></div>

          {/* Right: user + notif + logout */}
          <div style={{ display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
            <div className="up-hide-sm" style={{ textAlign:"right" }}>
              <p style={{ fontSize:"0.75rem", fontWeight:600, color:"#1a1a1a", margin:0, lineHeight:1.2 }}>{user?.full_name}</p>
              <p style={{ fontSize:"0.65rem", color:"#9ca3af", margin:0, marginTop:2 }}>NIK: {user?.nik}</p>
            </div>
            {/* Role badge */}
            <div style={{ padding:"3px 10px", borderRadius:20, background:roleBadgeColor+"18",
              border:`1px solid ${roleBadgeColor}30`, color:roleBadgeColor, fontSize:"0.68rem", fontWeight:700 }}>
              {user?.role}
            </div>

            {/* ── Notification Bell ── */}
            <div style={{ position:"relative" }}>
              <button
                onClick={() => setShowNotif(v => !v)}
                style={{
                  width:36, height:36, borderRadius:"50%",
                  border:"1.5px solid #e5e7eb", background: showNotif ? "#12365F" : "white",
                  cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
                  color: showNotif ? "white" : "#6b7280", transition:"all .2s", position:"relative",
                }}
                onMouseOver={e=>{ if(!showNotif){ e.currentTarget.style.borderColor="#12365F"; e.currentTarget.style.color="#12365F"; }}}
                onMouseOut={e =>{ if(!showNotif){ e.currentTarget.style.borderColor="#e5e7eb"; e.currentTarget.style.color="#6b7280"; }}}
              >
                <Icon name="bell" size={15} />
                {/* Red badge count */}
                <span style={{
                  position:"absolute", top:-4, right:-4,
                  minWidth:16, height:16, borderRadius:8, padding:"0 4px",
                  background:"#12365F", color:"white",
                  fontSize:"0.50rem", fontWeight:800,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  border:"2px solid white",
                }}>
                  {announcements.length}
                </span>
              </button>
              {showNotif && (
                <NotifPopup
                  announcements={announcements}
                  onClose={() => setShowNotif(false)}
                  onViewAll={() => { setShowNotif(false); navigate("/whats-going-on"); }}
                />
              )}
            </div>
            <button onClick={handleLogout}
              style={{ display:"flex", alignItems:"center", gap:5, padding:"7px 12px", borderRadius:8,
                border:"1.5px solid #e5e7eb", background:"white", cursor:"pointer",
                fontSize:"0.75rem", fontWeight:600, color:"#6b7280", fontFamily:FONT, transition:"all .15s" }}
              onMouseOver={e=>{e.currentTarget.style.borderColor="#12365F";e.currentTarget.style.color="#12365F";}}
              onMouseOut={e =>{e.currentTarget.style.borderColor="#e5e7eb";e.currentTarget.style.color="#6b7280";}}>
              <Icon name="logOut" size={13} /> <span className="up-hide-sm">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="up-body" style={{ maxWidth:1400, margin:"0 auto", padding:"24px 24px 48px", width:"100%", flex:1 }}>

        {/* Profile banner */}
        <div className="up-banner" style={{
          background:"linear-gradient(135deg,#0A2342 0%,#12365F 55%,#1A4B80 100%)",
          borderRadius:14, padding:"22px 28px",
          display:"flex", alignItems:"center", justifyContent:"space-between",
          marginBottom:20, position:"relative", overflow:"hidden",
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:14, zIndex:1 }}>
            <div style={{ width:48, height:48, borderRadius:"50%",
              background:"rgba(255,255,255,0.15)", border:"2px solid rgba(255,255,255,0.25)",
              display:"flex", alignItems:"center", justifyContent:"center", color:"white", flexShrink:0 }}>
              <Icon name="user" size={20} />
            </div>
            <div>
              <p style={{ fontSize:"0.68rem", color:"rgba(255,255,255,0.55)", marginBottom:3, fontFamily:FONT }}>Hello,</p>
              <h2 style={{ fontSize:"1.15rem", fontWeight:600, color:"white", letterSpacing:"-0.3px", margin:"0 0 7px", fontFamily:FONT }}>{user?.full_name}</h2>
              <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                {[{icon:"shield",text:user?.role},{icon:"user",text:`NIK: ${user?.nik}`},
                  ...(user?.department?[{icon:"briefcase",text:user.department}]:[])
                ].map(b=>(
                  <span key={b.text} style={{ display:"inline-flex", alignItems:"center", gap:4,
                    padding:"2px 9px", borderRadius:20, background:"rgba(255,255,255,0.12)",
                    color:"rgba(255,255,255,0.80)", fontSize:"0.68rem", fontWeight:500, fontFamily:FONT }}>
                    <Icon name={b.icon} size={10}/>{b.text}
                  </span>
                ))}
              </div>
            </div>
          </div>
          {/* Decorative bg */}
          <div style={{ position:"absolute", right:24, top:"50%", transform:"translateY(-50%) rotate(-7deg)",
            opacity:0.08, pointerEvents:"none" }}>
            <img src={cereaMarkWhite} alt="" style={{ height:120, width:"auto" }} />
          </div>
        </div>

        {/* ══ What's Going On ══ */}
        <WhatsGoingOn announcements={announcements} onViewAll={() => navigate("/whats-going-on")} />

        {/* Error */}
        {error && (
          <div style={{ padding:"14px 18px", borderRadius:10, background:"#fef2f2",
            border:"1px solid #fecaca", color:"#b91c1c", fontSize:"0.82rem",
            display:"flex", alignItems:"center", gap:10, marginBottom:16, fontFamily:FONT }}>
            <Icon name="alertCircle" size={16} style={{ flexShrink:0 }} />
            <span>{error}</span>
            <button onClick={fetchAll} style={{ marginLeft:"auto", color:"#12365F", fontWeight:700,
              background:"none", border:"none", cursor:"pointer", textDecoration:"underline",
              fontSize:"0.82rem", fontFamily:FONT }}>Coba Lagi</button>
          </div>
        )}

        {/* ══ BARIS 1: Frequently Used ══ */}
        <div style={{ marginBottom:16 }}>
          <SectionRow
            title="Frequently Used"
            subtitle={frequentlyUsed.length > 0
              ? `Your ${frequentlyUsed.length} most frequently accessed applications`
              : "Apps you open will appear here automatically"}
            cards={frequentlyUsed}
            loading={loading}
            onOpen={handleAppOpen}
          />
        </div>

        {/* ══ BARIS 2: General Apps ══ */}
        <div style={{ marginBottom:16 }}>
          <SectionRow
            title="General Apps"
            subtitle="General applications, accessible to all roles"
            cards={generalApps}
            loading={loading}
            onOpen={handleAppOpen}
          />
        </div>

        {/* ══ BARIS 3: All Apps + subcategory filter ══ */}
        <div>
          <SectionRow
            title="All Apps"
            subtitle={`${allApps.length} applications available for role ${user?.role}`}
            cards={allApps}
            loading={loading}
            extraFilter={true}
            onOpen={handleAppOpen}
          />
        </div>
      </div>

      {/* Footer */}
      <PortalFooter />
    </div>
  );
}