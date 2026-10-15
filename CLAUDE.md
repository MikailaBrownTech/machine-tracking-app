# Maintenance tracker (portfolio MVP)

Small CMMS for shops/facilities. Scope: (1) assets CRUD + QR page at /assets/[id]; (2) work orders with status flow open -> in_progress -> done.

## Stack

Next.js App Router, TypeScript strict (no `any`), Neon Postgres, Drizzle (SQL migrations), Zod, Tailwind, shadcn/ui, Vitest, Playwright, GitHub Actions. Deploy: Vercel.

## Schema

- assets: id uuid pk, name (CHECK trim <> ''), type, location, serial (unique where not null), status enum(active|inactive|retired), created_at
- work_orders: id uuid pk, asset_id fk (RESTRICT, indexed with created_at DESC), title (CHECK trim <> ''), description, priority enum(low|medium|high), status enum(open|in_progress|done), created_at, completed_at nullable. CHECK (status='done') = (completed_at IS NOT NULL); CHECK completed_at >= created_at
- work_order_events: id uuid pk, work_order_id fk (RESTRICT, indexed with created_at), from_status nullable, to_status, note, created_at. CHECK from_status IS DISTINCT FROM to_status. Append-only: trigger rejects UPDATE/DELETE; app role has INSERT+SELECT only.
- Never hard-delete assets or work orders.

## Rules

- Reads in Server Components, writes in Server Actions. No separate REST API.
- Zod-validate all input. Status transitions live in one pure function. A status change and its event row share one transaction.
- DB enforces valid values and consistency; the transition rules stay in the pure function.
- Mobile-first, large tap targets.
- Out of scope: auth, multi-tenancy, offline, recurring schedules, photo uploads, billing.
- No new libraries without a one-line reason. Never commit secrets; never read or print .env.local.

## Working style

Be terse. No plans or explanations unless asked. After each step, reply with at most 3 lines: what changed and how to verify. Conventional Commits, one commit per step.
