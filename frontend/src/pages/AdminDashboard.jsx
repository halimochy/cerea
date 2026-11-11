// src/pages/AdminDashboard.jsx

import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { startPreview, clearPreview } from "../preview";
import { useAuth } from "../context/AuthContext";
import { usersApi, cardsApi, departmentsApi, announcementsApi, resolveUploadUrl } from "../api";
import Modal from "../components/Modal";
import Icon from "../components/Icon";
import { AppIcon, IconBadge, ICON_OPTIONS, CATEGORY_ICONS } from "../components/icons";
import cereaLogo from "../assets/cerea-logo.png";
import { COPYRIGHT_TEXT } from "../config/company";

// Priority constants (was in data/announcements.js)
const PRIORITY_ACCENT = { high:"#12365F", medium:"#f59e0b", low:"#22c55e" };
const PRIORITY_LABEL  = { high:"High",    medium:"Medium",   low:"Low"     };

const ALL_ROLES  = ["Admin", "CEO", "CFO", "DCFO", "GM/DGM", "User"];
const CATEGORIES = ["Website","Application", "Dashboard", "Form"];

/* ─── Shared styles ──────────────────────────────────────────── */
const IS = {
  input: { width:"100%", padding:"9px 12px", border:"1.5px solid var(--gray-200)", borderRadius:8, fontFamily:"inherit", fontSize:"0.88rem", color:"var(--gray-800)", background:"var(--gray-50)", outline:"none" },
  label: { display:"block", fontSize:"0.72rem", fontWeight:600, color:"var(--gray-500)", marginBottom:5, textTransform:"uppercase", letterSpacing:"0.05em" },
  btnPrimary: { padding:"9px 20px", borderRadius:8, background:"var(--brand)", color:"white", border:"none", cursor:"pointer", fontWeight:600, fontSize:"0.85rem" },
  btnGhost:   { padding:"5px 10px", borderRadius:6, border:"1.5px solid var(--gray-200)", background:"white", cursor:"pointer", fontSize:"0.78rem", fontWeight:600, color:"var(--gray-600)", display:"flex", alignItems:"center", gap:4 },
  btnDanger:  { padding:"5px 10px", borderRadius:6, border:"1.5px solid #fecaca", background:"#fef2f2", cursor:"pointer", fontSize:"0.78rem", fontWeight:600, color:"#b91c1c", display:"flex", alignItems:"center", gap:4 },
};

/* ─── SelectWrap ─────────────────────────────────────────────── */
function SelectWrap({ value, onChange, children, style = {}, minWidth }) {
  return (
    <div style={{ position:"relative", display:"inline-block", width: style.width ?? "100%", minWidth: minWidth ?? "unset" }}>
      <select value={value} onChange={onChange} style={{ ...IS.input, appearance:"none", WebkitAppearance:"none", MozAppearance:"none", cursor:"pointer", paddingRight:34, ...style, width:"100%" }}>
        {children}
      </select>
      <div style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", pointerEvents:"none", color:"var(--gray-400)", lineHeight:0 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
    </div>
  );
}

/* ─── RoleBadge ──────────────────────────────────────────────── */
function RoleBadge({ role }) {
  const m = { Admin:["#EEF6FA","#12365F","#C5DCE8"], CEO:["#faf5ff","#7e22ce","#e9d5ff"], CFO:["#eff6ff","#1d4ed8","#bfdbfe"], DCFO:["#ecfdf5","#065f46","#a7f3d0"], "GM/DGM":["#fff7ed","#c2410c","#fed7aa"], User:["#f3f4f6","#4b5563","#e5e7eb"] };
  const [bg,color,border] = m[role] ?? m.User;
  return <span style={{ display:"inline-block", padding:"2px 10px", borderRadius:20, fontSize:"0.70rem", fontWeight:700, background:bg, color, border:`1px solid ${border}` }}>{role}</span>;
}

/* ─── Toast ──────────────────────────────────────────────────── */
function Toast({ msg }) {
  return (
    <div style={{ position:"fixed", bottom:24, right:24, zIndex:300, background:"#1f2937", color:"white", padding:"11px 20px", borderRadius:10, fontSize:"0.85rem", fontWeight:500, boxShadow:"0 8px 24px rgba(0,0,0,.25)", display:"flex", alignItems:"center", gap:8 }}>
      <Icon name="check" size={15} style={{ color:"#4ade80" }} />{msg}
    </div>
  );
}

/* ─── ConfirmModal ───────────────────────────────────────────── */
function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <Modal title="Confirm" onClose={onCancel} size="sm">
      <p style={{ color:"var(--gray-600)", marginBottom:20, fontSize:"0.88rem", lineHeight:1.6 }}>{message}</p>
      <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
        <button onClick={onCancel} style={{ ...IS.btnGhost, padding:"8px 18px", border:"1.5px solid var(--gray-200)" }}>Cancel</button>
        <button onClick={onConfirm} style={{ padding:"8px 18px", borderRadius:8, background:"#dc2626", color:"white", border:"none", cursor:"pointer", fontSize:"0.85rem", fontWeight:600 }}>Yes, Delete</button>
      </div>
    </Modal>
  );
}

/* ════════════════════════════════════════════════════════════
   DEPARTMENT FORM MODAL
════════════════════════════════════════════════════════════ */
function DeptFormModal({ dept, onClose, onSaved }) {
  const isEdit = !!dept;
  const [name,   setName]   = useState(dept?.department_name ?? "");
  const [active, setActive] = useState(dept?.is_active ?? true);
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState("");

  async function handleSubmit(e) {
    e.preventDefault(); setErr("");
    if (!name.trim()) { setErr("Department name cannot be empty"); return; }
    setSaving(true);
    try {
      isEdit
        ? await departmentsApi.update(dept.id, { department_name: name.trim(), is_active: active })
        : await departmentsApi.create({ department_name: name.trim(), is_active: active });
      onSaved(); onClose();
    } catch (e) { setErr(e.response?.data?.detail ?? "An error occurred"); }
    finally { setSaving(false); }
  }

  return (
    <Modal title={isEdit ? "Edit Department" : "Add New Department"} onClose={onClose} size="sm">
      <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:14 }}>
        {err && <div style={{ padding:"9px 13px", borderRadius:8, background:"#fef2f2", color:"#b91c1c", fontSize:"0.82rem", border:"1px solid #fecaca" }}>⚠ {err}</div>}
        <div>
          <label style={IS.label}>Department Name</label>
          <input style={IS.input} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Information Technology" required />
        </div>
        {isEdit && (
          <div>
            <label style={IS.label}>Status</label>
            <div style={{ display:"flex", gap:10 }}>
              {[true, false].map(v => (
                <button key={String(v)} type="button" onClick={() => setActive(v)} style={{ flex:1, padding:"8px 0", borderRadius:8, cursor:"pointer", fontWeight:600, fontSize:"0.82rem", transition:"all .15s", background:active===v?(v?"#f0fdf4":"#fef2f2"):"white", border:`1.5px solid ${active===v?(v?"#86efac":"#fecaca"):"var(--gray-200)"}`, color:active===v?(v?"#065f46":"#b91c1c"):"var(--gray-500)" }}>
                  {v ? "✓ Active" : "✗ Inactive"}
                </button>
              ))}
            </div>
          </div>
        )}
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end", paddingTop:12, borderTop:"1px solid var(--gray-200)" }}>
          <button type="button" onClick={onClose} style={{ ...IS.btnGhost, padding:"9px 20px", border:"1.5px solid var(--gray-200)" }}>Cancel</button>
          <button type="submit" disabled={saving} style={{ ...IS.btnPrimary, opacity:saving?0.7:1, cursor:saving?"not-allowed":"pointer" }}>
            {saving ? "Saving…" : isEdit ? "Save" : "Add Department"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ════════════════════════════════════════════════════════════
   USER FORM MODAL
════════════════════════════════════════════════════════════ */
function UserFormModal({ user, departments, onClose, onSaved }) {
  const isEdit = !!user;
  const [form, setForm] = useState({
    nik:           user?.nik           ?? "",
    full_name:     user?.full_name     ?? "",
    role:          user?.role          ?? "User",
    department_id: user?.department_id ?? "",
    password:      "",
  });
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState("");
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault(); setErr("");
    setSaving(true);
    try {
      const payload = { ...form, department_id: form.department_id ? parseInt(form.department_id) : null };
      const dept = departments.find(d => d.id === payload.department_id);
      if (dept) payload.department = dept.department_name;
      if (isEdit) {
        const p = { full_name:payload.full_name, role:payload.role, department_id:payload.department_id, department:payload.department };
        if (form.password.trim()) p.password = form.password;
        await usersApi.update(user.id, p);
      } else {
        await usersApi.create(payload);
      }
      onSaved(); onClose();
    } catch (e) { setErr(e.response?.data?.detail ?? "Something went wrong"); }
    finally { setSaving(false); }
  }

  return (
    <Modal title={isEdit ? "Edit User Data" : "Add New User"} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:14 }}>
        {err && <div style={{ padding:"9px 13px", borderRadius:8, background:"#fef2f2", color:"#b91c1c", fontSize:"0.82rem", border:"1px solid #fecaca" }}>⚠ {err}</div>}
        <div>
          <label style={IS.label}>Employee NIK</label>
          <input style={{ ...IS.input, ...(isEdit && { background:"var(--gray-100)", color:"var(--gray-400)", cursor:"not-allowed" }) }} value={form.nik} onChange={e => set("nik", e.target.value)} disabled={isEdit} placeholder="e.g. 100123" required />
          {isEdit && <p style={{ fontSize:"0.70rem", color:"var(--gray-400)", marginTop:3 }}>NIK cannot be changed</p>}
        </div>
        <div>
          <label style={IS.label}>Full Name</label>
          <input style={IS.input} value={form.full_name} onChange={e => set("full_name", e.target.value)} placeholder="Full name of the employee" required />
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <div>
            <label style={IS.label}>Role</label>
            <SelectWrap value={form.role} onChange={e => set("role", e.target.value)}>
              {ALL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </SelectWrap>
          </div>
          <div>
            <label style={IS.label}>Department</label>
            {departments.length === 0
              ? <div style={{ ...IS.input, color:"#b91c1c", background:"#fef2f2", fontSize:"0.78rem", display:"flex", alignItems:"center", gap:6 }}><Icon name="alertCircle" size={13} />No active departments</div>
              : <SelectWrap value={form.department_id} onChange={e => set("department_id", e.target.value)}>
                  <option value="">— Select Department —</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.department_name}</option>)}
                </SelectWrap>
            }
            {departments.length === 0 && <p style={{ fontSize:"0.68rem", color:"#b91c1c", marginTop:3 }}>Please create a department in the 'Department Management' tab first</p>}
          </div>
        </div>
        <div>
          <label style={IS.label}>{isEdit ? "New Password (leave blank if not changing)" : "Password"}</label>
          <input style={IS.input} type="password" value={form.password} onChange={e => set("password", e.target.value)} placeholder={isEdit ? "•••••••• (optional)" : "Min. 6 characters"} required={!isEdit} />
        </div>
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end", paddingTop:12, borderTop:"1px solid var(--gray-200)" }}>
          <button type="button" onClick={onClose} style={{ ...IS.btnGhost, padding:"9px 20px", border:"1.5px solid var(--gray-200)" }}>Cancel</button>
          <button type="submit" disabled={saving} style={{ ...IS.btnPrimary, opacity:saving?0.7:1, cursor:saving?"not-allowed":"pointer" }}>
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Add User"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ════════════════════════════════════════════════════════════
   ICON SECTION — pilih sumber icon: preset / upload / auto-fetch / url
   icon_type: 'preset' | 'upload' | 'auto' | 'url'
   icon_value: nama icon preset, ATAU URL gambar (hasil upload/auto-fetch/url manual)
   "Upload Gambar" mengirim file ke backend (POST /uploads/icon), yang
   menyimpannya secara fisik di backend/uploads/icons/ dan mengembalikan
   URL publik — bukan disimpan di frontend/src/assets, karena folder src/*
   hanya dibaca saat build dan tidak bisa ditulis/disajikan saat runtime.
════════════════════════════════════════════════════════════ */
/* Icon ilustrasi untuk card: preset → nama icon, selain itu → icon kategori */
const cardIconName = (c) =>
  (c.icon_type === "preset" && c.icon_value) || c.icon_name || CATEGORY_ICONS[c.category]?.icon || "globe";
