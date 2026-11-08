# CareWell Hospital

A responsive, production-shaped fullstack hospital appointment and e-prescription platform built with **Next.js App Router, React, TypeScript, Tailwind CSS, PostgreSQL and Drizzle ORM**.

Patients can browse specialists, book appointments, upload reports, view digital prescriptions and maintain a health profile. Doctors manage their schedule, patients and prescriptions. Administrators manage all records and monitor audit logs and operational statistics.

---

## 1. What is included

- Responsive marketing site matching the CareWell reference design
- Public doctor directory with live search and department filters
- Guided booking flow with inline sign-up/sign-in, slot selection and optional report upload
- JWT authentication using HTTP-only cookies, scrypt password hashing and RBAC
- Patient, doctor and admin dashboards
- Full CRUD for appointments, patients, doctors, prescriptions and medical files
- Scope-aware search/filter endpoints and admin analytics
- Multipart file upload with MIME/type/size validation and protected downloads
- Zod validation, centralised API error handling and database audit logging
- Idempotent seed data for doctors, patients, appointments and prescriptions
- Unit tests, GitHub Actions CI, API documentation and architecture documentation

## 2. Architecture

```mermaid
flowchart LR
  Browser[React Browser UI] --> Next[Next.js App Router]
  Next --> Pages[Server-rendered pages]
  Next --> API[REST route handlers]
  API --> Auth[JWT + RBAC + ownership checks]
  Auth --> Zod[Zod request validation]
  Zod --> Drizzle[Drizzle ORM]
  Pages --> Drizzle
  Drizzle --> PG[(PostgreSQL)]
  API --> Logs[(Activity logs)]
  API --> Files[(Medical file content)]
  PG --- Logs
  PG --- Files
```

The frontend and backend are one deployable Next.js application. Server components use Drizzle directly; client dashboards call the same protected domain rules through `/api` route handlers. The `/architecture` page contains an expanded visual, schema list and security/performance notes.

## 3. Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Next.js 16 App Router, Tailwind CSS 4, Lucide icons |
| Backend | Next.js route handlers (Node.js runtime) |
| Database | PostgreSQL with Drizzle ORM and `node-postgres` pooling |
| Auth | `jose` HS256 JWT, HTTP-only cookies, Node `crypto.scrypt` |
| Validation | Zod |
| Testing/CI | Vitest, TypeScript, GitHub Actions |

## 4. Database structure

Defined in `src/db/schema.ts`:

- `users` — credentials, role (`admin`, `doctor`, `patient`), active state
- `patient_profiles` — demographics, allergies, blood group, medical history
- `doctor_profiles` — specialty, department, fee, availability, rating
- `appointments` — patient/doctor, date, slot, reason, status, clinician notes
- `prescriptions` — diagnosis, medications, notes, status, appointment link
- `medical_files` — filename, MIME type, size, base64 content and patient link
- `activity_logs` — actor, action, entity, detail, level and timestamp

Foreign keys use cascading deletes, and appointment/prescription/file lookups are indexed.

## 5. Local setup

```bash
npm install
cp .env.example .env
# Update DATABASE_URL and JWT_SECRET as needed
npx drizzle-kit push
npx tsx scripts/seed.ts
npm run dev
```

Open `http://localhost:3000`. The app also calls an idempotent `ensureSeeded()` helper on first public data request, so demo data is created automatically if the seed script has not been run.

Environment variables:

```env
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db
JWT_SECRET=replace-with-a-long-random-secret-in-production
```

Never commit real secrets. `JWT_SECRET` must be a long random value in production.

## 6. Demo accounts

All demo accounts use password `CareWell@123`.

| Role | Email | Destination |
| --- | --- | --- |
| Patient | `patient@carewell.test` | `/patient` |
| Doctor | `doctor@carewell.test` | `/doctor` |
| Administrator | `admin@carewell.test` | `/admin` |

Additional seeded doctor and patient accounts are available in `src/lib/constants.ts` and `src/lib/seed.ts`.

## 7. Main routes

| Route | Purpose |
| --- | --- |
| `/` | Responsive hospital landing page |
| `/book` | Appointment booking with inline authentication and file upload |
| `/login`, `/register` | Authentication and patient signup |
| `/patient` | Patient appointments, prescriptions, documents and profile |
| `/doctor` | Clinician schedule, patients, e-prescriptions and documents |
| `/admin` | Hospital statistics and full record administration |
| `/docs` | REST API reference |
| `/architecture` | System architecture, schema, security and deployment notes |
| `/api/health` | Healthcheck |

