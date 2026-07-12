# HM Geomatics — PRD

## Original Problem Statement
Build a luxury prestige website for HM Geomatics Sdn. Bhd. (Malaysian licensed
land surveyor) inspired by rolex.com — a dark dramatic hero centrepiece,
followed by alternating cream / white content sections (quote band, services
3×2 grid, about split panel, director profile, contact, footer). Includes a
hidden `/admin` page to view and manage enquiries plus a full CMS.

## Architecture
- **Frontend**: React 19 + react-router-dom 7, Sonner for toasts, custom
  hand-crafted CSS (`styles/site.css`). HeroVideo plays a looping
  `hmgeo-emergence.webm/.mp4`.
- **Backend**: FastAPI + Motor (MongoDB). All routes under `/api`. JWT
  (HS256, 24h) + bcrypt-hashed admin password. Lifespan context manager
  for startup (seeds admin + content, ensures indexes). SMTP enquiry
  notifications via env vars (gracefully no-ops if unset).
- **Data**:
  - `users` — single admin, seeded from env (email + bcrypt hash + role)
  - `content` — single doc keyed `"site"` with all editable site copy
  - `projects` — list of "Selected Work" items
  - `enquiries` — contact-form submissions

## User Personas
- **Prospective client** (developers, contractors, gov agencies) —
  visits the site, reviews services / credentials / projects, submits an
  enquiry.
- **HM Geomatics admin** (Director / office) — signs into `/admin`,
  reviews enquiries, edits site content, manages projects.

## Core Requirements (static)
1. Dark hero with a looping HM monogram emergence video.
2. Alternating cream / dark content sections after the hero.
3. Six services grid, director profile, company credentials, address.
4. Working "Send Enquiry" form persisting to MongoDB + email alert.
5. Admin page at `/admin` with JWT login and tabbed CMS:
   - Enquiries (view + delete)
   - Site Content (all 32+ fields editable, including services list,
     manifesto words, values, director bio + photo upload, contact info)
   - Projects (CRUD with image upload)
6. Gold accent `#C9932A`, Cormorant Garamond + Montserrat typography.

## What's Been Implemented

### 2026-05-20 (initial)
- Three.js medallion hero (later replaced with video).
- Sticky transparent → dark nav, services grid, director profile, contact.
- Shared-password admin login + enquiry table.
- 100% backend + frontend test pass (`iteration_1.json`).

### 2026-05-20 (session 2 — content polish)
- Replaced Three.js with looping hero video (`HeroVideo.jsx`).
- Responsive fluid typography (`clamp()`).
- Manifesto reveal animation.
- Custom CSS mask-image line-art service icons.
- Director portrait, WhatsApp FAB, Co. Profile PDF download.
- SEO: meta tags, `sitemap.xml`, `robots.txt`, JSON-LD `ProfessionalService`.
- PDF compression: 43.2 MB → 4.3 MB via Ghostscript (29 pages preserved).
- Renamed legacy `Hero3D.jsx` → `HeroVideo.jsx`.

### 2026-05-21 (session 3 — P1 + P3 + CMS)- **Auth hardening (P3)**:
  - JWT (HS256, 24h) + bcrypt (cost 12) password hashing
  - `POST /api/auth/login` (email + password)
  - `GET /api/auth/me` (Bearer token)
  - In-memory per-IP brute-force lockout (5 attempts / 15 min → HTTP 429)
  - Backward-compat `/api/admin/login` shim that issues a JWT
- **FastAPI lifespan migration (P3)** — replaced deprecated `@app.on_event`
  with `@asynccontextmanager` lifespan that seeds admin (idempotent),
  seeds default site content, and ensures MongoDB indexes.
- **Email notifications (P1)** — `smtplib` via env (`SMTP_HOST/PORT/USER/
  PASSWORD/FROM`, `EMAIL_TO`). Fire-and-forget on `POST /api/enquiries`.
  Gracefully logs and no-ops when credentials missing.
