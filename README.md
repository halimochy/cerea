<div align="center">

<img src="frontend/src/assets/cerea-logo.png" alt="Cerea" height="64" />

# Cerea

**A role-aware employee portal: one home screen for every company app, dashboard, form and announcement.**

![React](https://img.shields.io/badge/React-18-0B1F3A?logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-7-0B1F3A?logo=vite&logoColor=FFD62E)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-0B1F3A?logo=fastapi&logoColor=14B8A6)
![MariaDB](https://img.shields.io/badge/MariaDB-MySQL-0B1F3A?logo=mariadb&logoColor=white)

</div>

---

## Overview

Cerea is a full-stack intranet portal for organisations that run many internal tools. Instead of keeping
bookmarks for HR, finance, helpdesk and reporting systems, employees sign in once and see a single,
mobile-friendly launcher showing **only the apps their role and department are allowed to use**, alongside
company announcements.

Administrators manage everything from a built-in dashboard: departments, users and roles, application cards,
which apps appear as "General Apps", and targeted announcements. Changes appear for users on their next page load.

## Features

**For employees**
- **App launcher** in the style of a modern banking app menu, with custom illustrated SVG icons
- **Frequently Used**: your most-opened apps, ranked automatically from per-user click counts
- **General Apps** and **All Apps** sections with search and Website / Application / Dashboard / Form filters
- **What's Going On**: priority-coloured announcements, a notification bell and a full announcements page
- **eCanteen** demo module: card balance, spending-limit gauge and transaction history (mock data)
- Sign in with **NIK + password**, or optionally with **Microsoft (Entra ID) single sign-on**
- Responsive portal layout for desktop and mobile; built-in Privacy Policy page

**For administrators**
- Department management (active/inactive, user counts)
- User management with six roles: `Admin`, `CEO`, `CFO`, `DCFO`, `GM/DGM`, `User`
- Application card management with a visual icon picker, image upload (with crop/zoom), favicon auto-fetch or image URL
- Per-card targeting by **role and department**; one-click "General App" toggle
- Announcement management with priority, link, and role/department targeting

**Platform**
- JWT authentication (8-hour sessions by default) with bcrypt-hashed passwords
- Role checks on every admin API call; RBAC filtering of cards and announcements on the server
- Interactive API docs at `/docs` (FastAPI / OpenAPI)

## Technology Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 18, React Router 6, Vite 7, Axios, Tailwind CSS (base layer) + custom CSS |
| Authentication | JWT (`python-jose`), bcrypt, optional Microsoft SSO via `@azure/msal-browser` / `@azure/msal-react` |
| Backend | Python 3.12, FastAPI, Uvicorn, SQLAlchemy 2, Pydantic 2 |
| Database | MariaDB or MySQL (via PyMySQL) |
| Tooling | npm, uv (or pip + venv) |

## Project Structure

```
cerea/
├── backend/                  FastAPI application
│   ├── main.py               API routes: auth, departments, users, cards, clicks, announcements
│   ├── models.py             SQLAlchemy models (tables are created automatically)
│   ├── schemas.py            Pydantic request/response schemas
│   ├── auth.py               Password hashing and JWT helpers
│   ├── database.py           Database engine and sessions
│   ├── seed.py               Creates tables, the first admin, and optional demo data
│   ├── pyproject.toml        Dependencies (uv); requirements.txt for pip
│   └── .env.example          Backend environment template
├── frontend/                 React + Vite single-page app
│   ├── public/               Favicon and web app manifest
│   ├── src/
│   │   ├── pages/            Login, User Portal, Admin Dashboard, What's Going On, eCanteen, Privacy
│   │   ├── components/
│   │   │   ├── icons/        Cerea illustrated SVG icon system (AppIcon, IconBadge)
│   │   │   └── …             Line icons, modal, footer, route guard
│   │   ├── context/          Auth state (token + profile)
│   │   ├── api/              Axios client for the backend
│   │   ├── config/           Branding text (company name, footer)
│   │   └── msalConfig.js     Microsoft SSO configuration
│   ├── vite.config.js        Dev server; proxies /api → http://localhost:8000
│   └── .env.example          Frontend environment template
└── docs/                     Application flow diagram
```

## Getting Started

### Prerequisites

- **Node.js** 20.19+ (required by Vite 7) and npm
- **Python** 3.12+, plus [uv](https://docs.astral.sh/uv/) (recommended) or pip
- **MariaDB** 10.5+ or **MySQL** 8+

### 1. Clone

```bash
git clone https://github.com/halimochy/cerea.git
cd cerea
```

### 2. Create the database

```sql
CREATE DATABASE cerea CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'cerea_user'@'localhost' IDENTIFIED BY 'choose-a-password';
GRANT ALL PRIVILEGES ON cerea.* TO 'cerea_user'@'localhost';
```

### 3. Backend

```bash
cd backend
cp .env.example .env          # then edit DATABASE_URL and JWT_SECRET
uv sync                       # or: python -m venv .venv && .venv/bin/pip install -r requirements.txt
uv run python seed.py --demo  # creates tables, the admin account and demo data
```

`seed.py` prints the admin password (and the demo-user password) once if you left them empty in `.env`.
Run `python seed.py --reset-admin` at any time to set a new admin password. Drop `--demo` for an empty portal.

### 4. Frontend

```bash
cd frontend
cp .env.example .env          # optional: only needed for Microsoft SSO or a remote API
npm install
```

## Environment Configuration

### Backend (`backend/.env`)

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | SQLAlchemy URL, e.g. `mysql+pymysql://USER:PASSWORD@localhost:3306/cerea` |
| `JWT_SECRET` | ✅ | Long random string used to sign tokens (`python -c "import secrets; print(secrets.token_hex(32))"`) |
| `TOKEN_EXPIRE_MINUTES` | | Session length in minutes (default `480`) |
| `CORS_ORIGINS` | | Comma-separated allowed origins (default: the Vite dev server) |
| `EMAIL_DOMAIN` | | Email domain used in Microsoft sign-in messages (default `example.com`) |
| `ADMIN_NIK` / `ADMIN_PASSWORD` | | First admin account created by `seed.py` (password generated if empty) |
| `DEMO_USER_PASSWORD` | | Password for demo users created by `seed.py --demo` (generated if empty) |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_MSAL_CLIENT_ID` | | Entra ID app (client) ID, only for Microsoft sign-in |
| `VITE_MSAL_TENANT_ID` | | Entra ID directory (tenant) ID |
| `VITE_EMAIL_DOMAIN` | | Employee email domain; accounts must look like `{NIK}@domain` |
| `VITE_API_BASE_URL` | | Backend origin for uploaded icons in production, e.g. `https://api.example.com` |

> `VITE_*` values are compiled into the public JavaScript bundle. Never put secrets in them.
> Setup steps for Microsoft sign-in are in [`frontend/src/msalConfig.js`](frontend/src/msalConfig.js).

## Running Locally

Run the API and the web app in two terminals:

```bash
# Terminal 1 — API on http://localhost:8000 (docs at /docs)
cd backend
uv run uvicorn main:app --reload --port 8000
```

```bash
# Terminal 2 — web app on http://localhost:5173
cd frontend
npm run dev
```

Open <http://localhost:5173> and sign in with the admin NIK and password from `seed.py`. Demo users
(`1001`–`1005`, `2001`–`2006`) show how role and department targeting change the portal.

## Build & Deployment

**Frontend:** build static files and serve `frontend/dist/` from any static host or web server:

```bash
cd frontend
npm run build      # outputs dist/
npm run preview    # optional local check of the production build
```

The app calls the API at the relative path `/api`, so in production configure your web server to:
1. serve `dist/` and fall back to `index.html` for client-side routes, and
2. reverse-proxy `/api/*` to the backend, **stripping the `/api` prefix** (the dev server does the same).

**Backend:** run Uvicorn behind your reverse proxy:

```bash
cd backend
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --workers 2
```

Production checklist: set a strong `JWT_SECRET`, restrict `CORS_ORIGINS` to your domain, serve over HTTPS,
make `backend/uploads/` persistent (uploaded icons are stored there), and add your production redirect URI in
Entra ID if you use Microsoft sign-in.

## Screenshots / Preview

End-to-end application flow (sign-in, portal, admin workspace and the rules applied throughout):

![Cerea application flow](docs/cerea-app-flow.png)

<!-- Add UI screenshots here, e.g. docs/screenshots/portal.png, admin.png, mobile.png -->

## Project Status

**Active development.** Core portal, admin management, RBAC targeting and announcements are working.
The eCanteen module currently uses mock data. Before running Cerea in production, review the open items below.

**Known limitations / roadmap**
- `POST /auth/forgot-password` issues a temporary password to anyone who knows a NIK; it should be
  replaced with a verified reset flow (e.g. email link or admin approval).
- `POST /auth/microsoft` trusts the email sent by the browser; it should verify the Microsoft ID token on
  the server before issuing a session.
- No automated test suite or linter configuration yet.
- No database migration tool. Tables are created on startup, but later schema changes need manual updates.

## License

No license has been chosen yet. All rights are reserved by the author until a license is added.
