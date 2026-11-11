// src/pages/PrivacyPolicy.jsx — Kebijakan Privasi (halaman publik, /privacy)
//
// CATATAN: Teks ini adalah DRAFT yang disusun dari cara kerja aplikasi saat ini.
// Mohon ditinjau oleh bagian hukum / DPO perusahaan sebelum dipublikasikan.
// Nama perusahaan, departemen, kontak, dan tanggal ada di src/config/company.js.

import { Link } from "react-router-dom";
import { COMPANY } from "../config/company";
import cereaLogo from "../assets/cerea-logo.png";
import PortalFooter from "../components/PortalFooter";

const SECTIONS = [
  {
    title: "1. Ruang lingkup",
    body: [
      `Kebijakan Privasi ini menjelaskan bagaimana ${COMPANY.name} (“kami”) mengumpulkan, menggunakan, menyimpan, dan melindungi data pribadi karyawan yang menggunakan ${COMPANY.portalName} (“Portal”). Dengan menggunakan Portal, Anda memahami isi kebijakan ini.`,
    ],
  },
  {
    title: "2. Data yang kami kumpulkan",
    list: [
      "Data akun: Nomor Induk Karyawan (NIK), nama lengkap, peran (role), dan departemen.",
      "Kata sandi: disimpan dalam bentuk hash (bcrypt), bukan teks asli, sehingga tidak dapat dibaca oleh administrator.",
      "Aktivitas penggunaan: jumlah klik pada kartu aplikasi/tautan di Portal, yang digunakan untuk menampilkan aplikasi yang sering Anda buka. Akses tamu (Login as Guest) tidak menyimpan data klik.",
      "Konten yang dikelola administrator: kartu aplikasi dan pengumuman, termasuk target peran dan departemen.",
    ],
  },
  {
    title: "3. Tujuan penggunaan data",
    list: [
      "Mengautentikasi Anda dan mengatur hak akses sesuai peran dan departemen.",
      "Menampilkan aplikasi dan pengumuman yang relevan bagi Anda.",
      "Menampilkan aplikasi yang sering digunakan dan meningkatkan kenyamanan Portal.",
      "Menjaga keamanan sistem, menangani kendala teknis, dan memenuhi kewajiban hukum.",
    ],
  },
  {
    title: "4. Pembagian data",
    body: [
      "Data Anda hanya digunakan di lingkungan internal perusahaan dan dapat diakses oleh administrator Portal sebatas yang diperlukan untuk pengelolaan akun. Kami tidak menjual data pribadi Anda.",
      "Portal memuat font dari Google Fonts, sehingga alamat IP perangkat Anda dapat diterima oleh Google saat halaman dibuka.",
      "Kami dapat mengungkapkan data bila diwajibkan oleh hukum atau permintaan resmi instansi berwenang.",
    ],
  },
  {
    title: "5. Penyimpanan di perangkat Anda",
    body: [
      "Portal tidak memakai cookie iklan atau pelacak pihak ketiga. Untuk berfungsi, Portal menyimpan data berikut di peramban Anda:",
    ],
    list: [
      "Token sesi dan ringkasan profil (nama, NIK, peran) di penyimpanan lokal (localStorage). Data ini dihapus saat Anda keluar (logout) atau sesi tidak lagi valid.",
      "Pilihan pratinjau administrator (“Preview as user”) di penyimpanan sesi (sessionStorage), yang hilang saat tab ditutup atau saat logout.",
    ],
  },
  {
    title: "6. Keamanan data",
    body: [
      "Kami menerapkan langkah keamanan yang wajar, antara lain hashing kata sandi, token sesi dengan masa berlaku terbatas, serta pembatasan akses berbasis peran. Namun, tidak ada sistem yang sepenuhnya bebas risiko. Jaga kerahasiaan kata sandi Anda dan segera keluar dari akun saat menggunakan perangkat bersama.",
    ],
  },
  {
    title: "7. Penyimpanan dan penghapusan",
    body: [
      "Data akun disimpan selama akun Anda aktif dan selama diperlukan untuk tujuan di atas atau kewajiban hukum. Setelah itu, data dihapus atau dianonimkan sesuai kebijakan perusahaan.",
    ],
  },
  {
    title: "8. Hak Anda",
    body: [
      "Sesuai ketentuan peraturan perundang-undangan yang berlaku, termasuk Undang-Undang Pelindungan Data Pribadi (UU No. 27 Tahun 2022), Anda berhak untuk mengakses, memperbaiki, dan meminta penghapusan data pribadi Anda, serta menarik persetujuan atau mengajukan keberatan atas pemrosesan tertentu. Untuk menggunakan hak tersebut, hubungi kami melalui kontak di bawah.",
    ],
  },
  {
    title: "9. Perubahan kebijakan",
    body: [
      "Kebijakan ini dapat diperbarui sewaktu-waktu. Versi terbaru selalu tersedia di halaman ini beserta tanggal pembaruannya.",
    ],
  },
  {
    title: "10. Hubungi kami",
    body: [
      COMPANY.privacyEmail
        ? `Pertanyaan atau permintaan terkait data pribadi dapat disampaikan kepada ${COMPANY.department} ${COMPANY.name} melalui ${COMPANY.privacyEmail}.`
        : `Pertanyaan atau permintaan terkait data pribadi dapat disampaikan kepada ${COMPANY.department} ${COMPANY.name}.`,
    ],
  },
];

export default function PrivacyPolicy() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column",
      background: "var(--gray-50)", fontFamily: "Montserrat, sans-serif" }}>

      <header style={{ background: "white", borderBottom: "1px solid var(--gray-200)" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "12px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <img src={cereaLogo} alt={COMPANY.name} style={{ height: 30, width: "auto" }} />
          <Link to="/" style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--brand)" }}>
            ← Kembali ke Portal
          </Link>
        </div>
      </header>

      <main style={{ flex: 1, width: "100%", maxWidth: 860, margin: "0 auto", padding: "32px 24px 48px" }}>
        <div style={{ background: "white", border: "1px solid var(--gray-200)",
          borderRadius: "var(--radius)", boxShadow: "var(--shadow-sm)", padding: "36px 40px" }}>
          <div style={{ width: 44, height: 4, borderRadius: 2, marginBottom: 16,
            background: "linear-gradient(90deg, var(--brand), var(--brand-lt))" }} />
          <h1 style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--brand)", letterSpacing: "-0.4px" }}>
            Kebijakan Privasi
          </h1>
          <p style={{ fontSize: "0.78rem", color: "var(--gray-400)", marginTop: 4, marginBottom: 28 }}>
            {COMPANY.portalName} · Terakhir diperbarui {COMPANY.privacyUpdated}
          </p>

          {SECTIONS.map((s) => (
            <section key={s.title} style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--gray-800)", marginBottom: 8 }}>
                {s.title}
              </h2>
              {s.body?.map((p, i) => (
                <p key={i} style={{ fontSize: "0.88rem", lineHeight: 1.7, color: "var(--gray-600)", marginBottom: 8 }}>
                  {p}
                </p>
              ))}
              {s.list && (
                <ul style={{ paddingLeft: 22, margin: 0, listStyle: "disc" }}>
                  {s.list.map((li, i) => (
                    <li key={i} style={{ fontSize: "0.88rem", lineHeight: 1.7, color: "var(--gray-600)", marginBottom: 4 }}>
                      {li}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </main>

      <PortalFooter />
    </div>
  );
}