## 8. API summary

Full details and every endpoint are documented at `/docs`.

- **Auth:** `/api/auth/register`, `/login`, `/logout`, `/session`
- **Doctors:** `/api/doctors`, `/api/doctors/:id`
- **Patients:** `/api/patients`, `/api/patients/:id`
- **Appointments:** `/api/appointments`, `/api/appointments/:id`
- **Prescriptions:** `/api/prescriptions`, `/api/prescriptions/:id`
- **Uploads:** `/api/uploads`, `/api/uploads/:id`
- **Admin:** `/api/admin/stats`

Successful responses return resource objects. Errors use `{ "error": "...", "details": ... }` with meaningful HTTP status codes: 400 validation, 401 unauthenticated, 403 forbidden, 404 missing, 409 conflict, 500 unexpected.

## 9. Role-based access

| Capability | Patient | Doctor | Admin |
| --- | --- | --- | --- |
| Browse doctors | ✅ | ✅ | ✅ |
| Book appointments | ✅ own | — | ✅ for a patient |
| View appointments | ✅ own | ✅ assigned | ✅ all |
| Cancel appointments | ✅ own | ✅ assigned | ✅ all |
| Issue/edit prescriptions | — | ✅ own | ✅ all |
| View prescriptions | ✅ own | ✅ own | ✅ all |
| Upload/download files | ✅ own | ✅ patients in care | ✅ all |
| Manage doctors/patients | — | — | ✅ |
| View statistics and logs | — | — | ✅ |

Permissions are enforced in the API rather than relying on hidden UI. Patients can only cancel appointments; clinicians and administrators can update status and clinical notes.

## 10. Validation, logging and error handling

- Zod schemas in `src/lib/validation.ts` validate all JSON writes, including IDs, dates, enums and string lengths.
- `src/lib/http.ts` transforms thrown `ApiError`s into consistent responses and logs unhandled exceptions.
- `src/lib/logging.ts` records login, registration, CRUD, upload and delete events to `activity_logs`.
- `src/app/error.tsx` and `src/app/not-found.tsx` handle user-facing runtime and routing errors.
- Uploads accept only PDF, Word, text and common image MIME types up to 3 MB; downloads are private and scope-checked.
- Password hashes use unique salts and timing-safe comparison; JWT cookies are HTTP-only and `SameSite=Lax`.

## 11. Testing and CI

```bash
npx next typegen
npx vitest run
npx tsc --noEmit --pretty false
npm run build
```

`.github/workflows/ci.yml` runs dependency installation, route type generation, unit tests, TypeScript checks and a production build on every push and pull request. Tests cover password hashing, request validation and routing/format helpers.

## 12. Deployment

### Vercel + managed PostgreSQL

1. Create a PostgreSQL database on Render, Neon, Supabase or another managed provider.
2. Import the repository into Vercel as a Next.js project.
3. Add `DATABASE_URL` and a strong `JWT_SECRET` as environment variables.
4. Run `npx drizzle-kit push` and `npx tsx scripts/seed.ts` against the production database once.
5. Deploy. Vercel serves the React frontend and Node.js route handlers together.

### Render

Use a Render Web Service with build command `npm ci && npm run build` and start command `npm run start`, alongside a Render PostgreSQL instance. Add the same environment variables and run the schema push/seed commands from a shell or one-off job.

For production, use HTTPS, rotate `JWT_SECRET`, enable database backups, add rate limiting/WAF rules at the edge, and migrate medical file content to object storage when files exceed database-size guidelines.

## 13. Project structure

```text
src/app/
  api/                  REST route handlers
  admin/ doctor/ patient/   role-protected dashboards
  book/ login/ register/ docs/ architecture/
src/components/          React UI and dashboard workspaces
src/db/schema.ts         Drizzle PostgreSQL schema
src/lib/                 auth, validation, data queries, seed, logging, utilities
scripts/seed.ts          manual seed entrypoint
tests/                   Vitest unit tests
.github/workflows/       automated CI
```

---

Built as a complete demonstrator for a modern connected hospital experience. Clinical data shown is fictional.
