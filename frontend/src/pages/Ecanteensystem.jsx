// src/pages/ECanteenSystem.jsx — Cerea eCanteen System

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Icon from "../components/Icon";
import { AppIcon, IconBadge } from "../components/icons";
import cereaLogo from "../assets/cerea-logo.png";
import PortalFooter from "../components/PortalFooter";
import PreviewBanner from "../components/PreviewBanner";
import { viewerFor } from "../preview";

/* ─── Constants ───────────────────────────────────────────────── */
const FONT = "Montserrat, sans-serif";
const BRAND = "#12365F";


/* ─── Sidebar nav items ───────────────────────────────────────── */
const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: "layoutDashboard" },
  { key: "tools",     label: "Tools",     icon: "wrench" },
  { key: "reports",   label: "Reports",   icon: "clipboard" },
];

/* ─── Mock data (demo only — not connected to a real canteen system) ── */
const CARD_INFO = {
  noKartu: "0000 1234 5678",
  saldo:   "Rp437.000,00",
  limit:   800000,
  used:    440000,
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const TRANSACTIONS_RAW = [
  { date: "28 Mei 2026", items: [
    { id:1, type:"in",  label:"Top up Saldo",  sub:"Monthly meal allowance", amount:437000 },
    { id:2, type:"out", label:"Kantin",         sub:"Canteen — Lunch",        amount:19000  },
    { id:3, type:"out", label:"Kantin",         sub:"Canteen — Coffee",       amount:12000  },
    { id:4, type:"in",  label:"Top up Saldo",  sub:"Allowance adjustment",   amount:25000  },
  ]},
];

const fmt = (n) =>
  "Rp" + n.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ─── Gauge Chart (SVG arc) ─────────────────────────────────── */
function GaugeChart({ pct }) {
  const R = 70, CX = 100, CY = 95;
  const startAngle = -180, endAngle = 0;
  const toRad = d => (d * Math.PI) / 180;
  const arcPath = (from, to, r) => {
    const x1 = CX + r * Math.cos(toRad(from));
    const y1 = CY + r * Math.sin(toRad(from));
    const x2 = CX + r * Math.cos(toRad(to));
    const y2 = CY + r * Math.sin(toRad(to));
    return `M ${x1} ${y1} A ${r} ${r} 0 ${Math.abs(to - from) > 180 ? 1 : 0} 1 ${x2} ${y2}`;
  };
  const fillAngle = startAngle + (endAngle - startAngle) * (pct / 100);
  return (
    <svg viewBox="0 0 200 100" style={{ width: "100%", maxWidth: 200 }}>
      {/* Track */}
      <path d={arcPath(-180, 0, R)} fill="none" stroke="#D6E6FD" strokeWidth={18} strokeLinecap="round" />
      {/* Fill */}
      <path d={arcPath(-180, fillAngle, R)} fill="none" stroke="#f59e0b" strokeWidth={18} strokeLinecap="round" />
      {/* Label */}
      <text x={CX} y={CY - 6} textAnchor="middle" fontSize="20" fontWeight="700" fill="#1a1a1a" fontFamily="Montserrat, sans-serif">
        {pct}%
      </text>
    </svg>
  );
}

/* ─── eCanteen Card widget ──────────────────────────────────── */
function ECanteenCardWidget({ noKartu, saldo }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{
      flex: "1 1 0", minWidth: 280,
      background: "linear-gradient(120deg,#0B1F3A 0%,#12365F 45%,#2563EB 100%)",
      borderRadius: 16, padding: "28px 28px 24px",
      display: "flex", flexDirection: "column", justifyContent: "space-between",
      position: "relative", overflow: "hidden", minHeight: 160,
    }}>
      {/* Decorative shapes (Cerea navy / blue / teal) */}
      <div aria-hidden="true" style={{ position:"absolute", right:-40, top:-60, width:220, height:220,
        borderRadius:"50%", background:"radial-gradient(circle,rgba(20,184,166,0.35),rgba(20,184,166,0) 70%)" }} />
      <div aria-hidden="true" style={{ position:"absolute", right:24, bottom:-18, opacity:0.18, pointerEvents:"none" }}>
        <AppIcon name="utensils" size={120} />
      </div>
      <div style={{ position:"relative" }}>
        <p style={{ fontSize:"0.68rem", color:"rgba(255,255,255,0.7)", margin:"0 0 4px", fontWeight:500, letterSpacing:"0.04em" }}>eCanteen Card</p>
        <p style={{ fontSize:"1.3rem", fontWeight:800, color:"white", margin:0, letterSpacing:"0.06em", fontFamily:"'DM Sans', sans-serif" }}>{noKartu}</p>
      </div>
      <div style={{ marginTop:20, position:"relative" }}>
        <p style={{ fontSize:"0.68rem", color:"rgba(255,255,255,0.7)", margin:"0 0 4px", fontWeight:500 }}>Saldo</p>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <p style={{ fontSize:"1.15rem", fontWeight:800, color:"white", margin:0, fontFamily:"'DM Sans', sans-serif", letterSpacing:"0.04em" }}>
            {show ? saldo : "Rp" + "•".repeat(10)}
          </p>
          <button onClick={() => setShow(v => !v)}
            style={{ background:"rgba(255,255,255,0.15)", border:"none", borderRadius:6, padding:"4px 6px",
              cursor:"pointer", display:"flex", alignItems:"center", color:"white", transition:"all .15s" }}
            onMouseOver={e => e.currentTarget.style.background="rgba(255,255,255,0.25)"}
            onMouseOut={e  => e.currentTarget.style.background="rgba(255,255,255,0.15)"}
          >
            <Icon name={show ? "eye" : "eyeOff"} size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Limit Saldo gauge card ────────────────────────────────── */
function LimitSaldoCard({ limit, used }) {
  const pct = Math.round((used / limit) * 100);
  return (
    <div style={{
      flex: "0 0 220px",
      background: "#E8F2FF", borderRadius: 16,
      border: "1px solid #C9DDFB",
      padding: "20px 20px 12px",
      display: "flex", flexDirection: "column", alignItems: "center",
    }}>
      <p style={{ fontSize:"0.75rem", fontWeight:700, color:"#6b7280", margin:"0 0 8px", alignSelf:"flex-start" }}>Limit Saldo</p>
      <GaugeChart pct={pct} />
      <p style={{ fontSize:"0.68rem", color:"#9ca3af", margin:"4px 0 0", fontWeight:500 }}>
        Rp{limit.toLocaleString("id-ID")}
      </p>
    </div>
  );
}

/* ─── Transaction row ───────────────────────────────────────── */
function TxRow({ tx }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 0",
      borderBottom:"1px solid #f9fafb" }}>
      {/* icon */}
      <div style={{
        width:40, height:40, borderRadius:"50%", flexShrink:0,
        background: tx.type==="in" ? "rgba(20,184,166,0.12)" : "rgba(239,68,68,0.10)",
        display:"flex", alignItems:"center", justifyContent:"center",
      }}>
        <Icon name={tx.type==="in" ? "arrowRight" : "arrowLeft"} size={16}
          color={tx.type==="in" ? "#0d9488" : "#ef4444"} />
      </div>
      {/* label */}
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:"0.80rem", fontWeight:700, color:"#1a1a1a", margin:0 }}>{tx.label}</p>
        <p style={{ fontSize:"0.65rem", color:"#9ca3af", margin:"2px 0 0", fontWeight:500 }}>{tx.sub}</p>
      </div>
      {/* amount */}
      <p style={{ fontSize:"0.82rem", fontWeight:700, margin:0,
        color: tx.type==="in" ? "#0d9488" : "#ef4444" }}>
        {tx.type==="in" ? "+" : "-"}{fmt(tx.amount)}
      </p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MAIN
