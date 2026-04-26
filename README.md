# ADVANCIA Trainings

A premium full-stack training & learning management platform built with Next.js
14 (App Router), TypeScript, Tailwind CSS, MongoDB (Mongoose), Framer Motion,
Recharts, XLSX, pdf-lib, bcrypt, and jose.

## What's inside

- **Public website** — premium homepage (hero, featured trainings, categories,
  upcoming sessions calendar preview, testimonials, premium CTA), a small funny
  *Avatar Pop* game with avatars, recommendation stars on every training card,
  catalogue with search/category/level/format/sort, training detail page with
  cover, trainer, duration, dates, format, outcomes, modules, schedules and
  related trainings, and a calendar page with filters.
- **Authentication** — email/password registration with email verification,
  email/password login, social login & registration with Google, Facebook and
  Yahoo (graceful demo fallback when credentials aren't configured), secure
  password hashing with bcrypt, signed session cookies with jose, role-protected
  routes via middleware. Three roles: `user`, `admin`, `super_admin`.
- **Registration form** — old/simple form with full name, email, age, gender,
  company, department, password, plus a funny avatar picker.
- **User dashboard** — overview, profile completeness, current training,
  recommendations, notifications, payment history, activity, upcoming sessions.
  Profile management (avatar, picture, language, theme, password change). Alexa
  AI assistant.
- **Admin dashboard** — KPIs, charts, learner management with filters, status
  management, enrollment requests with accept/reject, notifications, Excel
  import, and Excel/PDF exports.
- **Super Admin dashboard** — full visibility, advanced analytics, user & admin
  management, training CRUD, training status monitoring, activity logs, full
  exports. Alex AI assistant.
- **AI assistants** — Alexa (users) and Alex (super admin) connect to ChatGPT
  via the OpenAI API for natural conversation; both also recommend trainings
  using the platform's recommendation engine. If `OPENAI_API_KEY` is missing,
  they gracefully fall back to a curated, recommendation-only response.
- **Recommendations** — ranking based on department, interests, focus tracks,
  search intent, popularity and rating. Stars are shown consistently across the
  homepage, catalogue, dashboard, chatbot recommendations and training detail
  pages.
- **Reports & exports** — Excel (xlsx) and PDF (pdf-lib) of users with the full
  structured set of columns: user ID, record ID, full name, first name, last
  name, gender, age, department, role, company, status, active state, training
  state, in training, current training, training code, category, format, trainer
  name, training start/end, enrollment status, progress %, email, phone,
  address, auth provider, email verified, onboarding completed, focus tracks,
  joined date, last login. PDFs are professional, branded, paginated tables —
  not raw JSON dumps.
- **Multilingual** — English, French and Arabic, with RTL handling.
- **Light & dark mode** — icon toggle in the navbar; the brand logo remains
  readable in both modes.

## Running locally

```bash
npm install
cp .env.example .env       # set MONGODB_URI, JWT_SECRET, optional OAuth keys
npm run seed               # create the demo Super Admin / Admin / User accounts
npm run dev
```

Open `http://localhost:3000` and sign in with one of the seeded accounts:

| Role        | Email                          | Password         |
| ----------- | ------------------------------ | ---------------- |
| Super Admin | super@advancia.training        | Advancia#2026    |
| Admin       | admin@advancia.training        | Advancia#2026    |
| User        | user@advancia.training         | Advancia#2026    |

## Environment variables

Copy `.env.example` to `.env` and fill in:

- `MONGODB_URI`, `JWT_SECRET`, `APP_URL` (required)
- `GOOGLE_CLIENT_ID`/`SECRET`, `FACEBOOK_CLIENT_ID`/`SECRET`,
  `YAHOO_CLIENT_ID`/`SECRET` (optional — without them, social sign-in is in
  demo mode that creates a temporary social account so the flow remains usable)
- `OPENAI_API_KEY`, `OPENAI_MODEL` (optional — without them, Alexa/Alex use a
  recommendation-only fallback)

## Tech notes

- App Router with server components for dashboards and route handlers under
  `src/app/api/*` for the JSON API
- MongoDB models in `src/models/*`
- Auth helpers in `src/lib/auth.ts`, JWT helpers in `src/lib/jwt.ts`,
  middleware in `src/middleware.ts`
- Recommendations in `src/lib/recommend.ts`
- Exports in `src/lib/exportRows.ts` and `src/app/api/export/users/*`
