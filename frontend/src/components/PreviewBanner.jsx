// ================================================================
// FILE: frontend/src/components/PreviewBanner.jsx
// Shown on portal pages while an admin is in "Preview as user" mode.
// ================================================================

import { useNavigate } from "react-router-dom";
import Icon from "./Icon";
import { getPreview, clearPreview, previewLabel } from "../preview";

export default function PreviewBanner() {
  const navigate = useNavigate();
  const preview = getPreview();
  if (!preview) return null;

  const exit = () => { clearPreview(); navigate("/admin-dashboard"); };
  const change = () => navigate("/admin-dashboard?preview=pick");

  const btn = {
    display:"inline-flex", alignItems:"center", gap:6, padding:"6px 12px", borderRadius:8,
    fontSize:"0.72rem", fontWeight:700, cursor:"pointer", whiteSpace:"nowrap",
    fontFamily:"Montserrat, sans-serif",
  };

  return (
    <div role="status" style={{
      position:"relative", zIndex:60,
      background:"linear-gradient(90deg,#0B1F3A,#12365F 60%,#0F5E73)",
      color:"white", fontFamily:"Montserrat, sans-serif",
      boxShadow:"0 2px 10px rgba(11,31,58,0.25)",
    }}>
      <div style={{ maxWidth:1400, margin:"0 auto", padding:"8px 24px",
        display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
        <span style={{ display:"inline-flex", alignItems:"center", justifyContent:"center",
          width:26, height:26, borderRadius:"50%", background:"rgba(20,184,166,0.25)", flexShrink:0 }}>
          <Icon name="eye" size={14} style={{ color:"#5EEAD4" }} />
        </span>
        <div style={{ flex:"1 1 220px", minWidth:0, lineHeight:1.3 }}>
          <p style={{ margin:0, fontSize:"0.78rem", fontWeight:700 }}>
            Previewing as <span style={{ color:"#5EEAD4" }}>{previewLabel(preview)}</span>
          </p>
          <p style={{ margin:0, fontSize:"0.64rem", color:"rgba(255,255,255,0.7)" }}>
            You see exactly what this {preview.mode === "user" ? "user" : "role and department"} sees. App clicks aren't counted.
          </p>
        </div>
        <button onClick={change} style={{ ...btn, background:"rgba(255,255,255,0.12)", color:"white", border:"1px solid rgba(255,255,255,0.25)" }}>
          Change
        </button>
        <button onClick={exit} style={{ ...btn, background:"white", color:"#0B1F3A", border:"none" }}>
          <Icon name="x" size={12} /> Exit preview
        </button>
      </div>
    </div>
  );
}