════════════════════════════════════════════════════════════════ */
export default function ECanteenSystem() {
  const { user: authUser, logout } = useAuth();
  const user = viewerFor(authUser);   // previewed identity when an admin is in "Preview as user"
  const navigate = useNavigate();

  const [activeNav,   setActiveNav]   = useState("dashboard");
  const [activeMonth, setActiveMonth] = useState("May");

  const handleLogout = () => { logout(); navigate("/login", { replace: true }); };

  return (
    <div style={{ minHeight:"100vh", background:"#f5f5f5", fontFamily:FONT, display:"flex", flexDirection:"column" }}>
      <PreviewBanner />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=DM+Sans:wght@700;800&display=swap');
        * { box-sizing:border-box; }
        ::-webkit-scrollbar { width:6px; }
        ::-webkit-scrollbar-track { background:#f1f1f1; }
        ::-webkit-scrollbar-thumb { background:#d1d5db; border-radius:3px; }
      `}</style>

      {/* ── Top Header ── */}
      <header style={{
        position:"sticky", top:0, zIndex:40,
        background:"rgba(255,255,255,0.97)", backdropFilter:"blur(12px)",
        borderBottom:"1px solid #e5e7eb", boxShadow:"0 1px 6px rgba(0,0,0,0.04)",
      }}>
        <div style={{ maxWidth:1400, margin:"0 auto", padding:"10px 24px",
          display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, position:"relative" }}>

          {/* Left: back */}
          <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
            <button onClick={() => navigate("/user-portal")}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", borderRadius:8,
                border:"1.5px solid #e5e7eb", background:"white", cursor:"pointer",
                fontSize:"0.72rem", fontWeight:600, color:"#6b7280", fontFamily:FONT, transition:"all .15s" }}
              onMouseOver={e=>{ e.currentTarget.style.borderColor=BRAND; e.currentTarget.style.color=BRAND; }}
              onMouseOut={e =>{ e.currentTarget.style.borderColor="#e5e7eb"; e.currentTarget.style.color="#6b7280"; }}>
              <Icon name="arrowLeft" size={13} /> Back
            </button>
            <div style={{ width:1, height:20, background:"#e5e7eb" }} />
            <p style={{ fontSize:"0.70rem", color:"#9ca3af", fontWeight:500, margin:0 }}>Employee Portal</p>
          </div>

          {/* Center: Cerea logo */}
          <div style={{ position:"absolute", left:"50%", transform:"translateX(-50%)" }}>
            <img src={cereaLogo} alt="Cerea" style={{ height:30, width:"auto" }} />
          </div>

          {/* Right: user + logout */}
          <div style={{ display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
            <div style={{ textAlign:"right" }}>
              <p style={{ fontSize:"0.75rem", fontWeight:600, color:"#1a1a1a", margin:0, lineHeight:1.2 }}>{user?.full_name}</p>
              <p style={{ fontSize:"0.65rem", color:"#9ca3af", margin:0, marginTop:2 }}>NIK: {user?.nik}</p>
            </div>
            <button onClick={handleLogout}
              style={{ display:"flex", alignItems:"center", gap:5, padding:"7px 12px", borderRadius:8,
                border:"1.5px solid #e5e7eb", background:"white", cursor:"pointer",
                fontSize:"0.75rem", fontWeight:600, color:"#6b7280", fontFamily:FONT, transition:"all .15s" }}
              onMouseOver={e=>{ e.currentTarget.style.borderColor=BRAND; e.currentTarget.style.color=BRAND; }}
              onMouseOut={e =>{ e.currentTarget.style.borderColor="#e5e7eb"; e.currentTarget.style.color="#6b7280"; }}>
              <Icon name="logOut" size={13} /> Logout
            </button>
          </div>
        </div>
      </header>

      {/* ── Layout ── */}
      <div style={{ display:"flex", flex:1, maxWidth:1400, margin:"0 auto", width:"100%" }}>

        {/* ── Sidebar ── */}
        <aside style={{
          width:240, flexShrink:0, background:"white", borderRight:"1px solid #e5e7eb",
          display:"flex", flexDirection:"column", padding:"20px 0",
          position:"sticky", top:57, alignSelf:"flex-start", height:"calc(100vh - 57px)",
        }}>
          {/* App identity */}
          <div style={{ padding:"0 16px 20px", borderBottom:"1px solid #f3f4f6" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <IconBadge name="utensils" tone="teal" size={46} interactive />
              <div>
                <p style={{ fontSize:"0.82rem", fontWeight:700, color:"#1a1a1a", margin:0, fontFamily:"'DM Sans', sans-serif" }}>eCanteen System</p>
                <p style={{ fontSize:"0.62rem", color:BRAND, fontWeight:600, margin:0, marginTop:2 }}>General Apps</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ padding:"12px 10px", flex:1 }}>
            {NAV_ITEMS.map(item => {
              const active = activeNav === item.key;
              return (
                <button key={item.key} onClick={() => setActiveNav(item.key)}
                  style={{ width:"100%", display:"flex", alignItems:"center", gap:10,
                    padding:"10px 14px", borderRadius:10, marginBottom:2,
                    border:"none", cursor:"pointer", textAlign:"left", fontFamily:FONT,
                    background: active?"#EEF6FA":"transparent",
                    color: active?BRAND:"#6b7280",
                    fontWeight: active?700:500, fontSize:"0.78rem", transition:"all .15s" }}
                  onMouseOver={e=>{ if(!active) e.currentTarget.style.background="#f9fafb"; }}
                  onMouseOut={e =>{ if(!active) e.currentTarget.style.background="transparent"; }}
                >
                  <Icon name={item.icon} size={16} />
                  {item.label}
                  {active && <div style={{ marginLeft:"auto", width:4, height:4, borderRadius:"50%", background:BRAND }} />}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* ── Main ── */}
        <main style={{ flex:1, padding:"24px 28px 48px", minWidth:0 }}>

          {/* Breadcrumb */}
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:20 }}>
            <span onClick={() => navigate("/user-portal")}
              style={{ fontSize:"0.72rem", color:"#9ca3af", fontWeight:500, cursor:"pointer", transition:"color .15s" }}
              onMouseOver={e=>e.currentTarget.style.color=BRAND}
              onMouseOut={e =>e.currentTarget.style.color="#9ca3af"}>Portal</span>
            <span style={{ fontSize:"0.72rem", color:"#d1d5db" }}>›</span>
            <span style={{ fontSize:"0.72rem", color:BRAND, fontWeight:600 }}>eCanteen System</span>
          </div>

          {activeNav === "dashboard" && (
            <div style={{ display:"flex", flexDirection:"column", gap:20}}>

              {/* ── Card + Gauge row ── */}
              <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
                <ECanteenCardWidget noKartu={CARD_INFO.noKartu} saldo={CARD_INFO.saldo} />
                <LimitSaldoCard limit={CARD_INFO.limit} used={CARD_INFO.used} />
              </div>

              {/* ── All Transactions ── */}
              <div style={{ background:"white", borderRadius:16, border:"1px solid #e5e7eb",
                boxShadow:"0 1px 6px rgba(0,0,0,0.04)", overflow:"hidden" }}>

                {/* header */}
                <div style={{ padding:"18px 24px 0", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <h3 style={{ fontSize:"0.95rem", fontWeight:700, color:"#1a1a1a", margin:0, fontFamily:"'DM Sans', sans-serif" }}>
                    All Transactions
                  </h3>
                  <a href="#" style={{ fontSize:"0.72rem", fontWeight:600, color:BRAND, textDecoration:"none" }}
                    onMouseOver={e=>e.currentTarget.style.textDecoration="underline"}
                    onMouseOut={e =>e.currentTarget.style.textDecoration="none"}>
                    Lihat e-Statement
                  </a>
                </div>

                {/* month tabs */}
                <div style={{ padding:"14px 24px 0", display:"flex", gap:8, flexWrap:"wrap" }}>
                  {MONTHS.map(m => {
                    const active = activeMonth === m;
                    return (
                      <button key={m} onClick={() => setActiveMonth(m)}
                        style={{ padding:"5px 14px", borderRadius:20, fontSize:"0.68rem", fontWeight:600,
                          border: active?"none":"1px solid #e5e7eb",
                          background: active?BRAND:"white",
                          color: active?"white":"#6b7280",
                          cursor:"pointer", fontFamily:FONT, transition:"all .15s" }}
                        onMouseOver={e=>{ if(!active){ e.currentTarget.style.borderColor=BRAND; e.currentTarget.style.color=BRAND; }}}
                        onMouseOut={e =>{ if(!active){ e.currentTarget.style.borderColor="#e5e7eb"; e.currentTarget.style.color="#6b7280"; }}}
                      >{m}</button>
                    );
                  })}
                </div>

                {/* transaction list */}
                <div style={{ padding:"4px 24px 8px" }}>
                  {TRANSACTIONS_RAW.map(group => (
                    <div key={group.date}>
                      <p style={{ fontSize:"0.72rem", fontWeight:600, color:"#9ca3af", margin:"16px 0 4px" }}>{group.date}</p>
                      {group.items.map(tx => <TxRow key={tx.id} tx={tx} />)}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* Placeholder tabs */}
          {activeNav !== "dashboard" && (
            <div style={{ background:"white", borderRadius:14, border:"1px solid #e5e7eb",
              padding:"60px 32px", textAlign:"center", boxShadow:"0 1px 6px rgba(0,0,0,0.04)" }}>
              <IconBadge name={NAV_ITEMS.find(n=>n.key===activeNav)?.icon} size={72}
                style={{ margin:"0 auto 16px" }} />
              <h3 style={{ fontSize:"1rem", fontWeight:700, color:"#1a1a1a", margin:"0 0 6px", fontFamily:"'DM Sans', sans-serif" }}>
                {NAV_ITEMS.find(n=>n.key===activeNav)?.label}
              </h3>
              <p style={{ fontSize:"0.78rem", color:"#9ca3af", margin:0 }}>This section is under construction.</p>
            </div>
          )}
        </main>
      </div>

      {/* ── Footer ── */}
      <PortalFooter />

    </div>
  );
}