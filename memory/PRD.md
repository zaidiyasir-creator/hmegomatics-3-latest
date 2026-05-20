# HM Geomatics — PRD

## Original Problem Statement
Build a luxury prestige website for HM Geomatics Sdn. Bhd. (Malaysian licensed
land surveyor) inspired by rolex.com — a dark hero with a slowly rotating 3D
HM medallion centrepiece, followed by alternating cream / white content
sections (quote band, services 3×2 grid, about split panel, director profile,
contact, footer). Includes a hidden `/admin` page to view enquiries submitted
through the SEND ENQUIRY form.

## Architecture
- **Frontend**: React 19 + react-router-dom 7, Three.js r160 for the medallion,
  Sonner for toasts, Tailwind + custom CSS (`styles/site.css`).
- **Backend**: FastAPI + Motor (MongoDB). All routes under `/api`. Admin auth
  is a single shared password from env (`ADMIN_PASSWORD`), checked via
  `x-admin-token` header.
- **Data**: MongoDB collection `enquiries` (`id`, `name`, `email`, `phone?`,
  `subject?`, `message`, `created_at` ISO).

## User Personas
- **Prospective client** (developers, contractors, gov agencies in Malaysia)
  — visits the site, reviews services / credentials, submits an enquiry.
- **HM Geomatics admin** (Director / office) — signs into `/admin`, reviews
  and deletes enquiries.

## Core Requirements (static)
1. Dark hero with a 3D rotating medallion (HM monogram).
2. Alternating cream / white content sections after the hero.
3. Six services grid, director profile, company credentials, address.
4. Working "Send Enquiry" form persisting to MongoDB.
5. Admin page at `/admin` with password gate to view/delete enquiries.
6. Gold accent `#C9932A`, Cormorant Garamond + Montserrat typography.

## What's Been Implemented (2026-05-20)
- 3D medallion (Three.js, slow majestic z-spin + y-wobble + y-float, gold
  rim torus, inner accent ring, dark cylinder body, CircleGeometry face
  textured with a hand-drawn canvas HM monogram).
- Sticky transparent → dark nav with rotating HM logo on hover.
- Hero overlay (eyebrow, title, divider, scroll cue, coordinate ticks).
- Cream quote band with director attribution.
- White services grid (6 cells, 0.5px borders, hover lighten).
- Cream/dark about split panel with stats + values.
- White director profile with avatar, role, quals.
- Cream contact section with full enquiry form posting to `/api/enquiries`.
- Dark footer with company reg.
- `/admin`: login form → dashboard with table (received, name, contact,
  subject, message, delete) + refresh / sign out.
- Backend: `GET /api/`, `POST /api/enquiries`, `POST /api/admin/login`,
  `GET /api/admin/enquiries`, `DELETE /api/admin/enquiries/{id}`.
- Test credentials stored in `/app/memory/test_credentials.md`.
- Full test pass (100% backend, 100% frontend) — `iteration_1.json`.

## What's Been Implemented (2026-05-20 — session 2)
- Replaced Three.js medallion with looping hero video
  (`hmgeo-emergence.webm` + `.mp4`) handled by `HeroVideo.jsx`
  (renamed from legacy `Hero3D.jsx`).
- Responsive fluid typography via `clamp()` across all breakpoints.
- Manifesto section with scroll-in reveal animation.
- Custom CSS `mask-image` line-art icons in services grid.
- Director portrait (`director-hazwan.jpg`) embedded in Leadership.
- Floating "Chat to the Team" WhatsApp FAB (bottom-right, lifted to
  `86px` to clear platform badges).
- Company profile PDF download in nav.
- **SEO**: meta tags, Open Graph, Twitter card, JSON-LD
  `ProfessionalService` schema in `index.html`; `sitemap.xml` and
  `robots.txt` served (verified HTTP 200). Cloudflare layer prepends
  managed AI-bot policy automatically.
- **PDF compression**: `hm-geomatics-2026-profile.pdf` reduced from
  **43.2 MB → 4.3 MB** (90% smaller, 29 pages preserved) via Ghostscript
  `/ebook` preset. Original kept as `.original.pdf` backup.
- Removed legacy `Hero3D.jsx`; cleaned stray `}` parse error in
  `Home.jsx`.

## Prioritised Backlog
### P1
- Mobile QA pass on iOS Safari (Three.js memory footprint).
- Email notification when an enquiry is submitted (Resend/SendGrid).

### P2
- Projects / case-studies section (mirrors rolex "selected work").
- Multilingual (Bahasa Malaysia toggle).
- Map embed for Seremban office.
- Admin: CSV export of enquiries.

### P3
- Auth hardening (replace shared password with JWT + bcrypt).
- Migrate FastAPI `@app.on_event` to lifespan handler.
- Lottie/WebGL background grain on cream sections.
