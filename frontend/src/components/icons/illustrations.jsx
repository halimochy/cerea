// ================================================================
// FILE: frontend/src/components/icons/illustrations.jsx
// Cerea illustrated icon set — custom SVG artwork per app / feature.
//
// Design grid
//   • viewBox 48×48, live area ≈ 8 → 40 (16% padding all round)
//   • Filled, rounded shapes. Detail strokes = 2.5–3.5, round caps
//   • Palette: navy #0B1F3A · blue #2563EB · teal #14B8A6 · white
//   • Gradients (g.blue / g.teal / g.navy) are subtle top→bottom
//     shades of the same hue, supplied per-instance by <AppIcon/>
//     so ids never collide on a page.
//
// Each entry: (g) => JSX, where g = { blue, teal, navy } fill urls.
// ================================================================

export const PALETTE = {
  navy: "#0B1F3A",
  blue: "#2563EB",
  teal: "#14B8A6",
  lightBlue: "#E8F2FF",
  lightTeal: "#E6FAF6",
  white: "#FFFFFF",
  // derived tints for layered "back sheet" depth
  blueSoft: "#A9C8FF",
  tealSoft: "#9BE7DC",
};

const { navy: N, blue: B, teal: T, white: W, blueSoft: BS, tealSoft: TS } = PALETTE;

const round = { strokeLinecap: "round", strokeLinejoin: "round", fill: "none" };

