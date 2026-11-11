// ================================================================
// FILE: frontend/src/components/icons/IconBadge.jsx
// Soft circular container for illustrated icons (Livin'-style menu).
//
//   <IconBadge name="wallet" />                       → 72px, blue tone
//   <IconBadge name="gauge" category="Dashboard" />   → tone from category
//   <IconBadge size={44} tone="teal" interactive name="bell" />
//   <IconBadge><img src=... /></IconBadge>            → custom content
//
// Hover: the badge scales + glows when it (interactive) or any
// ancestor with class "cx-tile" is hovered/focused. See index.css.
// ================================================================

import AppIcon from "./AppIcon";
import { CATEGORY_ICONS } from "./illustrations";

export default function IconBadge({
  name,
  category,
  tone,
  size = 72,
  iconScale = 0.6,
  interactive = false,
  title,
  className = "",
  style,
  children,
}) {
  const resolvedTone = tone || CATEGORY_ICONS[category]?.tone || "blue";
  const classes = [
    "cx-badge",
    `cx-badge--${resolvedTone}`,
    interactive && "cx-badge--interactive",
    className,
  ].filter(Boolean).join(" ");

  return (
    <div className={classes} style={{ "--cx-size": `${size}px`, ...style }}>
      {children ?? <AppIcon name={name} size={Math.round(size * iconScale)} title={title} />}
    </div>
  );
}
