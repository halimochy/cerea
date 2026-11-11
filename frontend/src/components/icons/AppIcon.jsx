// ================================================================
// FILE: frontend/src/components/icons/AppIcon.jsx
// Renders one illustrated icon from the Cerea set as inline SVG.
//
//   <AppIcon name="wallet" size={40} />
//
// Gradients get per-instance ids (React useId) so many icons on one
// page — including ones inside hidden fallback wrappers — never
// reference each other's <defs>.
// ================================================================

import { useId } from "react";
import { ILLUSTRATIONS, resolveIconName } from "./illustrations";

const FALLBACK = "apps";

export default function AppIcon({ name, size = 32, title, className = "", style }) {
  const uid = useId().replace(/:/g, "");
  const key = resolveIconName(name) || FALLBACK;
  const draw = ILLUSTRATIONS[key];

  const ids = { blue: `${uid}-b`, teal: `${uid}-t`, navy: `${uid}-n` };
  const g = { blue: `url(#${ids.blue})`, teal: `url(#${ids.teal})`, navy: `url(#${ids.navy})` };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={`cx-app-icon ${className}`.trim()}
      style={style}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
    >
      <defs>
        <linearGradient id={ids.blue} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3B82F6" />
          <stop offset="1" stopColor="#2563EB" />
        </linearGradient>
        <linearGradient id={ids.teal} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2DD4BF" />
          <stop offset="1" stopColor="#14B8A6" />
        </linearGradient>
        <linearGradient id={ids.navy} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1B3558" />
          <stop offset="1" stopColor="#0B1F3A" />
        </linearGradient>
      </defs>
      {draw(g)}
    </svg>
  );
}
