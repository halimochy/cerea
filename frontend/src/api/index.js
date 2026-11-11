// src/api/index.js  (v2 — tambah departmentsApi)

import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Origin backend (tanpa /api) — dipakai untuk resolve URL file statis
// seperti hasil upload icon (/uploads/icons/xxx.png).
// Prioritas:
//   1. VITE_API_BASE_URL jika diset (mis. "https://api.example.com")
//   2. Default dev: backend FastAPI biasanya jalan di port 8000,
//      sedangkan Vite dev server jalan di port 5173 — keduanya
//      origin BERBEDA, jadi path relatif "/uploads/..." tidak akan
//      otomatis terarah ke backend tanpa origin eksplisit di sini.
const BACKEND_ORIGIN =
  import.meta.env?.VITE_API_BASE_URL ||
  (import.meta.env?.DEV ? "http://localhost:8000" : "");

/** Ubah path relatif backend (mis. "/uploads/icons/x.png") jadi URL absolut. */
export function resolveUploadUrl(path) {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path; // sudah absolut
  return `${BACKEND_ORIGIN}${path}`;
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  login:          (nik, password)              => api.post("/auth/login", { nik, password }),
  microsoftLogin: (email, display_name, nik_extracted, ms_id) =>
    api.post("/auth/microsoft", { email, display_name, nik_extracted, ms_id }),
  me:             ()                           => api.get("/auth/me"),
  forgotPassword: (nik)                        => api.post("/auth/forgot-password", { nik }),
};

export const departmentsApi = {
  list:       (activeOnly = false) => api.get("/departments", { params: { active_only: activeOnly } }),
  listActive: ()                   => api.get("/departments", { params: { active_only: true } }),
  create:     (data)               => api.post("/departments", data),
  update:     (id, data)           => api.put(`/departments/${id}`, data),
  delete:     (id)                 => api.delete(`/departments/${id}`),
};

export const usersApi = {
  list:   (deptId)   => api.get("/users", deptId ? { params: { department_id: deptId } } : {}),
  create: (data)     => api.post("/users", data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id)       => api.delete(`/users/${id}`),
};

export const cardsApi = {
  list:            (category) => api.get("/cards", { params: category ? { category } : {} }),
  frequentlyUsed:  (limit=6)  => api.get("/cards/frequently-used", { params: { limit } }),
  recordClick:     (id)       => api.post(`/cards/${id}/click`),
  create:          (data)     => api.post("/cards", data),
  update:          (id, data) => api.put(`/cards/${id}`, data),
  delete:          (id)       => api.delete(`/cards/${id}`),
  uploadIcon:      (file)     => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/cards/upload-icon", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

export const announcementsApi = {
  // User: ambil announcement yang sudah difilter oleh backend (role+dept)
  list:      (activeOnly = true) => api.get("/announcements", { params: { active_only: activeOnly } }),
  // Admin: semua announcement termasuk inactive
  listAll:   ()                  => api.get("/announcements/all"),
  create:    (data)              => api.post("/announcements", data),
  update:    (id, data)          => api.put(`/announcements/${id}`, data),
  delete:    (id)                => api.delete(`/announcements/${id}`),
};

export default api;