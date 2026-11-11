// src/components/Modal.jsx

import { useEffect } from "react";
import Icon from "./Icon";

// Peta size → maxWidth
const SIZE_MAP = {
  sm:  "380px",
  md:  "520px",   // default
  lg:  "680px",   // untuk form kartu & user
  xl:  "820px",
};

export default function Modal({ title, onClose, children, size = "md", maxWidth }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // maxWidth prop manual > size preset
  const width = maxWidth ?? SIZE_MAP[size] ?? SIZE_MAP.md;

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-box" style={{ maxWidth: width, width: "100%" }}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
          <h3 style={{ fontSize:"1.05rem", fontWeight:700, color:"var(--gray-800)", margin:0 }}>{title}</h3>
          <button
            onClick={onClose}
            style={{ width:30, height:30, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--gray-100)", color:"var(--gray-400)", transition:"all 0.15s", border:"none", cursor:"pointer", flexShrink:0 }}
            onMouseOver={(e) => { e.currentTarget.style.background="#fef2f2"; e.currentTarget.style.color="var(--brand)"; }}
            onMouseOut={(e)  => { e.currentTarget.style.background="var(--gray-100)"; e.currentTarget.style.color="var(--gray-400)"; }}
          >
            <Icon name="x" size={15} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}