export const ILLUSTRATIONS = {
  /* ── Web & apps ─────────────────────────────────────────── */
  globe: (g) => (
    <>
      <circle cx="23" cy="25" r="14" fill={g.blue} />
      <ellipse cx="23" cy="25" rx="6" ry="14" stroke={W} strokeWidth="2.5" opacity=".9" {...round} />
      <path d="M9.9 20h26.2M9.9 30h26.2" stroke={W} strokeWidth="2.5" opacity=".9" {...round} />
      <circle cx="36" cy="13" r="5.5" fill={g.teal} stroke={W} strokeWidth="2" />
    </>
  ),

  browser: (g) => (
    <>
      <rect x="8" y="10" width="32" height="28" rx="5" fill={g.blue} />
      <path d="M8 15a5 5 0 0 1 5-5h22a5 5 0 0 1 5 5v3H8z" fill={g.navy} />
      <circle cx="13" cy="14" r="1.6" fill={T} />
      <circle cx="17.5" cy="14" r="1.6" fill={W} opacity=".7" />
      <circle cx="22" cy="14" r="1.6" fill={W} opacity=".7" />
      <rect x="12" y="22" width="14" height="3" rx="1.5" fill={W} />
      <rect x="12" y="28.5" width="9" height="3" rx="1.5" fill={W} opacity=".6" />
      <rect x="29" y="22" width="7" height="9.5" rx="2" fill={g.teal} />
    </>
  ),

  apps: (g) => (
    <>
      <rect x="9" y="9" width="13" height="13" rx="4" fill={g.navy} />
      <circle cx="32.5" cy="15.5" r="6.5" fill={g.teal} />
      <rect x="9" y="26" width="13" height="13" rx="4" fill={g.blue} />
      <rect x="26" y="26" width="13" height="13" rx="4" fill={g.blue} />
      <path d="M32.5 29.5v6M29.5 32.5h6" stroke={W} strokeWidth="2.5" {...round} />
    </>
  ),

  externalLink: (g) => (
    <>
      <rect x="8" y="14" width="24" height="25" rx="5" fill={g.blue} />
      <rect x="12" y="27" width="10" height="3" rx="1.5" fill={W} opacity=".6" />
      <rect x="12" y="32.5" width="14" height="3" rx="1.5" fill={W} opacity=".6" />
      <path d="M22 26 37 11" stroke={W} strokeWidth="7" {...round} />
      <path d="M22 26 37 11M28.5 10H38v9.5" stroke={T} strokeWidth="3.5" {...round} />
    </>
  ),

  /* ── Dashboards & analytics ─────────────────────────────── */
  layoutDashboard: (g) => (
    <>
      <rect x="8" y="9" width="32" height="30" rx="5" fill={g.navy} />
      <rect x="12" y="13" width="11" height="8" rx="2" fill={W} opacity=".95" />
      <rect x="12" y="24" width="11" height="11" rx="2" fill={g.blue} />
      <rect x="27" y="24" width="4" height="11" rx="2" fill={g.teal} />
      <rect x="33" y="17" width="4" height="18" rx="2" fill={g.teal} />
      <rect x="27" y="13" width="4" height="7" rx="2" fill={W} opacity=".35" />
    </>
  ),

  barChart2: (g) => (
    <>
      <rect x="10" y="22" width="7" height="15" rx="2.5" fill={g.blue} />
      <rect x="20.5" y="11" width="7" height="26" rx="2.5" fill={g.teal} />
      <rect x="31" y="17" width="7" height="20" rx="2.5" fill={g.blue} />
      <rect x="8" y="36" width="32" height="3.5" rx="1.75" fill={N} />
    </>
  ),

  pieChart: (g) => (
    <>
      <path d="M22 12a14 14 0 1 0 14 14H22z" fill={g.blue} />
      <path d="M26 8a14 14 0 0 1 14 14H26z" fill={g.teal} />
      <circle cx="22" cy="26" r="5" fill={W} />
      <circle cx="22" cy="26" r="2" fill={N} />
    </>
  ),

  activity: (g) => (
    <>
      <rect x="8" y="10" width="32" height="28" rx="7" fill={g.navy} />
      <path d="M12 25h5.5l3-7.5 5.5 13 3-7.5H36" stroke={T} strokeWidth="3" {...round} />
      <circle cx="36" cy="23" r="2.4" fill={W} />
    </>
  ),

  gauge: (g) => (
    <>
      <path d="M10 30a14 14 0 0 1 28 0" stroke={BS} strokeWidth="6" {...round} />
      <path d="M10 30a14 14 0 0 1 14-14" stroke={B} strokeWidth="6" {...round} />
      <path d="M24 16a14 14 0 0 1 9.9 4.1" stroke={T} strokeWidth="6" {...round} />
      <path d="M24 30l6.5-7" stroke={N} strokeWidth="3" {...round} />
      <circle cx="24" cy="30" r="4" fill={g.navy} />
      <circle cx="24" cy="30" r="1.5" fill={W} />
      <rect x="16" y="36" width="16" height="3.5" rx="1.75" fill={N} />
    </>
  ),

  wifi: () => (
    <>
      <path d="M10.5 22.5a19 19 0 0 1 27 0" stroke={N} strokeWidth="4.5" {...round} />
      <path d="M15.5 27.5a12 12 0 0 1 17 0" stroke={B} strokeWidth="4.5" {...round} />
      <path d="M20.3 32.3a5.3 5.3 0 0 1 7.4 0" stroke={T} strokeWidth="4.5" {...round} />
      <circle cx="24" cy="37.5" r="2.6" fill={T} />
    </>
  ),

  workflow: (g) => (
    <>
      <path d="M20 14h8M14 20v10a4 4 0 0 0 4 4M34 20v10a4 4 0 0 1-4 4" stroke={T} strokeWidth="3" {...round} />
      <rect x="8" y="8" width="12" height="12" rx="3.5" fill={g.blue} />
      <circle cx="34" cy="14" r="6" fill={g.teal} />
      <rect x="18" y="28" width="12" height="12" rx="3.5" fill={g.navy} />
      <circle cx="24" cy="34" r="2" fill={W} />
    </>
  ),

  /* ── Documents & forms ──────────────────────────────────── */
  fileText: (g) => (
    <>
      <rect x="15" y="8" width="23" height="28" rx="4" fill={BS} />
      <rect x="10" y="12" width="23" height="28" rx="4" fill={g.blue} />
      <rect x="14" y="17" width="8" height="3.5" rx="1.75" fill={g.teal} />
      <rect x="14" y="24" width="15" height="2.5" rx="1.25" fill={W} />
      <rect x="14" y="29" width="15" height="2.5" rx="1.25" fill={W} opacity=".75" />
      <rect x="14" y="34" width="9" height="2.5" rx="1.25" fill={W} opacity=".75" />
    </>
  ),

  form: (g) => (
    <>
      <rect x="10" y="8" width="28" height="32" rx="5" fill={g.blue} />
      <rect x="14" y="13" width="6" height="6" rx="1.8" fill={T} />
      <path d="M15.5 16l1.2 1.2 2-2.4" stroke={W} strokeWidth="1.8" {...round} />
      <rect x="23" y="14.75" width="11" height="2.5" rx="1.25" fill={W} />
      <rect x="14" y="21" width="6" height="6" rx="1.8" fill={T} />
      <path d="M15.5 24l1.2 1.2 2-2.4" stroke={W} strokeWidth="1.8" {...round} />
      <rect x="23" y="22.75" width="11" height="2.5" rx="1.25" fill={W} />
      <rect x="14.9" y="29.9" width="4.2" height="4.2" rx="1.2" stroke={W} strokeWidth="1.8" fill="none" />
      <rect x="23" y="30.75" width="7" height="2.5" rx="1.25" fill={W} opacity=".6" />
    </>
  ),

  clipboard: (g) => (
    <>
      <rect x="10" y="10" width="28" height="30" rx="5" fill={g.blue} />
      <rect x="14" y="15" width="20" height="21" rx="2.5" fill={W} />
      <rect x="18" y="7" width="12" height="7" rx="2.5" fill={g.navy} />
      <rect x="17.5" y="19.5" width="13" height="2.5" rx="1.25" fill={T} />
      <rect x="17.5" y="25" width="9" height="2.5" rx="1.25" fill={BS} />
      <rect x="17.5" y="30.5" width="11" height="2.5" rx="1.25" fill={BS} />
    </>
  ),

  checkSquare: (g) => (
    <>
      <rect x="9" y="10" width="29" height="29" rx="8" fill={g.blue} />
      <path d="M16 24.5l5.5 5.5L32 19" stroke={W} strokeWidth="4" {...round} />
      <circle cx="37" cy="11" r="5" fill={g.teal} stroke={W} strokeWidth="2" />
    </>
  ),

  folder: (g) => (
    <>
      <path d="M8 14a4 4 0 0 1 4-4h7.2a3 3 0 0 1 2.1.9L23.6 13H36a4 4 0 0 1 4 4v18H8z" fill={g.teal} />
      <rect x="12" y="15" width="24" height="12" rx="2" fill={W} />
      <path d="M8 22a3 3 0 0 1 3-3h26a3 3 0 0 1 3 3v13a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4z" fill={g.navy} />
      <rect x="13" y="32" width="9" height="3" rx="1.5" fill={T} />
    </>
  ),

  bookOpen: (g) => (
    <>
      <path d="M8 36c5-1 11-.5 16 3 5-3.5 11-4 16-3v3c-5-1-11-.5-16 3-5-3.5-11-4-16-3z" fill={N} />
      <path d="M24 14C19 10.5 13 10 8 11v25c5-1 11-.5 16 3z" fill={g.blue} />
      <path d="M24 14c5-3.5 11-4 16-3v25c-5-1-11-.5-16 3z" fill={g.teal} />
      <path d="M12 17.5c2.7-.4 5.3-.1 8 .9M12 23c2.7-.4 5.3-.1 8 .9M12 28.5c2-.3 3.8-.1 5.5.4" stroke={W} strokeWidth="2" opacity=".85" {...round} />
      <path d="M28 18.4c2.7-1 5.3-1.3 8-.9M28 23.9c2.7-1 5.3-1.3 8-.9" stroke={W} strokeWidth="2" opacity=".85" {...round} />
    </>
  ),

  idCard: (g) => (
    <>
      <rect x="7" y="12" width="34" height="25" rx="5" fill={g.navy} />
      <rect x="19" y="8" width="10" height="7" rx="2.5" fill={g.blue} />
      <circle cx="16.5" cy="22.5" r="3.8" fill={T} />
      <path d="M10.5 32a6 6 0 0 1 12 0z" fill={T} />
      <rect x="26" y="19" width="10" height="2.5" rx="1.25" fill={W} />
      <rect x="26" y="24.5" width="7" height="2.5" rx="1.25" fill={W} opacity=".7" />
      <rect x="26" y="30" width="10" height="2.5" rx="1.25" fill={B} />
    </>
  ),

  calendar: (g) => (
    <>
      <rect x="9" y="11" width="30" height="28" rx="5" fill={g.blue} />
      <path d="M9 16a5 5 0 0 1 5-5h20a5 5 0 0 1 5 5v4H9z" fill={g.navy} />
      <rect x="15.5" y="7" width="3.5" height="8" rx="1.75" fill={T} />
      <rect x="29" y="7" width="3.5" height="8" rx="1.75" fill={T} />
      <rect x="13.5" y="24" width="5" height="4" rx="1.3" fill={W} opacity=".9" />
      <rect x="21.5" y="24" width="5" height="4" rx="1.3" fill={W} opacity=".9" />
      <rect x="29.5" y="24" width="5" height="4" rx="1.3" fill={W} opacity=".9" />
      <rect x="13.5" y="31" width="5" height="4" rx="1.3" fill={W} opacity=".9" />
      <rect x="21.5" y="31" width="5" height="4" rx="1.3" fill={W} opacity=".9" />
      <rect x="29.5" y="31" width="5" height="4" rx="1.3" fill={T} />
    </>
  ),

  /* ── Communication ──────────────────────────────────────── */
  send: (g) => (
    <>
      <path d="M40 8 8 21.5l11.5 4.5z" fill={g.blue} stroke={B} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M40 8 19.5 26 25.5 40z" fill={g.navy} stroke={N} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M19.5 26l1.8 8.5 4.2-4.6z" fill={T} />
    </>
  ),

  mail: (g) => (
    <>
      <rect x="8" y="13" width="32" height="24" rx="5" fill={g.blue} />
      <path d="M10.5 16.5 24 26.5l13.5-10" stroke={W} strokeWidth="2.8" {...round} />
      <path d="M11 34l8.5-7.5M37 34l-8.5-7.5" stroke={W} strokeWidth="2" opacity=".45" {...round} />
      <circle cx="38" cy="13" r="5" fill={g.teal} stroke={W} strokeWidth="2" />
    </>
  ),

  bell: (g) => (
    <>
      <path d="M24 8a2 2 0 0 1 2 2v1.3A10 10 0 0 1 34 21v6.5l3 4a1.2 1.2 0 0 1-1 1.9H12a1.2 1.2 0 0 1-1-1.9l3-4V21a10 10 0 0 1 8-9.7V10a2 2 0 0 1 2-2z" fill={g.blue} />
      <path d="M20 36a4 4 0 0 0 8 0z" fill={N} />
      <path d="M17.5 20a6.5 6.5 0 0 1 3.5-5" stroke={W} strokeWidth="2.2" opacity=".75" {...round} />
      <circle cx="35" cy="12" r="5" fill={g.teal} stroke={W} strokeWidth="2" />
    </>
  ),

  helpCircle: (g) => (
    <>
      <path d="M12 26v-3a12 12 0 0 1 24 0v3" stroke={N} strokeWidth="3.5" {...round} />
      <rect x="8.5" y="22" width="8" height="12" rx="4" fill={g.blue} />
      <rect x="31.5" y="22" width="8" height="12" rx="4" fill={g.blue} />
      <path d="M35.5 34v.5a5 5 0 0 1-5 5H27" stroke={N} strokeWidth="2.5" {...round} />
      <rect x="21" y="36.5" width="7" height="5" rx="2.5" fill={g.teal} />
    </>
  ),

  /* ── People & organisation ──────────────────────────────── */
  user: (g) => (
    <>
      <path d="M11 38a13 13 0 0 1 26 0v.5a2 2 0 0 1-2 2H13a2 2 0 0 1-2-2z" fill={g.navy} />
      <circle cx="24" cy="16.5" r="7.5" fill={g.blue} />
      <path d="M24 26.5l2.6 3-2.6 6.5-2.6-6.5z" fill={T} />
    </>
  ),

  users: (g) => (
    <>
      <circle cx="31.5" cy="15.5" r="5" fill={g.teal} />
      <path d="M23.5 33a8.5 8.5 0 0 1 17 0v2a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" fill={g.teal} />
      <circle cx="19" cy="17.5" r="6" fill={g.blue} />
      <path d="M8 37a11 11 0 0 1 22 0v1a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2z" fill={g.navy} />
    </>
  ),

  briefcase: (g) => (
    <>
      <path d="M18 15v-3a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v3" stroke={B} strokeWidth="3" {...round} />
      <rect x="8" y="15" width="32" height="24" rx="5" fill={g.navy} />
      <rect x="8" y="24" width="32" height="4" fill={T} />
      <rect x="20.5" y="22" width="7" height="8" rx="2" fill={W} />
    </>
  ),

  building: (g) => (
    <>
      <rect x="27" y="18" width="13" height="22" rx="3" fill={g.blue} />
      <rect x="10" y="8" width="20" height="32" rx="3" fill={g.navy} />
      <rect x="14" y="13" width="4.5" height="3.5" rx="1" fill={W} />
      <rect x="21.5" y="13" width="4.5" height="3.5" rx="1" fill={W} />
      <rect x="14" y="19.5" width="4.5" height="3.5" rx="1" fill={W} />
      <rect x="21.5" y="19.5" width="4.5" height="3.5" rx="1" fill={W} />
      <rect x="14" y="26" width="4.5" height="3.5" rx="1" fill={W} opacity=".6" />
      <rect x="21.5" y="26" width="4.5" height="3.5" rx="1" fill={W} opacity=".6" />
      <path d="M17 40v-5.5a1.5 1.5 0 0 1 1.5-1.5h3a1.5 1.5 0 0 1 1.5 1.5V40z" fill={T} />
      <rect x="32" y="23" width="4" height="3" rx="1" fill={W} opacity=".8" />
      <rect x="32" y="29" width="4" height="3" rx="1" fill={W} opacity=".8" />
    </>
  ),

  shield: (g) => (
    <>
      <path d="M24 8l13 5v10c0 8.5-5.6 14.5-13 17-7.4-2.5-13-8.5-13-17V13z" fill={g.navy} />
      <path d="M24 8l13 5v10c0 8.5-5.6 14.5-13 17z" fill={g.teal} />
      <path d="M18.5 24l4 4 7.5-8" stroke={W} strokeWidth="3.5" {...round} />
    </>
  ),

  alertOctagon: (g) => (
    <>
      <polygon points="18.5 9 29.5 9 39 18.5 39 29.5 29.5 39 18.5 39 9 29.5 9 18.5" fill={g.navy} stroke={N} strokeWidth="2" strokeLinejoin="round" />
      <rect x="22" y="15" width="4" height="12.5" rx="2" fill={W} />
      <circle cx="24" cy="32.5" r="2.6" fill={T} />
    </>
  ),

  /* ── Finance & commerce ─────────────────────────────────── */
  wallet: (g) => (
    <>
      <rect x="12" y="8" width="22" height="14" rx="3" fill={g.teal} transform="rotate(-8 23 15)" />
      <rect x="8" y="15" width="32" height="24" rx="5" fill={g.navy} />
      <rect x="27" y="22.5" width="13" height="10" rx="3" fill={g.blue} />
      <circle cx="32.5" cy="27.5" r="2" fill={W} />
      <rect x="12" y="19" width="10" height="2.5" rx="1.25" fill={W} opacity=".35" />
    </>
  ),

  shoppingCart: (g) => (
    <>
      <path d="M13.5 15h24a1.5 1.5 0 0 1 1.45 1.9l-2.9 10.6a3 3 0 0 1-2.9 2.2H17.5z" fill={g.blue} />
      <path d="M22.5 18.5v7.5M29 18.5v7.5" stroke={W} strokeWidth="2" opacity=".7" {...round} />
      <path d="M7 10h4l5 21.5h19" stroke={N} strokeWidth="3" {...round} />
      <circle cx="18.5" cy="37" r="3" fill={N} />
      <circle cx="32" cy="37" r="3" fill={N} />
      <circle cx="37" cy="11" r="5.5" fill={g.teal} stroke={W} strokeWidth="2" />
      <path d="M37 8.5v5M34.5 11h5" stroke={W} strokeWidth="2" {...round} />
    </>
  ),

  tag: (g) => (
    <>
      <path d="M9 11a2 2 0 0 1 2-2h11.2a2 2 0 0 1 1.4.6l15.2 15.2a2 2 0 0 1 0 2.8L27.6 38.8a2 2 0 0 1-2.8 0L9.6 23.6A2 2 0 0 1 9 22.2z" fill={g.blue} />
      <circle cx="16" cy="16" r="3" fill={W} />
      <path d="M22.5 28.5l6-6M26.5 32.5l6-6" stroke={T} strokeWidth="3" {...round} />
    </>
  ),

  package: (g) => (
    <>
      <polygon points="24 8 39 15 24 22 9 15" fill={TS} stroke={TS} strokeWidth="1.5" strokeLinejoin="round" />
      <polygon points="9 15 24 22 24 40 9 33" fill={g.blue} stroke={B} strokeWidth="1.5" strokeLinejoin="round" />
      <polygon points="24 22 39 15 39 33 24 40" fill={g.navy} stroke={N} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M16.5 11.5l15 7v8" stroke={T} strokeWidth="3" {...round} />
    </>
  ),

  truck: (g) => (
    <>
      <rect x="6" y="12" width="22" height="20" rx="3" fill={g.blue} />
      <rect x="10" y="21" width="13" height="3" rx="1.5" fill={T} />
      <path d="M28 17h6.4a3 3 0 0 1 2.5 1.3l3.6 5.2a3 3 0 0 1 .5 1.7V32H28z" fill={g.navy} />
      <path d="M31 20.5h3.2l2.8 4H31z" fill={W} opacity=".9" />
      <circle cx="14" cy="34" r="4.2" fill={N} stroke={W} strokeWidth="2" />
      <circle cx="14" cy="34" r="1.5" fill={T} />
      <circle cx="33" cy="34" r="4.2" fill={N} stroke={W} strokeWidth="2" />
      <circle cx="33" cy="34" r="1.5" fill={T} />
    </>
  ),

  /* ── Operations & tools ─────────────────────────────────── */
  settings: (g) => (
    <>
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <rect key={a} x="20.5" y="7" width="7" height="9" rx="2.2" fill={N} transform={`rotate(${a} 24 24)`} />
      ))}
      <circle cx="24" cy="24" r="12" fill={g.navy} />
      <circle cx="24" cy="24" r="6.5" fill={g.teal} />
      <circle cx="24" cy="24" r="2.5" fill={W} />
    </>
  ),

  tool: (g) => (
    <g transform="rotate(45 24 24)">
      <rect x="21" y="19" width="6" height="22" rx="3" fill={g.navy} />
      <rect x="21" y="29" width="6" height="3" fill={T} />
      <path d="M21 7.6a8 8 0 1 0 6 0V13a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 21 13z" fill={g.blue} />
      <circle cx="24" cy="37" r="1.4" fill={W} />
    </g>
  ),

  flask: (g) => (
    <>
      <path d="M20.5 9h7v9.5l9.3 15.6a4 4 0 0 1-3.4 5.9H14.6a4 4 0 0 1-3.4-5.9l9.3-15.6z" fill={g.blue} />
      <path d="M15.4 27h17.2l4.2 7.1a4 4 0 0 1-3.4 5.9H14.6a4 4 0 0 1-3.4-5.9z" fill={g.teal} />
      <rect x="18" y="7" width="12" height="4" rx="2" fill={N} />
      <circle cx="20.5" cy="33" r="1.8" fill={W} opacity=".9" />
      <circle cx="26.5" cy="30.5" r="1.3" fill={W} opacity=".9" />
    </>
  ),

  droplets: (g) => (
    <>
      <path d="M21 9s-10 11.5-10 18.5a10 10 0 0 0 20 0C31 20.5 21 9 21 9z" fill={g.blue} />
      <path d="M33.5 21s-5.5 6-5.5 10a5.5 5.5 0 0 0 11 0c0-4-5.5-10-5.5-10z" fill={g.teal} stroke={W} strokeWidth="2" />
      <path d="M15.5 28a5.5 5.5 0 0 0 4 5" stroke={W} strokeWidth="2.5" opacity=".8" {...round} />
    </>
  ),

  anchor: (g) => (
    <>
      <circle cx="24" cy="11.5" r="3.5" stroke={N} strokeWidth="3" fill="none" />
      <path d="M24 15v23M18 20h12" stroke={N} strokeWidth="3.5" {...round} />
      <path d="M11 27a13 13 0 0 0 26 0" stroke={B} strokeWidth="3.5" {...round} />
      <circle cx="11" cy="27" r="3" fill={g.teal} />
      <circle cx="37" cy="27" r="3" fill={g.teal} />
    </>
  ),

  zap: (g) => (
    <>
      <circle cx="24" cy="24" r="15" fill={T} opacity=".16" />
      <polygon points="27 7 12 27 23 27 21 41 36 20 25 20" fill={g.blue} stroke={B} strokeWidth="2" strokeLinejoin="round" />
      <polygon points="27 7 12 27 23 27" fill={N} opacity=".18" />
    </>
  ),

  map: (g) => (
    <>
      <polygon points="9 13 18 9 18 35 9 39" fill={g.blue} stroke={B} strokeWidth="1.5" strokeLinejoin="round" />
      <polygon points="18 9 30 13 30 39 18 35" fill={BS} stroke={BS} strokeWidth="1.5" strokeLinejoin="round" />
      <polygon points="30 13 39 9 39 35 30 39" fill={g.blue} stroke={B} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M24 12a6 6 0 0 1 6 6c0 4.5-6 10.5-6 10.5S18 22.5 18 18a6 6 0 0 1 6-6z" fill={g.navy} />
      <circle cx="24" cy="18" r="2.3" fill={T} />
    </>
  ),

  utensils: (g) => (
    <>
      <path d="M9 33a15 15 0 0 1 30 0z" fill={g.blue} />
      <path d="M15 28.5a9.5 9.5 0 0 1 5.5-7" stroke={W} strokeWidth="2.5" opacity=".75" {...round} />
      <circle cx="24" cy="15.5" r="3" fill={g.teal} />
      <rect x="7" y="33" width="34" height="4.5" rx="2.25" fill={N} />
    </>
  ),

  home: (g) => (
    <>
      <path d="M12 21v15a3 3 0 0 0 3 3h18a3 3 0 0 0 3-3V21L24 11z" fill={g.blue} />
      <path d="M8 22.5 24 9.5l16 13" stroke={N} strokeWidth="3.5" {...round} />
      <path d="M20.5 39v-7a3.5 3.5 0 0 1 7 0v7z" fill={g.teal} />
    </>
  ),
};

