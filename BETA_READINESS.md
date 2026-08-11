# Parenfy Beta Readiness Audit

**Date:** 2026-08-11  
**Stack (actual):** Next.js 14 · Neon PostgreSQL · Prisma · NextAuth · OpenAI · Vercel · PostHog  
**Note:** This repo does **not** use Supabase. Data isolation is enforced via **API auth + Prisma queries**, not Postgres RLS.

---

## Score legend

| Score | Meaning |
|-------|---------|
| **Ready** | Acceptable for public beta |
| **Partial** | Works but has gaps; monitor or fix soon |
| **Missing** | Launch blocker or high risk |

---

## Audit summary

| Area | Score | Notes |
|------|-------|-------|
| Auth & session hardening | **Partial** | Middleware on app routes; login lacks rate limit; OAuth account linking risk |
| RLS / data isolation | **Partial** | No Supabase RLS; most user APIs scoped by `userId`; some public GET leaks fixed in this PR |
| Server-only secrets | **Ready** | OpenAI/Stripe/DB secrets server-only; no client exposure found |
| AI cost controls | **Partial** | Chat + today plan quotas; journal/fridge tightened in this PR |
| Input validation & size limits | **Partial** | Registration validated; chat history capped; not all AI routes validate input size |
| Error & empty states in /app | **Partial** | Today has retry; chat has safe errors; empty states inconsistent across tabs |
| Observability | **Partial** | PostHog + `AnalyticsError` + founder dashboards; no Sentry/APM |
| Analytics (signup + first generation) | **Partial** | Signup tracked; `first_plan_generated` added in this PR |
| Legal basics | **Ready** | `/privacy`, `/terms`, `/contact`; AI usage described; register consent links |
| Support & beta expectations | **Ready** | Beta banner + feedback modal + `hello@parenfy.com` |
| User data export / backup | **Partial** | Manual founder CSV export; no self-serve user export |
| Performance (auth flash) | **Partial** | Middleware protects `/today` etc.; admin pages client-gated |

---

## 1. Auth & session hardening — **Partial**

**Ready**
- JWT sessions (30-day max), httpOnly cookies on custom login path
- `withAuth` middleware on core app routes (`/today`, `/mumbot`, `/profile`, …)
- Safe post-auth redirects (`resolveSafePostAuthUrl`) block open redirects
- Logout via NextAuth `signOut` + server analytics event
- Registration: reCAPTCHA/Turnstile + honeypot + IP rate limits + bot heuristics

**Partial / gaps**
- `/admin/*` was not in middleware matcher → **fixed:** added in this PR
- `/api/auth/login` has no rate limiting → **fixed:** IP rate limit added
- `allowDangerousEmailAccountLinking: true` on Google/GitHub OAuth — account takeover risk if email collision
- Per-route API auth (no global API middleware) — each route must enforce session

**Missing**
- MFA / email verification before full access
- Centralized API auth wrapper (reduces risk of new unprotected routes)

---

## 2. RLS / data isolation — **Partial**

**Context:** Neon + Prisma. Row Level Security (Supabase-style) is **not** configured. Isolation depends on application code.

**Ready**
- User-scoped routes (`/api/today`, `/api/chat`, `/api/onboarding`, billing) check `session.user.id`
- Conversations/messages filtered by `userId`
- Stripe webhook signature verified

**Partial**
- Community/meetups/activities GET routes return data without auth (by product design for discovery — review privacy)
- Exchange listings previously exposed `user.email` on public GET → **fixed:** auth required, email removed

**Missing**
- Postgres RLS policies (would require Supabase or raw SQL policies on Neon)
- Automated test suite for authorization on all API routes

---

## 3. Server-only secrets — **Ready**

- `OPENAI_API_KEY` used only in server modules (`provider.ts`, `mumbot.ts`, API routes)
- No `NEXT_PUBLIC_OPENAI_*` variables
- Stripe secret + webhook secret server-only
- `NEXT_PUBLIC_*` limited to PostHog, reCAPTCHA site key, app URL

**Action:** Never prefix AI or database credentials with `NEXT_PUBLIC_`.

---

## 4. AI cost controls — **Partial**

**Ready**
- Plan tiers: FREE = 1 plan/day, 3 chats/day, 20 AI generations/month
- `assertCanChat`, `assertCanGenerateTodayPlan`, `assertCanUseAI`
- MumBot rate limit: 15 msgs/hour, 60/day
- Admin bypass via `isAdmin` / `ADMIN_EMAIL`
- Semantic cache for personalization (Redis + Neon)
- AI usage logging + founder cost dashboard (`/admin/costs`)
- `max_tokens` capped per feature (400 default gateway; chat 1000)

**Partial**
- Journal + fridge meal routes lacked monthly quota → **fixed** in this PR
- TTS / image generation routes still without quota (lower volume; monitor in founder dashboard)
- Two AI code paths (legacy `mumbot.ts` vs `completeAI` gateway)

