# Orbit — AI Employee Onboarding Hub

Orbit is a full-stack onboarding command center for People Operations teams. It tracks upcoming hires, readiness, progress, and blockers, and turns an approved employee profile into a structured first-week plan that a manager can review before sharing.

## Live application

Deployment URL: **[add after deployment]**

## Product highlights

- Responsive onboarding dashboard with operational metrics and search.
- Persistent new-hire creation with server-side validation and duplicate protection.
- PostgreSQL schema for employees and versioned AI-generated plans.
- AI planner that produces five-day, role-aware onboarding plans.
- Clear loading, empty, validation, database, and AI failure states.
- Mobile navigation, accessible form labels, and review-before-sharing language.

## Technology stack

- **Frontend:** Next.js App Router, React, TypeScript, custom responsive CSS, Lucide icons
- **Backend:** Next.js Route Handlers with Zod validation
- **Database:** PostgreSQL using parameterized queries through `postgres`
- **AI:** OpenAI Responses API with strict JSON Schema structured output
- **Deployment target:** Vercel plus Neon, Supabase, or another managed PostgreSQL service

## How the AI feature works

`POST /api/plans` loads an approved employee record from PostgreSQL and sends only the minimum useful context—name, role, department, location, manager, and start date—to OpenAI. The system instruction treats all employee fields as untrusted data, prohibits invented policies/links/people and sensitive inferences, and describes the result as a draft.

The response must match a strict JSON Schema containing a summary, welcome note, priorities, five-day schedule, manager actions, and risks. The API disables response storage, applies a 25-second timeout and one bounded retry, validates configuration and employee IDs, handles provider/parse failures without exposing internal errors, and stores successful plans with model and prompt-version metadata.

The implementation follows the current [OpenAI Responses API documentation](https://developers.openai.com/api/reference/typescript/resources/beta/subresources/responses/methods/create).

## Local setup

Requirements: Node.js 20+, npm, Docker (or an existing PostgreSQL database), and an OpenAI API key for plan generation.

```bash
cp .env.example .env.local
docker compose up -d
npm install
npm run db:migrate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The migration creates the schema and four review-friendly demo records. Add `OPENAI_API_KEY` to `.env.local` to enable AI plan generation; the rest of the product remains explicit about configuration failures.

Environment variables:

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `OPENAI_API_KEY` | For AI | Server-only OpenAI credential |
| `OPENAI_MODEL` | No | Model override; defaults to `gpt-5-mini` |

Never expose `OPENAI_API_KEY` through a `NEXT_PUBLIC_` variable.

## Commands

```bash
npm run dev         # local development
npm run typecheck   # strict TypeScript check
npm run lint        # ESLint and Next.js rules
npm run build       # production build
npm run db:migrate  # create schema and idempotent seed data
```

## API routes

- `GET /api/health` — deployment health signal.
- `GET /api/employees` — employees, latest plans, and dashboard metrics.
- `POST /api/employees` — validated employee creation.
- `POST /api/plans` — schema-constrained AI plan generation and persistence.

## Deploying to Vercel

1. Create a PostgreSQL database in Neon, Supabase, Railway, or another provider.
2. Run `DATABASE_URL="..." npm run db:migrate` against that database.
3. Import this directory as a Vercel project and set the root directory to `onboarding-hub` if deploying from the assessment repository.
4. Add `DATABASE_URL`, `OPENAI_API_KEY`, and optionally `OPENAI_MODEL` in Vercel project settings.
5. Deploy and verify `/api/health`, employee creation, persistence after refresh, and AI plan generation.

## Production considerations

This assessment implementation omits authentication to keep review friction low. A production release would add SSO, organization/role scoping, row-level authorization, audit events, rate limiting, content/privacy review, migration tooling, integration tests, and separate staging/production databases. Generated plans should remain drafts until an authorized manager approves them.