const isImageIcon = (c) =>
  (c.icon_type === "url" || c.icon_type === "upload" || c.icon_type === "auto") && !!c.icon_value;

/* ════════════════════════════════════════════════════════════
   IMAGE CROP MODAL — editor sederhana untuk gambar icon yang
   diunggah: bisa di-pan (drag) dan di-zoom (slider / scroll),
   lalu di-crop menjadi persegi sebelum diupload ke backend.
   WYSIWYG: apa yang terlihat di kanvas = hasil crop akhir.
════════════════════════════════════════════════════════════ */
const CROP_VIEW_SIZE   = 280;   // ukuran tampilan (CSS px)
const CROP_OUTPUT_SIZE = 640;   // resolusi hasil crop (px)
const ZOOM_MIN     = 0.5;       // batas zoom out — gambar jadi lebih kecil dari frame (ada ruang/space)
const ZOOM_MAX      = 4;        // batas zoom in
const ZOOM_DEFAULT  = 0.85;     // default: gambar utuh terlihat dengan sedikit ruang di sekitarnya

function ImageCropModal({ imageSrc, fileName, onCancel, onSave }) {
  const canvasRef  = useRef(null);
  const imgRef     = useRef(null);
  const dragRef    = useRef(null); // { startX, startY, startPanX, startPanY }
  const [ready, setReady]   = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [zoom, setZoom]     = useState(ZOOM_DEFAULT); // dikalikan ke fitScale (lihat getFitScale)
  const [pan, setPan]       = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);

  // Muat gambar
  useEffect(() => {
    setReady(false);
    setLoadError(false);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      setZoom(ZOOM_DEFAULT);
      setPan({ x: 0, y: 0 });
      setReady(true);
    };
    img.onerror = () => setLoadError(true);
    img.src = imageSrc;
    return () => { imgRef.current = null; };
  }, [imageSrc]);

  // Skala dasar: gambar utuh (fit) muat di dalam frame — dari sini user bisa zoom in
  const getFitScale = () => {
    const img = imgRef.current;
    if (!img) return 1;
    return CROP_OUTPUT_SIZE / Math.max(img.naturalWidth, img.naturalHeight);
  };

  const clampPan = (panX, panY, currentZoom) => {
    const img = imgRef.current;
    if (!img) return { x: 0, y: 0 };
    const scale = getFitScale() * currentZoom;
    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;
    const maxX = Math.max(0, (drawW - CROP_OUTPUT_SIZE) / 2);
    const maxY = Math.max(0, (drawH - CROP_OUTPUT_SIZE) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, panX)),
      y: Math.min(maxY, Math.max(-maxY, panY)),
    };
  };

  // Gambar ulang kanvas setiap kali zoom / pan / gambar berubah
  useEffect(() => {
    if (!ready) return;
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    const scale = getFitScale() * zoom;
    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;
    const cx = CROP_OUTPUT_SIZE / 2;
    const cy = CROP_OUTPUT_SIZE / 2;
    ctx.clearRect(0, 0, CROP_OUTPUT_SIZE, CROP_OUTPUT_SIZE);
    ctx.save();
    ctx.drawImage(img, cx - drawW / 2 + pan.x, cy - drawH / 2 + pan.y, drawW, drawH);
    ctx.restore();
  }, [ready, zoom, pan]);

  const ratio = CROP_OUTPUT_SIZE / CROP_VIEW_SIZE;

  const handlePointerDown = (e) => {
    if (!ready) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, startPanX: pan.x, startPanY: pan.y };
  };
  const handlePointerMove = (e) => {
    if (!dragRef.current) return;
    const dx = (e.clientX - dragRef.current.startX) * ratio;
    const dy = (e.clientY - dragRef.current.startY) * ratio;
    setPan(clampPan(dragRef.current.startPanX + dx, dragRef.current.startPanY + dy, zoom));
  };
  const handlePointerUp = () => { dragRef.current = null; };

  const handleZoomChange = (newZoomRaw) => {
    const newZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, newZoomRaw));
    setZoom(newZoom);
    setPan(p => clampPan(p.x, p.y, newZoom));
  };

  const handleWheel = (e) => {
    if (!ready) return;
    e.preventDefault();
    handleZoomChange(zoom - e.deltaY * 0.0015);
  };

  const handleReset = () => { setZoom(ZOOM_DEFAULT); setPan({ x: 0, y: 0 }); };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSaving(true);
    canvas.toBlob((blob) => {
      setSaving(false);
      if (!blob) return;
      const outName = (fileName || "icon").replace(/\.[^.]+$/, "") + "-cropped.png";
      const file = new File([blob], outName, { type: "image/png" });
      onSave(file);
    }, "image/png", 0.95);
  };

  return (
    <div style={{
      position:"fixed", inset:0, background:"rgba(17,17,17,0.55)", zIndex:1000,
      display:"flex", alignItems:"center", justifyContent:"center", padding:16,
    }}>
      <div style={{ background:"white", borderRadius:14, padding:20, width:"min(380px, 100%)", boxShadow:"0 20px 50px rgba(0,0,0,0.25)" }}>
        <div style={{ fontWeight:700, fontSize:"0.95rem", color:"var(--gray-700, #1f2937)", marginBottom:4 }}>
          Edit Gambar
        </div>
        <p style={{ fontSize:"0.72rem", color:"var(--gray-400)", marginBottom:12 }}>
          Geser untuk memindah posisi, gunakan slider (atau scroll) untuk zoom, lalu crop gambar sesuai kebutuhan.
        </p>

        {loadError ? (
          <div style={{ ...IS.input, color:"#b91c1c", background:"#fef2f2", textAlign:"center", padding:"24px 10px" }}>
            ✗ Gagal memuat gambar untuk diedit.
          </div>
        ) : (
          <>
            <div
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              onWheel={handleWheel}
              style={{
                width:CROP_VIEW_SIZE, height:CROP_VIEW_SIZE, margin:"0 auto",
                borderRadius:"50%", overflow:"hidden", background:"#f3f4f6",
                border:"2px dashed var(--brand)", cursor: ready ? "grab" : "wait",
                touchAction:"none", position:"relative",
              }}
            >
              <canvas
                ref={canvasRef}
                width={CROP_OUTPUT_SIZE}
                height={CROP_OUTPUT_SIZE}
                style={{ width:CROP_VIEW_SIZE, height:CROP_VIEW_SIZE, display:"block" }}
              />
              {!ready && (
                <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.75rem", color:"var(--gray-400)" }}>
                  Memuat...
                </div>
              )}
            </div>

            <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:16 }}>
              <span style={{ color:"var(--gray-400)", flexShrink:0, fontSize:"1rem", lineHeight:1, userSelect:"none" }}>−</span>
              <input
                type="range" min={ZOOM_MIN} max={ZOOM_MAX} step={0.01}
                value={zoom}
                disabled={!ready}
                onChange={e => handleZoomChange(parseFloat(e.target.value))}
                style={{ flex:1 }}
              />
              <span style={{ color:"var(--gray-400)", flexShrink:0, fontSize:"1rem", lineHeight:1, userSelect:"none" }}>+</span>
            </div>

            <div style={{ display:"flex", justifyContent:"center", marginTop:6 }}>
              <button type="button" onClick={handleReset} disabled={!ready} style={{
                background:"none", border:"none", color:"var(--brand)", fontSize:"0.72rem",
                fontWeight:600, cursor: ready ? "pointer" : "default", padding:4,
              }}>Reset</button>
            </div>
          </>
        )}

        <div style={{ display:"flex", gap:8, marginTop:16 }}>
          <button type="button" onClick={onCancel} style={{
            flex:1, padding:"9px 0", borderRadius:8, border:"1.5px solid var(--gray-200)",
            background:"white", color:"var(--gray-500)", fontWeight:600, fontSize:"0.8rem", cursor:"pointer",
          }}>Batal</button>
          <button type="button" onClick={handleSave} disabled={!ready || saving || loadError} style={{
            flex:1, padding:"9px 0", borderRadius:8, border:"none",
            background:"var(--brand)", color:"white", fontWeight:600, fontSize:"0.8rem",
            cursor: (!ready || saving || loadError) ? "default" : "pointer",
            opacity: (!ready || saving || loadError) ? 0.6 : 1,
          }}>{saving ? "Memproses..." : "Simpan"}</button>
        </div>
      </div>
    </div>
  );
}