- **Full CMS (new)**:
  - Public `GET /api/content` + admin `PUT /api/admin/content`
  - 32+ editable fields covering hero, quote, services, manifesto, about,
    values, director (with photo upload), contact, company registration
  - Public `GET /api/projects` + admin CRUD at `/api/admin/projects`
  - `POST /api/admin/upload` — multipart file (8 MB cap, image-only)
    served via mounted `/api/uploads/*` StaticFiles
- **Public "Selected Work" section** — auto-renders on Home between
  Services and Manifesto when projects exist.
- **Home.jsx hydration** — fetches `/api/content` + `/api/projects` on
  mount with hardcoded fallback if API is offline.
- **Admin.jsx rewrite** — 3-tab dashboard (Enquiries / Site Content /
  Projects) with image upload component, sticky save bar, inline list
  editors for services / quals / manifesto words / values.

### 2026-05-21 (session 4 — Services v2 + polish)
- **Hero sound toggle** — "Sound Off / Sound On" pill, bottom-left of
  hero. Video swapped to `emergencehme.mp4` (with AAC audio); .webm
  re-encoded with opus. Starts muted (autoplay compliance).
- **Chat FAB → icon-only** — clean 56×56 gold circle with WhatsApp
  glyph. Mirrors sound toggle position (both `bottom: clamp(20px, 2.4vw, 36px)`).
- **Hero cleanup** — removed the gold horizontal divider under "HM
  Geomatics" and the vertical "Discover" scroll cue for a cleaner
  cinematic layout.
- **Services v2 (Premium 3-column grid)**:
  - Redesigned to a modern engineering-consultancy layout: 16:9
    landscape photos, dark gradient overlay, gold accent line under
    each title, outline lucide-react icon, "LEARN MORE ↗" button.
  - Expanded from 6 → **14 services**: Land Boundary, Topographic,
    Engineering, Cadastral, Hydrographic, LiDAR, Utility Detection,
    Mining, Drone (UAV), Construction Monitoring, GNSS/GPS, As-Built,
    Deformation Monitoring, GIS.
  - Each card includes: number badge, lucide icon, title, gold accent
    line, description, animated "Learn More" that scrolls to `#contact`
    and prefills the enquiry subject with the service name.
  - Curated Unsplash direct URLs (WebP + `w=1600&h=900&q=80`), lazy
    loading, `async` decoding. All 14 URLs verified HTTP 200.
  - Hover: 6% image zoom + saturation shift + gold accent line grows
    30px → 60px + shadow elevation.
  - Fade-up on scroll via `.reveal` IntersectionObserver.
  - Responsive: 3-col ≥ 1080px → 2-col → 1-col ≤ 640px.
  - **JSON-LD `ItemList` of `Service`** injected for SEO.
  - CMS Content tab extended with per-service **photo URL**, **alt
    text**, **lucide icon key** fields (upload button for local
    hosting also included).

## Test Status- `iteration_2.json` — **100% backend (19/19)**, **100% frontend (10/10)**,
  zero bugs.

## Prioritised Backlog

### P1
- Wire actual SMTP creds (or switch to Resend) so enquiry emails fire.
- Mobile QA pass on iOS Safari.

### P2
- Production hardening:
  - Swap canonical URLs in `sitemap.xml`, `robots.txt`, `index.html`
    from preview domain → live `hmgeomatics.com.my`.
  - Set explicit CORS origin instead of `*`.
  - Rotate `JWT_SECRET` for production.
- Multilingual (Bahasa Malaysia toggle).
- Map embed for Seremban office.
- Admin: CSV export of enquiries.
- CMS: drag-and-drop reorder of services / projects.
- CMS: rich text editor for director bio / about intro.

### P3
- Brute force protection → Redis-backed if scaling horizontally.
- Multi-user CMS (invite editors).
- Project detail pages with image gallery + map.
- Webhook on new enquiry → Slack / Telegram.