/* Friendly / legacy names → canonical illustration */
export const ALIASES = {
  grid: "apps",
  application: "apps",
  website: "browser",
  webApp: "browser",
  dashboard: "layoutDashboard",
  analytics: "barChart2",
  document: "fileText",
  wrench: "tool",
  canteen: "utensils",
  helpdesk: "helpCircle",
};

/* Category → icon + badge tone (used by filters, previews & cards) */
export const CATEGORY_ICONS = {
  Website:     { icon: "browser",         tone: "teal" },
  Application: { icon: "apps",            tone: "blue" },
  Dashboard:   { icon: "layoutDashboard", tone: "teal" },
  Form:        { icon: "form",            tone: "blue" },
};

/* Options exposed to admins when picking a preset icon for a card */
export const ICON_OPTIONS = [
  "globe", "browser", "apps", "externalLink",
  "layoutDashboard", "barChart2", "pieChart", "activity", "gauge", "wifi", "workflow",
  "fileText", "form", "clipboard", "checkSquare", "folder", "bookOpen", "idCard", "calendar",
  "send", "mail", "bell", "helpCircle",
  "user", "users", "briefcase", "building", "shield", "alertOctagon",
  "wallet", "shoppingCart", "tag", "package", "truck",
  "settings", "tool", "flask", "droplets", "anchor", "zap", "map", "utensils", "home",
];

export function resolveIconName(name) {
  if (name && ILLUSTRATIONS[name]) return name;
  if (name && ALIASES[name]) return ALIASES[name];
  return null;
}