**Missing**
- Hard daily spend cap / kill switch env var
- Alerting when spend exceeds threshold (PagerDuty/Slack)

---

## 5. Input validation & size limits — **Partial**

**Ready**
- Registration: email, password length, name validation, CAPTCHA
- Chat: requires messages array, strips welcome message, max 12 messages in provider path

**Partial**
- Fridge ingredients list bounded by client; server should cap array length → **fixed:** max 30 items
- Journal check-in sentence length not explicitly capped

**Missing**
- Zod schemas on all API bodies
- Global request body size policy documentation

---

## 6. Error & empty states in /app — **Partial**

**Ready**
- `/today` — loading, error with retry, profile nudge
- `/app/error.tsx` — global crash boundary + analytics
- Chat API — user-safe messages (no raw OpenAI errors to client)
- Shared `EmptyState` on activities, memory, exchange

**Partial**
- `/mumbot`, `/saved`, `/library` — minimal empty/loading UX
- AI failures on journal/fridge returned raw errors → **fixed:** safe messages

**Missing**
- Consistent empty-state component across all tabs

---

## 7. Observability — **Partial**

**Ready**
- `trackServerError` → Postgres `AnalyticsError` + PostHog
- Founder error dashboard (`/admin/founder/errors`)
- Structured console logs on API failures
- Vercel captures serverless function logs

**Partial**
- No Sentry/Datadog
- Health check exposed DB details → **fixed:** production health is minimal

**Missing**
- External uptime monitoring
- Log aggregation beyond Vercel dashboard

---

## 8. Analytics — **Partial**

**Ready**
- `signup_started`, `signup_completed` (client + server)
- Product funnel in founder dashboard
- PostHog session recording (masked inputs)
- Session + referral attribution

**Partial**
- No dedicated “first AI generation” before → **fixed:** `first_plan_generated` event on first successful LLM plan

**Missing**
- PostHog funnels/alerts configured in PostHog UI (ops task, not code)

---

## 9. Legal basics — **Ready**

- `/privacy` — data collected, analytics, child info, deletion contact
- `/terms` — beta disclaimer, not medical advice
- Register page links to Terms + Privacy
- Contact: `hello@parenfy.com` (`/contact`)

---

## 10. Support & beta expectations — **Ready**

- `PublicBetaBanner` on `/today`, `/mumbot`, `/connect`, `/profile`
- In-app Feedback button → `BetaFeedback` table
- Landing page beta expectations copy
- Support email linked in banner → **enhanced** in this PR

---

## 11. User data export / backup — **Partial**

**Ready**
- Founder CSV export (`/api/admin/founder/export`)
- Neon backups (platform-level; configure in Neon console)

**Missing**
- Self-serve “Download my data” for users
- Documented GDPR deletion runbook (contact email only)

---

## 12. Performance (protected route flash) — **Partial**

**Ready**
- Middleware runs before `/today`, `/mumbot`, etc. — unauthenticated users redirect to sign-in without loading app shell data fetchers in most cases

**Partial**
- `/admin/*` loaded client-side auth check before → middleware added
- React hydration may briefly show loading states (acceptable)

---

## Changes in this PR (Pass B)

1. `.env.example` — complete variable list for Vercel deploy
2. `/api/health` — minimal liveness; `/api/health/db` redacted in production
3. Exchange GET — requires auth; no email in response
4. Production registration — fail closed if no CAPTCHA secrets (unless `ALLOW_INSECURE_REGISTRATION=true`)
5. Login IP rate limiting
6. `/admin/*` added to auth middleware
7. AI safe error helper + journal/fridge quota + safe errors
8. `first_plan_generated` analytics event
9. Beta banner support email link
10. CSP updated for reCAPTCHA/Turnstile domains

---

## Launch blockers (explicit)

| Blocker | Owner action |
|---------|----------------|
| Set `RECAPTCHA_*` or `TURNSTILE_*` in Vercel production | Founder |
| Set `UPSTASH_REDIS_*` for registration/login rate limits | Founder |
| Set `OPENAI_API_KEY`, `DATABASE_URL`, `NEXTAUTH_SECRET` | Founder |
| Review OAuth `allowDangerousEmailAccountLinking` | Engineering follow-up |
| Configure Neon backup retention | Founder (Neon console) |
| Optional: PostHog production project + alerts | Founder |

---

## Verdict: **Ship with blockers**

**Justification:** Core parent flows (auth, today plan, chat) are protected with session auth, AI quotas on primary routes, legal pages, beta feedback, and founder observability. This is sufficient for a **limited public beta** with real users, provided CAPTCHA keys and Upstash are configured in production and the team monitors the founder dashboard for errors/cost.

**Do not** open unrestricted registration without CAPTCHA in production. **Do not** treat community/exchange discovery APIs as private — they expose public-ish metadata by design.

**Not in scope (post-beta):** Billing hardening, teams, self-serve data export, Sentry, email verification, disabling OAuth dangerous linking, RLS migration to Supabase.
