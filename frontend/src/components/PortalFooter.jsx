// src/components/PortalFooter.jsx
// Footer seragam untuk semua halaman: hak cipta + tautan Kebijakan Privasi.

import { Link } from "react-router-dom";
import { COPYRIGHT_TEXT } from "../config/company";

export default function PortalFooter({ style = {} }) {
  return (
    <footer
      style={{
        borderTop: "1px solid #e5e7eb", background: "white",
        padding: "12px 24px", textAlign: "center",
        fontFamily: "Montserrat, sans-serif", fontSize: "0.65rem",
        color: "#9ca3af", fontWeight: 500,
        ...style,
      }}
    >
      <span>{COPYRIGHT_TEXT}</span>
      <span style={{ margin: "0 8px" }}>|</span>
      <Link
        to="/privacy"
        style={{ color: "var(--brand)", fontWeight: 600, textDecoration: "none" }}
        onMouseOver={(e) => (e.currentTarget.style.textDecoration = "underline")}
        onMouseOut={(e) => (e.currentTarget.style.textDecoration = "none")}
      >
        Kebijakan Privasi
      </Link>
    </footer>
  );
}
