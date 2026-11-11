// ================================================================
// FILE: frontend/src/preview.js
// "Preview as user" — lets an admin see the portal exactly as a given
// role + department (or a specific user) would, without logging out.
//
// State lives in sessionStorage (this tab only) and is cleared on logout.
// The API client adds the preview params to the read endpoints; the
// server only honours them for admins (see get_viewer in backend/main.py).
//
// Shape:
//   { mode: "role", role: "User", department_id: 3, department_name: "Human Resources" }
//   { mode: "user", user_id: 7, full_name: "Agus Setiawan", nik: "2001",
//     role: "User", department_id: 1, department_name: "Information Technology" }
// ================================================================

const KEY = "cerea_preview";

function storedUserIsAdmin() {
  try { return JSON.parse(localStorage.getItem("user") || "null")?.role === "Admin"; }
  catch { return false; }
}

export function getPreview() {
  if (!storedUserIsAdmin()) return null;
  try { return JSON.parse(sessionStorage.getItem(KEY) || "null"); }
  catch { return null; }
}

export function startPreview(preview) {
  try { sessionStorage.setItem(KEY, JSON.stringify(preview)); } catch { /* storage blocked */ }
}

export function clearPreview() {
  try { sessionStorage.removeItem(KEY); } catch { /* storage blocked */ }
}

/** Query params the API expects for the active preview (empty object if none). */
export function previewParams(preview = getPreview()) {
  if (!preview) return {};
  if (preview.mode === "user") return { as_user_id: preview.user_id };
  return { as_role: preview.role, as_department_id: preview.department_id || 0 };
}

/** The identity portal pages should display: the previewed one, or the signed-in user. */
export function viewerFor(authUser, preview = getPreview()) {
  if (!preview) return authUser;
  return preview.mode === "user"
    ? { full_name: preview.full_name, nik: preview.nik, role: preview.role, department: preview.department_name }
    : { full_name: `${preview.role} (preview)`, nik: "—", role: preview.role, department: preview.department_name };
}

/** Short human label, e.g. "Agus Setiawan · User · IT" or "User · Human Resources". */
export function previewLabel(preview = getPreview()) {
  if (!preview) return "";
  const dept = preview.department_name || "No department";
  return preview.mode === "user"
    ? `${preview.full_name} · ${preview.role} · ${dept}`
    : `${preview.role} · ${dept}`;
}
