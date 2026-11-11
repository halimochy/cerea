// src/config/company.js
// Satu tempat untuk teks identitas perusahaan (footer, kebijakan privasi, dll).
// Ubah di sini — semua halaman ikut berubah.

export const COMPANY = {
  name:        "Cerea",                 // nama brand / perusahaan
  department:  "IT Department",         // unit yang mengelola portal
  portalName:  "Employee Portal",
  // Isi dengan email resmi jika ingin ditampilkan di Kebijakan Privasi,
  // mis. "privacy@perusahaan.com". Jika kosong, hanya nama departemen yang tampil.
  privacyEmail: "",
  privacyUpdated: "9 November 2026",
};

export const COPYRIGHT_TEXT = `© ${new Date().getFullYear()} ${COMPANY.name} | ${COMPANY.department}`;