function IconSection({ form, set }) {
  const [imgError, setImgError] = useState(false);
  const iconType = form.icon_type || "preset";

  // Crop editor state — { src, fileName } bila sedang membuka editor, null bila tertutup
  const [cropModal, setCropModal] = useState(null);
  const rawFileRef = useRef(null); // File asli terakhir dipilih user (untuk re-edit tanpa masalah CORS)

  // Auto-fetch state — favicon dideteksi dari form.link_url
  const [autoSrc, setAutoSrc] = useState(null);
  const [autoStatus, setAutoStatus] = useState("idle"); // idle|loading|ok|fail

  const useImage = (iconType === "url" || iconType === "upload" || iconType === "auto") && !!form.icon_value && !imgError;

  // Reset error saat icon_value / icon_type berubah
  useEffect(() => { setImgError(false); }, [form.icon_value, iconType]);
  useEffect(() => { setUploadStatus("idle"); setUploadError(""); }, [iconType]);

  // Auto-fetch favicon dari link_url saat tab "Auto-fetch" aktif (atau saat link_url berubah)
  useEffect(() => {
    if (iconType !== "auto") return;
    const url = form.link_url;
    if (!url || url === "https://") { setAutoStatus("idle"); setAutoSrc(null); return; }
    setAutoStatus("loading");
    try {
      const domain = new URL(url).hostname;
      const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
      const img = new Image();
      img.onload = () => {
        if (img.naturalWidth > 2) {
          setAutoSrc(favicon); setAutoStatus("ok");
          set("icon_value", favicon); // simpan hasil auto-fetch sebagai icon_value
        } else {
          setAutoStatus("fail"); setAutoSrc(null);
        }
      };
      img.onerror = () => { setAutoStatus("fail"); setAutoSrc(null); };
      img.src = favicon;
    } catch { setAutoStatus("fail"); setAutoSrc(null); }
  }, [iconType, form.link_url]);

  // Upload state
  const [uploadStatus, setUploadStatus] = useState("idle"); // idle|uploading|ok|fail
  const [uploadError, setUploadError] = useState("");

  const handleUploadFile = async (file) => {
    if (!file) return;

    const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
    const ALLOWED  = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml", "image/webp", "image/gif"];
    if (!ALLOWED.includes(file.type)) {
      setUploadStatus("fail");
      setUploadError("Format tidak didukung. Gunakan PNG, JPG, SVG, WEBP, atau GIF.");
      return;
    }
    if (file.size > MAX_SIZE) {
      setUploadStatus("fail");
      setUploadError("Ukuran file maksimal 2 MB.");
      return;
    }

    setUploadStatus("uploading");
    setUploadError("");
    try {
      const res = await cardsApi.uploadIcon(file);
      const url = res.data?.url; // mis. "/uploads/icons/xxxx.png"
      set("icon_value", url);
      setUploadStatus("ok");
    } catch (err) {
      setUploadStatus("fail");
      setUploadError(err.response?.data?.detail || "Upload gagal. Coba lagi.");
    }
  };

  // Dipanggil saat user memilih file baru lewat <input type="file">.
  // SVG & GIF dilewatkan langsung (vector/animasi tidak cocok dirender ulang lewat canvas),
  // sisanya (PNG/JPG/WEBP) dibuka dulu di editor crop/zoom sebelum diupload.
  const handleFileSelected = (file) => {
    if (!file) return;
    const MAX_SIZE = 2 * 1024 * 1024;
    const ALLOWED  = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml", "image/webp", "image/gif"];
    if (!ALLOWED.includes(file.type)) {
      setUploadStatus("fail");
      setUploadError("Format tidak didukung. Gunakan PNG, JPG, SVG, WEBP, atau GIF.");
      return;
    }
    if (file.size > MAX_SIZE) {
      setUploadStatus("fail");
      setUploadError("Ukuran file maksimal 2 MB.");
      return;
    }

    rawFileRef.current = file;

    if (file.type === "image/svg+xml" || file.type === "image/gif") {
      handleUploadFile(file);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setCropModal({ src: objectUrl, fileName: file.name, revoke: true });
  };

  // Buka editor untuk gambar yang SUDAH diupload (tombol "Edit" di atas preview)
  const handleEditExisting = () => {
    if (rawFileRef.current) {
      const objectUrl = URL.createObjectURL(rawFileRef.current);
      setCropModal({ src: objectUrl, fileName: rawFileRef.current.name, revoke: true });
    } else if (previewSrc) {
      // Gambar dari sesi sebelumnya (mis. saat edit card) — coba muat langsung dari URL server.
      setCropModal({ src: previewSrc, fileName: "icon", revoke: false });
    }
  };

  const closeCropModal = () => {
    if (cropModal?.revoke) URL.revokeObjectURL(cropModal.src);
    setCropModal(null);
  };

  const handleCropSave = (croppedFile) => {
    closeCropModal();
    handleUploadFile(croppedFile);
  };

  // Preview: untuk mode auto, pakai autoSrc; untuk url/upload pakai icon_value (di-resolve jika path relatif)
  const previewSrc = iconType === "auto"
    ? (autoStatus === "ok" ? autoSrc : null)
    : resolveUploadUrl(form.icon_value);
  const showPreviewImage = iconType === "auto"
    ? (autoStatus === "ok" && !!previewSrc)
    : useImage;

  return (
    <div style={{ border:"1.5px solid var(--gray-200)", borderRadius:10, padding:"14px 16px", background:"var(--gray-50)" }}>
      <label style={{ ...IS.label, marginBottom:10 }}>Icon Aplikasi</label>

      <div style={{ display:"flex", alignItems:"flex-start", gap:16 }}>
        {/* Preview bulat — badge yang sama seperti tampilan user */}
        <IconBadge category={form.category} size={64} style={{ position:"relative" }}>
          {showPreviewImage
            ? <img src={previewSrc} alt="" onError={() => setImgError(true)}
                style={{ width:"80%", height:"80%", objectFit:"cover" }} />
            : <AppIcon name={iconType === "preset" ? (form.icon_value || "globe") : CATEGORY_ICONS[form.category]?.icon} size={40} />
          }
          {iconType === "upload" && showPreviewImage && uploadStatus !== "uploading" && (
            <button
              type="button"
              title="Edit gambar (zoom / crop)"
              onClick={handleEditExisting}
              style={{
                position:"absolute", inset:0, width:"100%", height:"100%",
                border:"none", borderRadius:"50%", cursor:"pointer",
                background:"rgba(17,17,17,0)", color:"white", fontSize:"0.62rem", fontWeight:700,
                opacity:0, transition:"opacity 0.15s, background 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = 1; e.currentTarget.style.background = "rgba(17,17,17,0.45)"; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = 0; e.currentTarget.style.background = "rgba(17,17,17,0)"; }}
            >Edit</button>
          )}
        </IconBadge>

        <div style={{ flex:1, minWidth:0, display:"flex", flexDirection:"column", gap:10 }}>
          {/* Source tabs */}
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {[
              { key:"preset", label:"Pilih Icon" },
              { key:"upload", label:"Upload Gambar" },
              { key:"auto",   label:"Auto-fetch dari Link" },
              { key:"url",    label:"URL Gambar" },
            ].map(t => (
              <button key={t.key} type="button" onClick={() => set("icon_type", t.key)} style={{
                padding:"4px 10px", borderRadius:20, fontSize:"0.70rem", fontWeight:600,
                cursor:"pointer", border:`1.5px solid ${iconType===t.key?"var(--brand)":"var(--gray-200)"}`,
                background: iconType===t.key?"var(--brand)":"white",
                color: iconType===t.key?"white":"var(--gray-500)",
              }}>{t.label}</button>
            ))}
          </div>

          {iconType === "preset" && (
            <div>
              <label style={{ ...IS.label, marginBottom:6 }}>
                Icon <span style={{ textTransform:"none", letterSpacing:0, fontWeight:500, color:"var(--gray-400)" }}>— {form.icon_value || "globe"}</span>
              </label>
              <div role="listbox" aria-label="Pilih icon" style={{
                display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(44px,1fr))", gap:6,
                maxHeight:168, overflowY:"auto", padding:8, borderRadius:8,
                background:"white", border:"1.5px solid var(--gray-200)",
              }}>
                {ICON_OPTIONS.map(name => {
                  const selected = (form.icon_value || "globe") === name;
                  return (
                    <button key={name} type="button" role="option" aria-selected={selected} title={name}
                      onClick={() => set("icon_value", name)}
                      className="cx-tile"
                      style={{
                        display:"flex", alignItems:"center", justifyContent:"center",
                        padding:3, borderRadius:"50%",
                        outline: selected ? "2px solid var(--cx-blue)" : "none", outlineOffset:1,
                      }}>
                      <IconBadge name={name} category={form.category} size={38} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {iconType === "upload" && (
            <div>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp,image/gif"
                disabled={uploadStatus === "uploading"}
                onChange={e => { handleFileSelected(e.target.files?.[0]); e.target.value = ""; }}
                style={{ ...IS.input, padding:"6px 10px", cursor: uploadStatus === "uploading" ? "wait" : "pointer", opacity: uploadStatus === "uploading" ? 0.6 : 1 }}
              />
              <p style={{ fontSize:"0.68rem", color:"var(--gray-400)", marginTop:4 }}>
                Upload gambar logo (PNG/JPG/SVG/WEBP/GIF, maks 2 MB). File disimpan di server backend
                dan ditampilkan dalam lingkaran. Untuk PNG/JPG/WEBP, editor zoom &amp; crop akan terbuka otomatis
                setelah file dipilih.
              </p>
              {uploadStatus === "uploading" && (
                <p style={{ fontSize:"0.75rem", color:"var(--gray-500)", marginTop:4 }}>
                  ⏳ Mengunggah gambar...
                </p>
              )}
              {uploadStatus === "ok" && (
                <p style={{ fontSize:"0.75rem", color:"#065f46", marginTop:4, display:"flex", alignItems:"center", gap:8 }}>
                  ✓ Gambar berhasil diunggah
                  {showPreviewImage && (
                    <button type="button" onClick={handleEditExisting} style={{
                      background:"none", border:"none", color:"var(--brand)", fontWeight:600,
                      fontSize:"0.72rem", cursor:"pointer", padding:0,
                    }}>Edit gambar (zoom/crop)</button>
                  )}
                </p>
              )}
              {uploadStatus === "fail" && uploadError && (
                <p style={{ fontSize:"0.68rem", color:"#b91c1c", marginTop:4 }}>
                  ✗ {uploadError}
                </p>
              )}
              {imgError && (
                <p style={{ fontSize:"0.68rem", color:"#b91c1c", marginTop:4 }}>
                  ✗ Gambar gagal dimuat — fallback ke icon default akan digunakan.
                </p>
              )}
            </div>
          )}

          {iconType === "auto" && (
            <div>
              <div style={{ fontSize:"0.75rem", color: autoStatus==="ok" ? "#065f46" : autoStatus==="fail" ? "#b91c1c" : "var(--gray-500)" }}>
                {autoStatus === "loading" && "⏳ Mendeteksi logo dari URL aplikasi..."}
                {autoStatus === "ok"      && "✓ Logo berhasil dideteksi otomatis dari domain URL"}
                {autoStatus === "fail"    && "✗ Logo tidak terdeteksi dari URL ini — coba 'Upload Gambar', 'URL Gambar', atau 'Pilih Icon'"}
                {autoStatus === "idle"    && "Isi 'URL Link' aplikasi di atas terlebih dahulu agar logo terdeteksi otomatis"}
              </div>
              <p style={{ fontSize:"0.68rem", color:"var(--gray-400)", marginTop:4 }}>
                Logo diambil otomatis dari favicon domain link aplikasi. Cocok untuk aplikasi/website eksternal —
                kurang reliable untuk aplikasi internal tanpa favicon.
              </p>
            </div>
          )}

          {iconType === "url" && (
            <div>
              <input
                style={IS.input}
                value={form.icon_value || ""}
                onChange={e => set("icon_value", e.target.value)}
                placeholder="https://example.com/logo.png"
              />
              <p style={{ fontSize:"0.68rem", color:"var(--gray-400)", marginTop:4 }}>
                Masukkan URL gambar logo (PNG/SVG/JPG) secara manual.
              </p>
              {imgError && (
                <p style={{ fontSize:"0.68rem", color:"#b91c1c", marginTop:4 }}>
                  ✗ Gambar gagal dimuat dari URL ini — fallback ke icon default akan digunakan.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {cropModal && (
        <ImageCropModal
          imageSrc={cropModal.src}
          fileName={cropModal.fileName}
          onCancel={closeCropModal}
          onSave={handleCropSave}
        />
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   CARD FORM MODAL  ← department multi-selector ditambahkan di sini
════════════════════════════════════════════════════════════ */
function CardFormModal({ card, depts = [], onClose, onSaved }) {
  const isEdit = !!card;
  const [form, setForm] = useState({
    page_name:      card?.page_name      ?? "",
    target_department: card?.target_department ?? [],   // ← multi-select dept
    page_detail:    card?.page_detail    ?? "",
    link_url:       card?.link_url       ?? "https://",
    category:       card?.category       ?? "Application",
    target_roles:   card?.target_roles   ?? [],
    icon_type:      card?.icon_type      ?? "preset",   // 'preset' | 'upload' | 'url'
    icon_value:     card?.icon_value     ?? "globe",    // nama icon preset, atau URL gambar
    icon_color:     card?.icon_color     ?? "#12365F",
    sort_order:     card?.sort_order     ?? 0,
    is_general:     card?.is_general     ?? false,      // ← General Apps flag
  });
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState("");
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Toggle role aktif/nonaktif
  const toggleRole = r => setForm(p => ({
    ...p,
    target_roles: p.target_roles.includes(r)
      ? p.target_roles.filter(x => x !== r)
      : [...p.target_roles, r],
  }));

  // Toggle department aktif/nonaktif
  const toggleDept = id => setForm(p => ({
    ...p,
    target_department: p.target_department.includes(id)
      ? p.target_department.filter(x => x !== id)
      : [...p.target_department, id],
  }));

  async function handleSubmit(e) {
    e.preventDefault(); setErr("");
    if (!form.target_roles.length) { setErr("Select at least 1 target role"); return; }
    setSaving(true);
    try {
      isEdit ? await cardsApi.update(card.id, form) : await cardsApi.create(form);
      onSaved(); onClose();
    } catch (e) { setErr(e.response?.data?.detail ?? "An error occurred"); }
    finally { setSaving(false); }
  }

  const activeDepts = depts.filter(d => d.is_active);
  const selectedDeptNames = depts
    .filter(d => form.target_department.includes(d.id))
    .map(d => d.department_name);

  return (
    <Modal title={isEdit ? "Edit Application Card" : "Add New Application Card"} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:14 }}>
        {err && <div style={{ padding:"9px 13px", borderRadius:8, background:"#fef2f2", color:"#b91c1c", fontSize:"0.82rem", border:"1px solid #fecaca" }}>⚠ {err}</div>}

        {/* Application Name */}
        <div>
          <label style={IS.label}>Application Name</label>
          <input style={IS.input} value={form.page_name} onChange={e => set("page_name", e.target.value)} placeholder="e.g. HR Portal" required />
        </div>

        {/* ── Department multi-selector ── */}
        <div style={{ background:"#f0f9ff", borderRadius:10, padding:"14px 16px", border:"1.5px solid #bae6fd" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
            <label style={{ ...IS.label, color:"#0369a1", marginBottom:0 }}>
              🏢 Department Access
            </label>
            {form.target_department.length > 0 && (
              <button type="button" onClick={() => set("target_department", [])}
                style={{ fontSize:"0.68rem", color:"#0369a1", background:"none", border:"none", cursor:"pointer", textDecoration:"underline", padding:0 }}>
                Select All Departments
              </button>
            )}
          </div>
          <p style={{ fontSize:"0.70rem", color:"#0369a1", marginBottom:10, lineHeight:1.5 }}>
            Empty = <strong>All departments</strong> can access. Select specific ones to limit access by department.
          </p>

          {activeDepts.length === 0 ? (
            <p style={{ fontSize:"0.75rem", color:"var(--gray-400)", fontStyle:"italic" }}>
              No active departments — create one in the Department Management tab.
            </p>
          ) : (
            <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
              {activeDepts.map(d => {
                const on = form.target_department.includes(d.id);
                return (
                  <button key={d.id} type="button" onClick={() => toggleDept(d.id)} style={{
                    padding:"5px 13px", borderRadius:20, fontSize:"0.76rem", fontWeight:600,
                    cursor:"pointer", transition:"all .15s",
                    border: `1.5px solid ${on ? "#0284c7" : "#bae6fd"}`,
                    background: on ? "#0284c7" : "white",
                    color: on ? "white" : "#0369a1",
                    boxShadow: on ? "0 2px 6px rgba(2,132,199,0.25)" : "none",
                  }}>
                    {on ? "✓ " : ""}{d.department_name}
                  </button>
                );
              })}
            </div>
          )}

          <p style={{ fontSize:"0.70rem", marginTop:9, fontWeight:500,
            color: form.target_department.length === 0 ? "#065f46" : "#0369a1" }}>
            {form.target_department.length === 0
              ? "✓ All departments can view this card"
              : `Limited to (${form.target_department.length}): ${selectedDeptNames.join(", ")}`
            }
          </p>
        </div>

        {/* Deskripsi
        <div>
          <label style={IS.label}>Description</label>
          <input style={IS.input} value={form.page_detail} onChange={e => set("page_detail", e.target.value)} placeholder="Brief description" />
        </div> */}

        {/* URL */}
        <div>
          <label style={IS.label}>URL Link</label>
          <input style={IS.input} type="url" value={form.link_url} onChange={e => set("link_url", e.target.value)} required />
        </div>

        {/* Kategori & Urutan */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <div>
            <label style={IS.label}>Category</label>
            <SelectWrap value={form.category} onChange={e => set("category", e.target.value)}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </SelectWrap>
          </div>
          <div>
            <label style={IS.label}>Order</label>
            <input style={IS.input} type="number" min={0} value={form.sort_order} onChange={e => set("sort_order", parseInt(e.target.value)||0)} />
          </div>
        </div>

        {/* Icon Section — preset / upload / url */}
        <IconSection form={form} set={set} />

        {/* Role selector */}
        <div style={{ background:"var(--gray-50)", borderRadius:10, padding:"14px 16px", border:"1.5px solid var(--gray-200)" }}>
          <label style={{ ...IS.label, color:"var(--gray-700)", marginBottom:10 }}>🔐 Roles that can view this card</label>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {ALL_ROLES.map(r => {
              const on = form.target_roles.includes(r);
              return (
                <button key={r} type="button" onClick={() => toggleRole(r)} style={{
                  padding:"5px 14px", borderRadius:20, fontSize:"0.78rem", fontWeight:700, cursor:"pointer", transition:"all .15s",
                  border:`1.5px solid ${on?"var(--brand)":"var(--gray-200)"}`,
                  background:on?"var(--brand)":"white", color:on?"white":"var(--gray-500)",
                }}>
                  {on ? "✓ " : ""}{r}
                </button>
              );
            })}
          </div>
          <p style={{ fontSize:"0.72rem", marginTop:8, color:form.target_roles.length===0?"#b91c1c":"var(--gray-500)" }}>
            {form.target_roles.length===0 ? "⚠ Card will not appear in any portal" : "Visible for: "+form.target_roles.join(", ")}
          </p>
        </div>

        {/* General Apps toggle */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"12px 16px", borderRadius:10, border:`1.5px solid ${form.is_general?"#86efac":"var(--gray-200)"}`,
          background: form.is_general ? "#f0fdf4" : "var(--gray-50)", transition:"all .2s" }}>
          <div>
            <p style={{ fontSize:"0.82rem", fontWeight:700, color: form.is_general ? "#065f46" : "var(--gray-700)", margin:"0 0 2px" }}>
              📌 Tampilkan di General Apps
            </p>
            <p style={{ fontSize:"0.70rem", color: form.is_general ? "#065f46" : "var(--gray-400)", margin:0 }}>
              {form.is_general
                ? "Aplikasi ini akan muncul di section General Apps untuk semua user yang punya akses"
                : "Nonaktif — tidak muncul di section General Apps di User Portal"}
            </p>
          </div>
          <button type="button" onClick={() => set("is_general", !form.is_general)} style={{
            width:46, height:26, borderRadius:13, border:"none", cursor:"pointer", padding:0, flexShrink:0,
            background: form.is_general ? "#22c55e" : "#d1d5db", transition:"background .2s", position:"relative",
          }}>
            <span style={{
              position:"absolute", top:3, left: form.is_general ? 23 : 3,
              width:20, height:20, borderRadius:"50%", background:"white",
              boxShadow:"0 1px 4px rgba(0,0,0,.2)", transition:"left .2s",
            }} />
          </button>
        </div>

        <div style={{ display:"flex", gap:10, justifyContent:"flex-end", paddingTop:12, borderTop:"1px solid var(--gray-200)" }}>
          <button type="button" onClick={onClose} style={{ ...IS.btnGhost, padding:"9px 20px", border:"1.5px solid var(--gray-200)" }}>Cancel</button>
          <button type="submit" disabled={saving} style={{ ...IS.btnPrimary, opacity:saving?0.7:1 }}>
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Card"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ════════════════════════════════════════════════════════════
   ANNOUNCEMENT FORM MODAL
════════════════════════════════════════════════════════════ */
const PRIORITY_OPTIONS = ["high", "medium", "low"];

function AnnouncementFormModal({ ann, departments, onClose, onSaved }) {
  const isEdit = !!ann;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    announce_date:      ann?.announce_date      ?? new Date().toISOString().slice(0,10),
    activity:           ann?.activity           ?? "",
    description:        ann?.description        ?? "",
    link_url:           ann?.link_url           ?? "",
    link_label:         ann?.link_label         ?? "",
    priority:           ann?.priority           ?? "medium",
    target_roles:       ann?.target_roles       ?? [],
    target_departments: ann?.target_departments ?? [],   // list of dept IDs (int)
    is_active:          ann?.is_active          ?? true,
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const toggleRole = (role) =>
    set("target_roles", form.target_roles.includes(role)
      ? form.target_roles.filter(r => r !== role)
      : [...form.target_roles, role]);

  const toggleDept = (deptId) =>
    set("target_departments", form.target_departments.includes(deptId)
      ? form.target_departments.filter(d => d !== deptId)
      : [...form.target_departments, deptId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) await announcementsApi.update(ann.id, form);
      else        await announcementsApi.create(form);
      onSaved();
      onClose();
    } catch (err) {
      alert(err.response?.data?.detail ?? "Gagal menyimpan announcement");
    } finally {
      setSaving(false);
    }
  };

  const PRIORITY_COLORS = { high:"#12365F", medium:"#f59e0b", low:"#22c55e" };

  return (
    <Modal onClose={onClose} title={isEdit ? "Edit Announcement" : "New Announcement"} width={620}>
      <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:14 }}>

        {/* Date + Priority */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <div>
            <label style={IS.label}>Date <span style={{ color:"var(--brand)" }}>*</span></label>
            <input required type="date" value={form.announce_date?.slice?.(0,10) ?? ""}
              onChange={e => set("announce_date", e.target.value)}
              style={IS.input} />
          </div>
          <div>
            <label style={IS.label}>Priority</label>
            <div style={{ display:"flex", gap:6 }}>
              {PRIORITY_OPTIONS.map(p => (
                <button type="button" key={p} onClick={() => set("priority", p)} style={{
                  flex:1, padding:"7px 4px", borderRadius:8, fontSize:"0.72rem", fontWeight:700,
                  cursor:"pointer", transition:"all .15s", border:"1.5px solid",
                  borderColor: form.priority === p ? PRIORITY_COLORS[p] : "var(--gray-200)",
                  background:  form.priority === p ? PRIORITY_COLORS[p] + "18" : "white",
                  color:       form.priority === p ? PRIORITY_COLORS[p] : "var(--gray-500)",
                }}>
                  {PRIORITY_LABEL[p]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Activity */}
        <div>
          <label style={IS.label}>Activity / Title <span style={{ color:"var(--brand)" }}>*</span></label>
          <input required value={form.activity} onChange={e => set("activity", e.target.value)}
            style={IS.input} placeholder="e.g. System Maintenance" />
        </div>

        {/* Description */}
        <div>
          <label style={IS.label}>Description</label>
          <textarea value={form.description} onChange={e => set("description", e.target.value)}
            rows={3} style={{ ...IS.input, resize:"vertical", lineHeight:1.5 }}
            placeholder="Describe the announcement…" />
        </div>

        {/* Link Label + Link URL */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <div>
            <label style={IS.label}>Link Label</label>
            <input value={form.link_label} onChange={e => set("link_label", e.target.value)}
              style={IS.input} placeholder="e.g. View Document" />
          </div>
          <div>
            <label style={IS.label}>Link URL</label>
            <input value={form.link_url} onChange={e => set("link_url", e.target.value)}
              style={IS.input} placeholder="https://" />
          </div>
        </div>

        {/* Status toggle */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"10px 14px", borderRadius:10,
          border:`1.5px solid ${form.is_active ? "#86efac" : "var(--gray-200)"}`,
          background: form.is_active ? "#f0fdf4" : "var(--gray-50)" }}>
          <div>
            <p style={{ fontSize:"0.78rem", fontWeight:700, color: form.is_active ? "#065f46" : "var(--gray-600)", margin:"0 0 2px" }}>
              {form.is_active ? "✅ Active — visible to users" : "⏸ Draft — hidden from users"}
            </p>
            <p style={{ fontSize:"0.62rem", color:"var(--gray-400)", margin:0 }}>Toggle to publish or unpublish</p>
          </div>
          <button type="button" onClick={() => set("is_active", !form.is_active)} style={{
            width:46, height:26, borderRadius:13, border:"none", cursor:"pointer", padding:0,
            flexShrink:0, position:"relative",
            background: form.is_active ? "#22c55e" : "#d1d5db", transition:"background .2s",
          }}>
            <span style={{
              position:"absolute", top:3, left: form.is_active ? 23 : 3,
              width:20, height:20, borderRadius:"50%", background:"white",
              boxShadow:"0 1px 4px rgba(0,0,0,.2)", transition:"left .2s",
            }} />
          </button>
        </div>

        {/* Target Roles */}
        <div style={{ background:"var(--gray-50)", borderRadius:10, padding:"12px 14px", border:"1px solid var(--gray-200)" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
            <label style={{ ...IS.label, margin:0, fontSize:"0.78rem" }}>Target Roles</label>
            <span style={{ fontSize:"0.65rem", color:"var(--gray-400)" }}>
              {form.target_roles.length === 0 ? "🌐 Visible to all roles" : `${form.target_roles.length} role(s) selected`}
            </span>
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {ALL_ROLES.map(role => {
              const active = form.target_roles.includes(role);
              return (
                <button type="button" key={role} onClick={() => toggleRole(role)} style={{
                  padding:"4px 12px", borderRadius:20, fontSize:"0.68rem", fontWeight:600,
                  cursor:"pointer", transition:"all .15s",
                  border:`1.5px solid ${active ? "var(--brand)" : "var(--gray-200)"}`,
                  background: active ? "var(--brand-pale)" : "white",
                  color: active ? "var(--brand)" : "var(--gray-500)",
                }}>
                  {active ? "✓ " : ""}{role}
                </button>
              );
            })}
          </div>
          <p style={{ fontSize:"0.62rem", color:"var(--gray-400)", margin:"8px 0 0" }}>Leave empty to show to all roles</p>
        </div>

        {/* Target Departments — uses dept IDs */}
        <div style={{ background:"var(--gray-50)", borderRadius:10, padding:"12px 14px", border:"1px solid var(--gray-200)" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
            <label style={{ ...IS.label, margin:0, fontSize:"0.78rem" }}>Target Departments</label>
            <span style={{ fontSize:"0.65rem", color:"var(--gray-400)" }}>
              {form.target_departments.length === 0 ? "🌐 Visible to all departments" : `${form.target_departments.length} dept(s) selected`}
            </span>
          </div>
          {departments.length === 0 ? (
            <p style={{ fontSize:"0.70rem", color:"var(--gray-400)", margin:0 }}>No departments available</p>
          ) : (
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {departments.map(dept => {
                const active = form.target_departments.includes(dept.id);
                return (
                  <button type="button" key={dept.id} onClick={() => toggleDept(dept.id)} style={{
                    padding:"4px 12px", borderRadius:20, fontSize:"0.68rem", fontWeight:600,
                    cursor:"pointer", transition:"all .15s",
                    border:`1.5px solid ${active ? "#1d4ed8" : "var(--gray-200)"}`,
                    background: active ? "#eff6ff" : "white",
                    color: active ? "#1d4ed8" : "var(--gray-500)",
                  }}>
                    {active ? "✓ " : ""}{dept.department_name}
                  </button>
                );
              })}
            </div>
          )}
          <p style={{ fontSize:"0.62rem", color:"var(--gray-400)", margin:"8px 0 0" }}>Leave empty to show to all departments</p>
        </div>

        {/* Buttons */}
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end", paddingTop:12, borderTop:"1px solid var(--gray-200)" }}>
          <button type="button" onClick={onClose} style={{ ...IS.btnGhost, padding:"9px 20px", border:"1.5px solid var(--gray-200)" }}>Cancel</button>
          <button type="submit" disabled={saving} style={{ ...IS.btnPrimary, opacity: saving ? 0.7 : 1 }}>
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Publish Announcement"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ─── Preview as user — picker ───────────────────────────────── */
const PREVIEW_ROLES = ALL_ROLES.filter(r => r !== "Admin");

function PreviewPicker({ depts, users, onClose, onStart }) {
  const [mode,   setMode]   = useState("role");          // "role" | "user"
  const [role,   setRole]   = useState("User");
  const [deptId, setDeptId] = useState("");              // "" = no department
  const [userId, setUserId] = useState("");

  const previewUsers = users.filter(u => u.role !== "Admin");
  const deptName = (id) => depts.find(d => String(d.id) === String(id))?.department_name || "";

  const canStart = mode === "role" || !!userId;

  function start() {
    if (mode === "role") {
      onStart({ mode: "role", role, department_id: deptId ? Number(deptId) : null,
                department_name: deptId ? deptName(deptId) : "" });
    } else {
      const u = previewUsers.find(x => String(x.id) === String(userId));
      if (!u) return;
      onStart({ mode: "user", user_id: u.id, full_name: u.full_name, nik: u.nik, role: u.role,
                department_id: u.department_id, department_name: u.department_name || "" });
    }
  }

  const seg = (active) => ({
    flex:1, padding:"8px 10px", borderRadius:8, fontSize:"0.8rem", fontWeight:600, cursor:"pointer",
    border:"none", background: active ? "white" : "transparent",
    color: active ? "var(--brand)" : "var(--gray-500)",
    boxShadow: active ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
  });

  return (
    <Modal title="Preview as user" onClose={onClose} size="sm">
      <p style={{ fontSize:"0.8rem", color:"var(--gray-500)", marginTop:-10, marginBottom:16, lineHeight:1.5 }}>
        Open the portal exactly as someone else sees it: same apps, announcements and Frequently Used. Nothing is changed and clicks aren't counted.
      </p>

      <div role="tablist" style={{ display:"flex", gap:4, padding:4, borderRadius:10, background:"var(--gray-100)", marginBottom:16 }}>
        <button role="tab" aria-selected={mode==="role"} style={seg(mode==="role")} onClick={() => setMode("role")}>By role &amp; department</button>
        <button role="tab" aria-selected={mode==="user"} style={seg(mode==="user")} onClick={() => setMode("user")}>Specific user</button>
      </div>

      {mode === "role" ? (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div>
            <label style={IS.label}>Role</label>
            <SelectWrap value={role} onChange={e => setRole(e.target.value)}>
              {PREVIEW_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </SelectWrap>
          </div>
          <div>
            <label style={IS.label}>Department</label>
            <SelectWrap value={deptId} onChange={e => setDeptId(e.target.value)}>
              <option value="">No department</option>
              {depts.map(d => <option key={d.id} value={d.id}>{d.department_name}{d.is_active ? "" : " (inactive)"}</option>)}
            </SelectWrap>
          </div>
        </div>
      ) : (
        <div>
          <label style={IS.label}>User</label>
          <SelectWrap value={userId} onChange={e => setUserId(e.target.value)}>
            <option value="">Select a user…</option>
            {previewUsers.map(u => (
              <option key={u.id} value={u.id}>
                {u.full_name} · {u.nik} · {u.role}{u.department_name ? ` · ${u.department_name}` : ""}
              </option>
            ))}
          </SelectWrap>
          <p style={{ fontSize:"0.72rem", color:"var(--gray-400)", marginTop:6 }}>
            Uses this user's role, department and their own Frequently Used apps.
          </p>
        </div>
      )}

      <div style={{ display:"flex", justifyContent:"flex-end", gap:8, marginTop:20 }}>
        <button onClick={onClose} style={{ ...IS.btnGhost, padding:"9px 16px", fontSize:"0.85rem" }}>Cancel</button>
        <button onClick={start} disabled={!canStart}
          style={{ ...IS.btnPrimary, display:"flex", alignItems:"center", gap:6, opacity: canStart ? 1 : 0.5, cursor: canStart ? "pointer" : "not-allowed" }}>
          <Icon name="eye" size={14} /> Open preview
        </button>
      </div>
    </Modal>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN ADMIN DASHBOARD
════════════════════════════════════════════════════════════ */
export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Coming back to the dashboard always ends a preview, so admin data
  // (e.g. the full card list) is never filtered. Runs before the fetch effects.
  useState(() => clearPreview());
  const [showPreview, setShowPreview] = useState(() => searchParams.get("preview") === "pick");

  const closePreviewPicker = () => {
    setShowPreview(false);
    if (searchParams.has("preview")) setSearchParams({}, { replace: true });
  };
  const openPreview = (p) => { startPreview(p); navigate("/user-portal"); };

  const [activeTab, setActiveTab] = useState("depts");
  const [toast,     setToast]     = useState("");
  const [loading,   setLoading]   = useState(false);

  const [depts,      setDepts]      = useState([]);
  const [deptSearch, setDeptSearch] = useState("");
  const [deptModal,  setDeptModal]  = useState(null);
  const [delDept,    setDelDept]    = useState(null);

  const [users,      setUsers]      = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [userModal,  setUserModal]  = useState(null);
  const [delUser,    setDelUser]    = useState(null);

  const [cards,      setCards]      = useState([]);
  const [cardSearch, setCardSearch] = useState("");
  const [catFilter,  setCatFilter]  = useState("All");
  const [cardModal,  setCardModal]  = useState(null);
  const [delCard,    setDelCard]    = useState(null);

  // General Apps management state
  const [generalSearch,    setGeneralSearch]    = useState("");
  const [generalSaving,    setGeneralSaving]    = useState(null);  // cardId being saved

  // Announcements state — API-based
  const [announcements,     setAnnouncements]     = useState([]);
  const [annSearch,         setAnnSearch]         = useState("");
  const [annPriorityFilter, setAnnPriorityFilter] = useState("All");
  const [annModal,          setAnnModal]          = useState(null);   // null | "new" | ann object
  const [delAnn, setDelAnn] = useState(null);

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(""), 3200); };
  const activeDepts = depts.filter(d => d.is_active);

  const fetchDepts = useCallback(async () => {
    try { const r = await departmentsApi.list(false); setDepts(r.data); } catch {}
  }, []);
  const fetchUsers = useCallback(async () => {
    try { const r = await usersApi.list(); setUsers(r.data); } catch {}
  }, []);
  const fetchCards = useCallback(async () => {
    try { const r = await cardsApi.list(); setCards(r.data); } catch {}
  }, []);
  const fetchAnnouncements = useCallback(async () => {
    try { const r = await announcementsApi.listAll(); setAnnouncements(r.data); } catch {}
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchDepts(), fetchUsers(), fetchCards(), fetchAnnouncements()])
      .finally(() => setLoading(false));
  }, [fetchDepts, fetchUsers, fetchCards, fetchAnnouncements]);

  const confirmDelDept = async () => {
    try { await departmentsApi.delete(delDept.id); showToast(`"${delDept.department_name}" dihapus`); fetchDepts(); }
    catch (e) { showToast(e.response?.data?.detail ?? "Gagal menghapus"); }
    finally { setDelDept(null); }
  };
  const confirmDelUser = async () => {
    try { await usersApi.delete(delUser.id); showToast(`"${delUser.full_name}" dihapus`); fetchUsers(); fetchDepts(); }
    catch (e) { showToast(e.response?.data?.detail ?? "Gagal"); }
    finally { setDelUser(null); }
  };
  const confirmDelCard = async () => {
    try { await cardsApi.delete(delCard.id); showToast(`"${delCard.page_name}" dihapus`); fetchCards(); }
    catch (e) { showToast(e.response?.data?.detail ?? "Gagal"); }
    finally { setDelCard(null); }
  };

  // Toggle is_general flag — update state dari response API, TIDAK re-fetch
  const toggleGeneralApp = async (card) => {
    const currentVal = !!card.is_general;
    const newVal     = !currentVal;
    setGeneralSaving(card.id);
    // Optimistic: gerakkan UI seketika
    setCards(prev => prev.map(c => c.id === card.id ? { ...c, is_general: newVal } : c));
    try {
      const res = await cardsApi.update(card.id, { ...card, is_general: newVal });
      // Pakai data dari response server sebagai source of truth
      const updated = res?.data;
      if (updated) {
        setCards(prev => prev.map(c => c.id === card.id ? { ...c, ...updated } : c));
      }
      showToast(`"${card.page_name}" ${newVal ? "ditambahkan ke" : "dihapus dari"} General Apps ✓`);
    } catch (e) {
      // Rollback
      setCards(prev => prev.map(c => c.id === card.id ? { ...c, is_general: currentVal } : c));
      showToast(e.response?.data?.detail ?? "Gagal mengupdate");
    } finally {
      setGeneralSaving(null);
    }
  };

  const filteredDepts = depts.filter(d => d.department_name.toLowerCase().includes(deptSearch.toLowerCase()));
  const filteredUsers = users.filter(u => {
    const s = u.full_name.toLowerCase().includes(userSearch.toLowerCase()) || u.nik.includes(userSearch);
    const f = !deptFilter || String(u.department_id) === deptFilter;
    return s && f;
  });
  const filteredCards = cards.filter(c => {
    const s = c.page_name.toLowerCase().includes(cardSearch.toLowerCase());
    const f = catFilter === "All" || c.category === catFilter;
    return s && f;
  });

  const STATS = [
    { icon:"building",        label:"Departments",    value:depts.length,                              tone:"blue" },
    { icon:"users",           label:"Total Users",    value:users.length,                              tone:"teal" },
    { icon:"shield",          label:"Admins",          value:users.filter(u=>u.role==="Admin").length,  tone:"blue" },
    { icon:"apps",            label:"Total Cards",    value:cards.length,                              tone:"teal" },
    { icon:"bell",            label:"Announcements",  value:announcements.length,                      tone:"blue" },
  ];

  const TABS = [
    { id:"depts",         label:"Department Management",        icon:"building"       },
    { id:"users",         label:"User Management",              icon:"users"          },
    { id:"cards",         label:"Application Cards Management", icon:"grid"           },
    { id:"generalApps",   label:"General Apps Management",      icon:"globe"},
    { id:"announcements", label:"Announcements",                icon:"bell"           },
  ];

  return (
    <div style={{ minHeight:"100vh", background:"var(--gray-50)" }}>
      {toast && <Toast msg={toast} />}
      {showPreview && (
        <PreviewPicker depts={depts} users={users} onClose={closePreviewPicker} onStart={openPreview} />
      )}

      {/* Header */}
      <header className="portal-header">
        <div className="portal-header-inner">
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <img src={cereaLogo} alt="Cerea" style={{ height:30, width:"auto" }} />
            <div style={{ width:1, height:24, background:"var(--gray-200)" }} />
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:30, height:30, borderRadius:7, background:"var(--brand)", display:"flex", alignItems:"center", justifyContent:"center", color:"white" }}><Icon name="shield" size={14} /></div>
              <div>
                <p style={{ fontSize:"0.82rem", fontWeight:700, color:"var(--gray-800)", lineHeight:1.1 }}>Admin Dashboard</p>
                <p style={{ fontSize:"0.65rem", color:"var(--gray-400)" }}>Enterprise Management</p>
              </div>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <button onClick={() => setShowPreview(true)} title="See the portal as a role, department or specific user"
              style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:8, border:"none", cursor:"pointer", fontSize:"0.8rem", fontWeight:600, color:"white",
                background:"linear-gradient(135deg,#0B1F3A,#2563EB)", boxShadow:"0 2px 8px rgba(37,99,235,0.25)" }}>
              <Icon name="eye" size={14} /> Preview as user
            </button>
            <div style={{ textAlign:"right" }}>
              <p style={{ fontSize:"0.82rem", fontWeight:600, color:"var(--gray-700)" }}>{user?.full_name}</p>
              <p style={{ fontSize:"0.68rem", color:"var(--gray-400)" }}>NIK: {user?.nik}</p>
            </div>
            <button onClick={() => { logout(); navigate("/login",{replace:true}); }}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:8, border:"1.5px solid var(--gray-200)", background:"white", cursor:"pointer", fontSize:"0.8rem", fontWeight:600, color:"var(--gray-600)" }}
              onMouseOver={e=>{e.currentTarget.style.borderColor="var(--brand)";e.currentTarget.style.color="var(--brand)";}}
              onMouseOut={e=>{e.currentTarget.style.borderColor="var(--gray-200)";e.currentTarget.style.color="var(--gray-600)";}}>
              <Icon name="logOut" size={14} /> Logout
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth:1400, margin:"0 auto", padding:"24px 24px 48px" }}>
        <div style={{ marginBottom:22 }}>
          <h1 style={{ fontSize:"1.35rem", fontWeight:700, color:"var(--gray-800)" }}>Enterprise Management</h1>
          <p style={{ fontSize:"0.83rem", color:"var(--gray-500)", marginTop:3 }}>Manage departments, users, access roles, and application cards</p>
        </div>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:14, marginBottom:22 }}>
          {STATS.map(s => (
            <div key={s.label} style={{ background:"white", borderRadius:"var(--radius)", padding:"16px 18px", display:"flex", alignItems:"center", gap:12, boxShadow:"var(--shadow-sm)", border:"1px solid var(--gray-200)" }}>
              <IconBadge name={s.icon} tone={s.tone} size={46} interactive />
              <div>
                <p style={{ fontSize:"1.4rem", fontWeight:700, color:"var(--gray-800)", lineHeight:1 }}>{s.value}</p>
                <p style={{ fontSize:"0.70rem", color:"var(--gray-500)", marginTop:2 }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Panel */}
        <div style={{ background:"white", borderRadius:"var(--radius)", border:"1px solid var(--gray-200)", boxShadow:"var(--shadow-sm)", overflow:"hidden" }}>
          {/* Tabs */}
          <div style={{ borderBottom:"1px solid var(--gray-200)", display:"flex", padding:"0 20px", overflowX:"auto" }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ display:"flex", alignItems:"center", gap:7, padding:"14px 16px", background:"none", border:"none", cursor:"pointer", fontWeight:600, fontSize:"0.85rem", whiteSpace:"nowrap", marginBottom:-1, transition:"all .15s",
                borderBottom: activeTab===t.id ? "2.5px solid var(--brand)" : "2.5px solid transparent",
                color: activeTab===t.id ? "var(--brand)" : "var(--gray-500)" }}>
                <Icon name={t.icon} size={15} />{t.label}
              </button>
            ))}
          </div>

          <div style={{ padding:24 }}>

            {/* ════ TAB: DEPARTMENTS ════ */}
            {activeTab === "depts" && (
              <div>
                <div style={{ background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:10, padding:"10px 14px", marginBottom:16, display:"flex", alignItems:"center", gap:10, fontSize:"0.80rem", color:"#1d4ed8" }}>
                  <Icon name="alertCircle" size={15} style={{ flexShrink:0 }} />
                  <span><strong>Create a department first</strong> before adding users.</span>
                </div>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, gap:12, flexWrap:"wrap" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, background:"var(--gray-50)", border:"1.5px solid var(--gray-200)", borderRadius:8, padding:"7px 12px", flex:1, maxWidth:300 }}>
                    <Icon name="search" size={14} style={{ color:"var(--gray-400)", flexShrink:0 }} />
                    <input style={{ border:"none", outline:"none", background:"none", fontSize:"0.85rem", color:"var(--gray-700)", width:"100%" }} placeholder="Search departments..." value={deptSearch} onChange={e => setDeptSearch(e.target.value)} />
                  </div>
                  <button onClick={() => setDeptModal("new")} style={{ ...IS.btnPrimary, display:"flex", alignItems:"center", gap:7, whiteSpace:"nowrap" }}>
                    <Icon name="plus" size={15} /> Add Department
                  </button>
                </div>
                <div style={{ overflowX:"auto" }}>
                  <table className="admin-table">
                    <thead><tr><th>#</th><th>Name</th><th>Status</th><th>User Count</th><th>Created</th><th>Actions</th></tr></thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan={6} style={{ textAlign:"center", padding:40, color:"var(--gray-400)" }}>Loading…</td></tr>
                      ) : filteredDepts.length === 0 ? (
                        <tr><td colSpan={6} style={{ textAlign:"center", padding:40, color:"var(--gray-400)" }}>
                          {depts.length === 0 ? <span>No departments yet. <button onClick={() => setDeptModal("new")} style={{ color:"var(--brand)", fontWeight:700, background:"none", border:"none", cursor:"pointer", textDecoration:"underline" }}>Add one now</button></span> : "No search results"}
                        </td></tr>
                      ) : filteredDepts.map((d, i) => (
                        <tr key={d.id}>
                          <td style={{ color:"var(--gray-400)", fontSize:"0.78rem" }}>{i+1}</td>
                          <td style={{ fontWeight:600 }}>{d.department_name}</td>
                          <td>
                            <span style={{ padding:"2px 10px", borderRadius:20, fontSize:"0.70rem", fontWeight:700, background:d.is_active?"#f0fdf4":"#f3f4f6", color:d.is_active?"#065f46":"#6b7280", border:`1px solid ${d.is_active?"#86efac":"#e5e7eb"}` }}>
                              {d.is_active ? "✓ Active" : "✗ Inactive"}
                            </span>
                          </td>
                          <td><span style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:"0.82rem", color:"var(--gray-600)", fontWeight:600 }}><Icon name="users" size={13} style={{ color:"var(--gray-400)" }} /> {d.user_count ?? 0} user</span></td>
                          <td style={{ color:"var(--gray-400)", fontSize:"0.78rem" }}>{d.created_at ? new Date(d.created_at).toLocaleDateString("en-EN",{day:"2-digit",month:"short",year:"numeric"}) : "—"}</td>
                          <td>
                            <div style={{ display:"flex", gap:6 }}>
                              <button style={IS.btnGhost} onClick={() => setDeptModal(d)}><Icon name="edit" size={12} /> Edit</button>
                              <button
                                onClick={() => setDelDept(d)}
                                disabled={d.user_count > 0}
                                style={{ ...IS.btnDanger, ...(d.user_count > 0 ? { opacity:0.4, cursor:"not-allowed" } : {}) }}
                                title={d.user_count > 0 ? "Cannot be deleted — still has users" : "Delete"}
                              >
                                <Icon name="trash" size={12} /> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p style={{ marginTop:10, fontSize:"0.72rem", color:"var(--gray-400)" }}>{filteredDepts.length} dari {depts.length} departemen · {depts.filter(d=>d.is_active).length} aktif</p>
              </div>
            )}

            {/* ════ TAB: USERS ════ */}
            {activeTab === "users" && (
              <div>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, gap:12, flexWrap:"wrap" }}>
                  <div style={{ display:"flex", gap:10, flexWrap:"wrap", flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, background:"var(--gray-50)", border:"1.5px solid var(--gray-200)", borderRadius:8, padding:"7px 12px", minWidth:220 }}>
                      <Icon name="search" size={14} style={{ color:"var(--gray-400)", flexShrink:0 }} />
                      <input style={{ border:"none", outline:"none", background:"none", fontSize:"0.85rem", color:"var(--gray-700)", width:"100%" }} placeholder="Cari nama atau NIK…" value={userSearch} onChange={e => setUserSearch(e.target.value)} />
                    </div>
                    <SelectWrap value={deptFilter} onChange={e => setDeptFilter(e.target.value)} style={{ width:"auto", flex:"0 0 auto" }} minWidth="180px">
                      <option value="">All Departments</option>
                      {depts.map(d => <option key={d.id} value={String(d.id)}>{d.department_name}</option>)}
                    </SelectWrap>
                  </div>
                  <button onClick={() => setUserModal("new")} style={{ ...IS.btnPrimary, display:"flex", alignItems:"center", gap:7, whiteSpace:"nowrap" }}>
                    <Icon name="plus" size={15} /> Add User
                  </button>
                </div>
                {activeDepts.length === 0 && (
                  <div style={{ padding:"10px 14px", borderRadius:8, background:"#fff7ed", border:"1px solid #fed7aa", color:"#c2410c", fontSize:"0.80rem", marginBottom:14, display:"flex", gap:8, alignItems:"center" }}>
                    <Icon name="alertCircle" size={14} style={{ flexShrink:0 }} />
                    Create an active department first in the "Department Management" tab.
                  </div>
                )}
                <div style={{ overflowX:"auto" }}>
                  <table className="admin-table">
                    <thead><tr><th>#</th><th>NIK</th><th>Name</th><th>Role</th><th>Department</th><th>Registered</th><th>Actions</th></tr></thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan={7} style={{ textAlign:"center", padding:40, color:"var(--gray-400)" }}>Loading…</td></tr>
                      ) : filteredUsers.length === 0 ? (
                        <tr><td colSpan={7} style={{ textAlign:"center", padding:40, color:"var(--gray-400)" }}>No users found</td></tr>
                      ) : filteredUsers.map((u, i) => (
                        <tr key={u.id}>
                          <td style={{ color:"var(--gray-400)", fontSize:"0.78rem" }}>{i+1}</td>
                          <td style={{ fontFamily:"DM Mono,monospace", fontSize:"0.82rem", fontWeight:600 }}>{u.nik}</td>
                          <td style={{ fontWeight:500 }}>{u.full_name}</td>
                          <td><RoleBadge role={u.role} /></td>
                          <td>
                            {u.department_name
                              ? <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"2px 10px", borderRadius:20, background:"var(--gray-100)", color:"var(--gray-600)", fontSize:"0.75rem", fontWeight:500 }}><Icon name="building" size={11} />{u.department_name}</span>
                              : <span style={{ color:"var(--gray-300)", fontSize:"0.78rem" }}>—</span>}
                          </td>
                          <td style={{ color:"var(--gray-400)", fontSize:"0.78rem" }}>{u.created_at ? new Date(u.created_at).toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"}) : "—"}</td>
                          <td>
                            <div style={{ display:"flex", gap:6 }}>
                              <button style={IS.btnGhost} onClick={() => setUserModal(u)}><Icon name="edit" size={12} /> Edit</button>
                              <button style={IS.btnDanger} onClick={() => setDelUser(u)}><Icon name="trash" size={12} /> Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p style={{ marginTop:10, fontSize:"0.72rem", color:"var(--gray-400)" }}>{filteredUsers.length} of {users.length} users</p>
              </div>
            )}

            {/* ════ TAB: CARDS ════ */}
            {activeTab === "cards" && (
              <div>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, gap:12, flexWrap:"wrap" }}>
                  <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, background:"var(--gray-50)", border:"1.5px solid var(--gray-200)", borderRadius:8, padding:"7px 12px", minWidth:200 }}>
                      <Icon name="search" size={14} style={{ color:"var(--gray-400)" }} />
                      <input style={{ border:"none", outline:"none", background:"none", fontSize:"0.85rem", width:"100%" }} placeholder="Search cards…" value={cardSearch} onChange={e => setCardSearch(e.target.value)} />
                    </div>
                    <div style={{ display:"flex", gap:6 }}>
                      {["All",...CATEGORIES].map(c => (
                        <button key={c} onClick={() => setCatFilter(c)} style={{ padding:"6px 14px", borderRadius:20, fontSize:"0.78rem", fontWeight:700, cursor:"pointer", transition:"all .15s", border:`1.5px solid ${catFilter===c?"var(--brand)":"var(--gray-200)"}`, background:catFilter===c?"var(--brand)":"white", color:catFilter===c?"white":"var(--gray-600)" }}>{c}</button>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => setCardModal("new")} style={{ ...IS.btnPrimary, display:"flex", alignItems:"center", gap:7, whiteSpace:"nowrap" }}>
                    <Icon name="plus" size={15} /> Add Card
                  </button>
                </div>
                <div style={{ overflowX:"auto" }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>#</th><th>Name</th><th>Category</th>
                        <th>Target Role</th>
                        <th>Department</th>
                        <th>URL</th><th>Order</th><th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan={8} style={{ textAlign:"center", padding:40, color:"var(--gray-400)" }}>Loading…</td></tr>
                      ) : filteredCards.length === 0 ? (
                        <tr><td colSpan={8} style={{ textAlign:"center", padding:40, color:"var(--gray-400)" }}>No cards found</td></tr>
                      ) : filteredCards.map((c, i) => (
                        <tr key={c.id}>
                          <td style={{ color:"var(--gray-400)", fontSize:"0.78rem" }}>{i+1}</td>
                          <td>
                            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                              <IconBadge name={cardIconName(c)} category={c.category} size={36}>
                                {isImageIcon(c)
                                  ? <img src={resolveUploadUrl(c.icon_value)} alt="" style={{ width:"75%", height:"75%", objectFit:"cover" }} onError={e=>{e.target.style.display="none";}} />
                                  : undefined}
                              </IconBadge>
                              <div>
                                <p style={{ fontWeight:600, fontSize:"0.85rem" }}>{c.page_name}</p>
                                {/* <p style={{ fontSize:"0.70rem", color:"var(--gray-400)" }}>{(c.page_detail||"").slice(0,36)}{(c.page_detail?.length??0)>36?"…":""}</p> */}
                              </div>
                            </div>
                          </td>
                          <td>
                            <span style={{ padding:"2px 10px", borderRadius:20, fontSize:"0.70rem", fontWeight:700, background:c.category==="Dashboard"?"#eff6ff":c.category==="Form"?"#f0fdf4":"var(--brand-pale)", color:c.category==="Dashboard"?"#1d4ed8":c.category==="Form"?"#065f46":"var(--brand)" }}>{c.category}</span>
                          </td>
                          <td>
                            <div style={{ display:"flex", flexWrap:"wrap", gap:3, maxWidth:180 }}>
                              {(c.target_roles||[]).map(r => <span key={r} style={{ padding:"1px 7px", borderRadius:20, background:"var(--gray-100)", color:"var(--gray-600)", fontSize:"0.68rem", fontWeight:600 }}>{r}</span>)}
                            </div>
                          </td>
                          {/* Kolom Departemen */}
                          <td>
                            {(!c.target_department || c.target_department.length === 0)
                              ? <span style={{ fontSize:"0.70rem", color:"#065f46", background:"#f0fdf4", padding:"2px 9px", borderRadius:20, border:"1px solid #86efac", fontWeight:600 }}>All</span>
                              : <div style={{ display:"flex", flexWrap:"wrap", gap:3, maxWidth:160 }}>
                                  {c.target_department.map(id => {
                                    const d = depts.find(x => x.id === id);
                                    return d
                                      ? <span key={id} style={{ padding:"1px 7px", borderRadius:20, background:"#e0f2fe", color:"#0369a1", fontSize:"0.68rem", fontWeight:600 }}>{d.department_name.split(" ")[0]}</span>
                                      : null;
                                  })}
                                </div>
                            }
                          </td>
                          <td>
                            <a href={c.link_url} target="_blank" rel="noopener noreferrer" style={{ color:"var(--brand)", fontSize:"0.78rem", display:"flex", alignItems:"center", gap:4 }}>
                              <Icon name="externalLink" size={11} />
                              <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:120, display:"block" }}>{c.link_url.replace(/^https?:\/\//,"").slice(0,26)}</span>
                            </a>
                          </td>
                          <td style={{ textAlign:"center", color:"var(--gray-500)", fontSize:"0.82rem" }}>{c.sort_order}</td>
                          <td>
                            <div style={{ display:"flex", gap:6 }}>
                              <button style={IS.btnGhost} onClick={() => setCardModal(c)}><Icon name="edit" size={12} /> Edit</button>
                              <button style={IS.btnDanger} onClick={() => setDelCard(c)}><Icon name="trash" size={12} /> Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p style={{ marginTop:10, fontSize:"0.72rem", color:"var(--gray-400)" }}>{filteredCards.length} of {cards.length} cards</p>
              </div>
            )}

            {/* ════ TAB: GENERAL APPS ════ */}
            {activeTab === "generalApps" && (
              <div>
                {/* Info banner */}
                <div style={{ background:"#f0fdf4", border:"1px solid #86efac", borderRadius:10, padding:"10px 14px", marginBottom:16, display:"flex", alignItems:"flex-start", gap:10, fontSize:"0.80rem", color:"#065f46" }}>
                  <Icon name="layoutDashboard" size={16} style={{ flexShrink:0, marginTop:1 }} />
                  <div>
                    <strong>General Apps Management</strong>
                    <p style={{ margin:"3px 0 0", fontSize:"0.73rem", color:"#065f46" }}>
                      Select the applications you want to display in the <b>General Apps</b> section of the User Portal. Applications that are enabled will be visible to all users who have access based on their role and department.
                    </p>
                  </div>
                </div>

                {/* Search + count */}
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, gap:12, flexWrap:"wrap" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, background:"var(--gray-50)", border:"1.5px solid var(--gray-200)", borderRadius:8, padding:"7px 12px", flex:1, maxWidth:320 }}>
                    <Icon name="search" size={14} style={{ color:"var(--gray-400)", flexShrink:0 }} />
                    <input style={{ border:"none", outline:"none", background:"none", fontSize:"0.85rem", width:"100%" }} placeholder="Search applications…" value={generalSearch} onChange={e => setGeneralSearch(e.target.value)} />
                    {generalSearch && <button onClick={() => setGeneralSearch("")} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--gray-400)", padding:0, lineHeight:0 }}><Icon name="x" size={12} /></button>}
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ padding:"3px 12px", borderRadius:20, background:"#f0fdf4", color:"#065f46", border:"1px solid #86efac", fontSize:"0.72rem", fontWeight:700 }}>
                      {cards.filter(c => c.is_general).length} active
                    </span>
                    <span style={{ fontSize:"0.72rem", color:"var(--gray-400)" }}>from {cards.length} total applications</span>
                  </div>
                </div>

                {/* App grid checklist */}
                {loading ? (
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:10 }}>
                    {Array(6).fill(0).map((_,i) => <div key={i} style={{ height:80, borderRadius:10, background:"var(--gray-100)" }} />)}
                  </div>
                ) : (
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:10 }}>
                    {cards
                      .filter(c => !generalSearch || c.page_name.toLowerCase().includes(generalSearch.toLowerCase()))
                      .sort((a, b) => (b.is_general ? 1 : 0) - (a.is_general ? 1 : 0) || a.page_name.localeCompare(b.page_name))
                      .map(c => {
                        const isSaving  = generalSaving === c.id;
                        const isGeneral = !!c.is_general;   // normalize null/0/1 → boolean
                        return (
                          <div key={c.id} style={{
                            display:"flex", alignItems:"center", gap:12,
                            padding:"12px 14px", borderRadius:10,
                            border:`1.5px solid ${isGeneral ? "var(--gray-200)" : "var(--gray-200)"}`,
                            background: isGeneral ? "white" : "white",
                            transition:"all .2s", opacity: isSaving ? 0.6 : 1,
                          }}>
                            {/* App icon */}
                            <IconBadge name={cardIconName(c)} category={c.category} size={38}
                              style={{ opacity: isGeneral ? 1 : 0.55, filter: isGeneral ? "none" : "grayscale(0.6)", transition:"opacity .2s, filter .2s" }}>
                              {isImageIcon(c)
                                ? <img src={resolveUploadUrl(c.icon_value)} alt="" style={{ width:"60%", height:"60%", objectFit:"contain" }} onError={e=>{e.target.style.display="none";}} />
                                : undefined}
                            </IconBadge>

                            {/* App info */}
                            <div style={{ flex:1, minWidth:0 }}>
                              <p style={{ fontSize:"0.82rem", fontWeight:700, color:"var(--gray-800)", margin:"0 0 2px", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{c.page_name}</p>
                              <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                                <span style={{ padding:"1px 7px", borderRadius:20, fontSize:"0.60rem", fontWeight:600,
                                  background:"var(--brand-pale)", color:"var(--brand)" }}>{c.category}</span>
                                <span style={{ fontSize:"0.60rem", color:"var(--gray-400)" }}>{(c.target_roles||[]).join(", ")}</span>
                              </div>
                            </div>

                            {/* Toggle switch */}
                            <button
                              onClick={() => toggleGeneralApp(c)}
                              disabled={isSaving}
                              title={isGeneral ? "Deactivate from General Apps" : "Activate in General Apps"}
                              style={{
                                width:46, height:26, borderRadius:13, border:"none",
                                cursor: isSaving ? "not-allowed" : "pointer",
                                padding:0, flexShrink:0, position:"relative",
                                background: isGeneral ? "#22c55e" : "#d1d5db", transition:"background .2s",
                              }}>
                              <span style={{
                                position:"absolute", top:3, left: isGeneral ? 23 : 3,
                                width:20, height:20, borderRadius:"50%", background:"white",
                                boxShadow:"0 1px 4px rgba(0,0,0,.2)", transition:"left .2s",
                              }} />
                            </button>
                          </div>
                        );
                      })}
                  </div>
                )}
                {cards.filter(c => !generalSearch || c.page_name.toLowerCase().includes(generalSearch.toLowerCase())).length === 0 && !loading && (
                  <div style={{ textAlign:"center", padding:"40px 0", color:"var(--gray-400)" }}>
                    <Icon name="search" size={28} style={{ marginBottom:10 }} />
                    <p style={{ fontSize:"0.85rem", fontWeight:600 }}>No applications found</p>
                  </div>
                )}
              </div>
            )}

            {/* ════ TAB: ANNOUNCEMENTS ════ */}
            {activeTab === "announcements" && (() => {
              const PRIORITY_FILTERS = ["All", "High", "Medium", "Low"];
              const PRIORITY_BG  = { high:"#fff5f5",  medium:"#fffbeb",  low:"#f0fdf4"  };
              const PRIORITY_BDR = { high:"#fecaca",  medium:"#fde68a",  low:"#a7f3d0"  };

              const filteredAnns = announcements.filter(a => {
                const matchS = !annSearch ||
                  (a.activity    || "").toLowerCase().includes(annSearch.toLowerCase()) ||
                  (a.description || "").toLowerCase().includes(annSearch.toLowerCase());
                const matchP = annPriorityFilter === "All" || a.priority === annPriorityFilter.toLowerCase();
                return matchS && matchP;
              });

              return (
                <div>
                  {/* Info banner */}
                  <div style={{ background:"#fff7ed", border:"1px solid #fed7aa", borderRadius:10, padding:"10px 14px", marginBottom:16, display:"flex", alignItems:"flex-start", gap:10, fontSize:"0.80rem", color:"#c2410c" }}>
                    <Icon name="bell" size={16} style={{ flexShrink:0, marginTop:1 }} />
                    <div>
                      <strong>Announcements Management</strong>
                      <p style={{ margin:"3px 0 0", fontSize:"0.73rem", color:"#c2410c" }}>
                        Create and manage announcements that appear in the <em>What's Going On</em> section. You can target announcements based on specific <strong>roles</strong> and <strong>departments</strong>.
                      </p>
                    </div>
                  </div>

                  {/* Toolbar */}
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16, flexWrap:"wrap" }}>
                    {/* Search */}
                    <div style={{ display:"flex", alignItems:"center", gap:8, background:"var(--gray-50)", border:"1.5px solid var(--gray-200)", borderRadius:8, padding:"7px 12px", flex:1, maxWidth:300 }}>
                      <Icon name="search" size={13} style={{ color:"var(--gray-400)", flexShrink:0 }} />
                      <input style={{ border:"none", outline:"none", background:"none", fontSize:"0.82rem", width:"100%" }}
                        placeholder="Search announcements…" value={annSearch} onChange={e => setAnnSearch(e.target.value)} />
                      {annSearch && <button onClick={() => setAnnSearch("")} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--gray-400)", padding:0, lineHeight:0 }}><Icon name="x" size={12} /></button>}
                    </div>

                    {/* Priority filter pills */}
                    <div style={{ display:"flex", gap:5 }}>
                      {PRIORITY_FILTERS.map(p => {
                        const active = p === annPriorityFilter;
                        const accent = p === "All" ? "var(--brand)" : PRIORITY_ACCENT[p.toLowerCase()];
                        return (
                          <button key={p} onClick={() => setAnnPriorityFilter(p)} style={{
                            padding:"5px 12px", borderRadius:20, fontSize:"0.68rem", fontWeight:600,
                            cursor:"pointer", transition:"all .15s",
                            border:`1.5px solid ${active ? accent : "var(--gray-200)"}`,
                            background: active ? accent : "white",
                            color: active ? "white" : "var(--gray-500)",
                          }}>{p}</button>
                        );
                      })}
                    </div>

                    {/* Add button */}
                    <button onClick={() => setAnnModal("new")} style={{ ...IS.btnPrimary, marginLeft:"auto", display:"flex", alignItems:"center", gap:6 }}>
                      <Icon name="plus" size={14} /> New Announcement
                    </button>
                  </div>

                  {/* List */}
                  {filteredAnns.length === 0 ? (
                    <div style={{ textAlign:"center", padding:"48px 0", color:"var(--gray-400)" }}>
                      <Icon name="bell" size={32} style={{ marginBottom:12 }} />
                      <p style={{ fontSize:"0.85rem", fontWeight:600 }}>No announcements found</p>
                    </div>
                  ) : (
                    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                      {filteredAnns.map((ann, idx) => (
                        <div key={ann.id} style={{
                          display:"flex", alignItems:"stretch",
                          background: PRIORITY_BG[ann.priority] ?? "white",
                          border:`1px solid ${PRIORITY_BDR[ann.priority] ?? "var(--gray-200)"}`,
                          borderRadius:10, overflow:"hidden",
                          animation:`slideUp .15s ease ${idx*0.03}s both`,
                        }}>
                          {/* Accent bar */}
                          <div style={{ width:4, flexShrink:0, background:PRIORITY_ACCENT[ann.priority] }} />

                          <div style={{ flex:1, padding:"14px 16px", display:"flex", alignItems:"flex-start", gap:14, minWidth:0 }}>
                            {/* Priority badge */}
                            <div style={{ flexShrink:0, paddingTop:2 }}>
                              <span style={{
                                display:"inline-flex", alignItems:"center", gap:4,
                                padding:"3px 9px", borderRadius:20, fontSize:"0.60rem", fontWeight:700,
                                background: PRIORITY_ACCENT[ann.priority] + "18",
                                color: PRIORITY_ACCENT[ann.priority],
                                border:`1px solid ${PRIORITY_ACCENT[ann.priority]}30`,
                              }}>
                                <span style={{ width:6, height:6, borderRadius:"50%", background:PRIORITY_ACCENT[ann.priority] }} />
                                {PRIORITY_LABEL[ann.priority]}
                              </span>
                            </div>

                            {/* Content */}
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                                <p style={{ fontSize:"0.85rem", fontWeight:700, color:"var(--gray-800)", margin:0 }}>{ann.activity}</p>
                                <span style={{ fontSize:"0.62rem", color:"var(--gray-400)" }}>—</span>
                                <span style={{ fontSize:"0.62rem", color:"var(--gray-500)" }}>
                                  {ann.announce_date
                                    ? new Date(ann.announce_date).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})
                                    : ""}
                                </span>
                              </div>
                              <p style={{ fontSize:"0.72rem", color:"var(--gray-600)", margin:"0 0 8px", lineHeight:1.5 }}>{ann.description}</p>

                              {/* Targeting badges */}
                              <div style={{ display:"flex", flexWrap:"wrap", gap:5, alignItems:"center" }}>
                                <span style={{ fontSize:"0.60rem", color:"var(--gray-400)", fontWeight:600 }}>Targets:</span>
                                {ann.target_roles.length === 0
                                  ? <span style={{ padding:"2px 8px", borderRadius:20, fontSize:"0.58rem", fontWeight:600, background:"#f0fdf4", color:"#065f46", border:"1px solid #a7f3d0" }}> All Roles</span>
                                  : ann.target_roles.map(r => (
                                    <span key={r} style={{ padding:"2px 8px", borderRadius:20, fontSize:"0.58rem", fontWeight:600, background:"var(--brand-pale)", color:"var(--brand)", border:"1px solid rgba(18,54,95,0.12)" }}>{r}</span>
                                  ))
                                }
                                <span style={{ width:1, height:12, background:"var(--gray-200)", margin:"0 2px" }} />
                                {ann.target_departments.length === 0
                                  ? <span style={{ padding:"2px 8px", borderRadius:20, fontSize:"0.58rem", fontWeight:600, background:"#eff6ff", color:"#1d4ed8", border:"1px solid #bfdbfe" }}>All Depts</span>
                                  : ann.target_departments.map(d => (
                                    <span key={d} style={{ padding:"2px 8px", borderRadius:20, fontSize:"0.58rem", fontWeight:600, background:"#eff6ff", color:"#1d4ed8", border:"1px solid #bfdbfe" }}>{d}</span>
                                  ))
                                }
                              </div>
                            </div>

                            {/* From dept + link */}
                            <div style={{ flexShrink:0, textAlign:"right", minWidth:140 }}>
                              <p style={{ fontSize:"0.60rem", color:"var(--gray-400)", margin:"0 0 4px", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.04em" }}>Link</p>
                              {ann.link_label && ann.link_url ? (
                                <a href={ann.link_url} target="_blank" rel="noopener noreferrer"
                                  style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 10px", borderRadius:20, fontSize:"0.60rem", fontWeight:700, background:"var(--brand-pale)", color:"var(--brand)", border:"1px solid rgba(18,54,95,0.12)", textDecoration:"none" }}>
                                  {ann.link_label} <Icon name="externalLink" size={9} />
                                </a>
                              ) : (
                                <span style={{ fontSize:"0.62rem", color:"var(--gray-300)" }}>—</span>
                              )}
                            </div>

                            {/* Actions */}
                            <div style={{ flexShrink:0, display:"flex", flexDirection:"column", gap:6 }}>
                              <button onClick={() => setAnnModal(ann)} style={{ ...IS.btnGhost, padding:"5px 10px", fontSize:"0.68rem", display:"flex", alignItems:"center", gap:4 }}>
                                <Icon name="edit" size={12} /> Edit
                              </button>
                              <button onClick={() => setDelAnn(ann)} style={{
                                padding:"5px 10px", borderRadius:7, fontSize:"0.68rem", fontWeight:600,
                                border:"1.5px solid #fecaca", background:"#fff5f5", color:"#b91c1c",
                                cursor:"pointer", display:"flex", alignItems:"center", gap:4,
                              }}>
                                <Icon name="trash" size={12} /> Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Count */}
                  <p style={{ marginTop:12, fontSize:"0.70rem", color:"var(--gray-400)" }}>
                    {filteredAnns.length} of {announcements.length} announcements
                  </p>
                </div>
              );
            })()}
          </div>
        </div>
        <p style={{ marginTop:28, textAlign:"center", fontSize:"0.70rem", color:"var(--gray-400)" }}>{COPYRIGHT_TEXT} | Enterprise Portal v2.1.0 | <Link to="/privacy" style={{ color:"var(--brand)", fontWeight:600 }}>Kebijakan Privasi</Link></p>
      </main>

      {/* ── Modals ── */}
      {deptModal && <DeptFormModal dept={deptModal==="new"?null:deptModal} onClose={() => setDeptModal(null)} onSaved={() => { fetchDepts(); showToast("Department save successful ✓"); }} />}
      {userModal && <UserFormModal user={userModal==="new"?null:userModal} departments={activeDepts} onClose={() => setUserModal(null)} onSaved={() => { fetchUsers(); fetchDepts(); showToast("User save successful ✓"); }} />}
      {/* cardModal sekarang pass depts agar department selector bisa tampil */}
      {cardModal && <CardFormModal card={cardModal==="new"?null:cardModal} depts={depts} onClose={() => setCardModal(null)} onSaved={() => { fetchCards(); showToast("Card save successful ✓"); }} />}
      {delDept  && <ConfirmModal message={`Delete department "${delDept.department_name}"?`} onConfirm={confirmDelDept} onCancel={() => setDelDept(null)} />}
      {delUser  && <ConfirmModal message={`Delete user "${delUser.full_name}" (NIK: ${delUser.nik})?`} onConfirm={confirmDelUser} onCancel={() => setDelUser(null)} />}
      {delCard  && <ConfirmModal message={`Delete card "${delCard.page_name}"?`} onConfirm={confirmDelCard} onCancel={() => setDelCard(null)} />}

      {/* Announcement modals */}
      {annModal && (
        <AnnouncementFormModal
          ann={annModal === "new" ? null : annModal}
          departments={activeDepts}
          onClose={() => setAnnModal(null)}
          onSaved={() => { fetchAnnouncements(); showToast(annModal === "new" ? "Announcement published ✓" : "Announcement updated ✓"); }}
        />
      )}
      {delAnn && (
        <ConfirmModal
          message={`Delete announcement "${delAnn.activity}"?`}
          onConfirm={async () => {
            try {
              await announcementsApi.delete(delAnn.id);
              fetchAnnouncements();
              showToast("Announcement deleted");
            } catch (e) { showToast(e.response?.data?.detail ?? "Gagal menghapus"); }
            finally { setDelAnn(null); }
          }}
          onCancel={() => setDelAnn(null)}
        />
      )}
    </div>
  );
}