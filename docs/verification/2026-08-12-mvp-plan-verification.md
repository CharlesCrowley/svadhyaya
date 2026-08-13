# MVP plan verification — 12 August 2026

## Verdict

The product direction is sound, but the original plan left several behaviours undefined. The independent review rated it as not implementation-ready.

This does **not** mean the personal MVP needs enterprise infrastructure. We should remove ambiguous promises and make a few small design decisions before coding.

## Verified foundations

- Firstly Academy provides useful Vite, React, Express, TypeScript, React Query, Drizzle, Zod and Vitest patterns.
- WhatsEnglish provides useful Railway, migration, configuration and private-media patterns.
- A separate database project follows the database governance isolation policy.
- Server-side Telegram Mini App `initData` validation is the correct identity entry point.
- Timestamp-derived timer calculations are correct.
- Unique daily records and a partial unique index for an active timer are appropriate.
- Private Cloudflare R2 delivery using temporary URLs is feasible.

## Severe findings

1. The authentication session, expiration, replay and request-forgery protections were unspecified.
2. A Telegram WebView cannot guarantee a closing bell at the exact deadline while suspended or locked.
3. The proposed authentication flow could persist Telegram identity before consent.
4. The plan required a tested restore without defining backup frequency or retention.
5. The schema did not completely guarantee that a timer produces exactly one daily meditation record.

Other findings covered media Range requests and URL refresh, Telegram webhook retries, date and duration limits, release/secret-replacement procedures, and stale cost assumptions.

## Proportional MVP response

| Finding | Small version 0.1 solution |
|---|---|
| Authentication | Validate fresh Telegram `initData` on every API request. Do not build a separate session system yet. |
| Private access | Reject every valid Telegram identity except Charlie's configured numeric user ID. |
| Request forgery | Require valid `initData`, same-origin requests and JSON content type for mutations. |
| Closing bell | Guarantee it while the Mini App is active; after suspension, play it when the app resumes. |
| Consent | Show consent before creating the first persistent user or practice record. |
| Backups | Make one encrypted daily database export with 14-day retention and test one restore. |
| Timer integrity | Complete a running session once and create/update its daily entry in one transaction. |
| Audio | Use direct temporary R2 URLs with Range support and refresh when necessary. |
| Webhook retries | Ignore an update when its `update_id` is not newer than the last processed value. |
| Observability | Use redacted Railway logs and one external health check. |
| Deployment | Use a short manual release checklist. Add CI only when it provides demonstrated value. |

## Deliberately not required for version 0.1

- Database-backed application sessions or refresh tokens
- Multiple permanent deployment environments
- A consent-management platform
- Distributed tracing or a metrics stack
- A content-management interface
- Cross-region disaster recovery
- Queues, microservices or Kubernetes
- Complex event ledgers
- A native mobile application

## Revisit triggers

Reconsider these simple choices when the app admits other users, exposes data to administrators, adds reminders or payments, distributes licensed audio broadly, or promises an exact locked-screen alarm.

## Review scope

The independent verifier read 1,358 lines across 10 primary files and checked local application patterns plus current Telegram, Railway, Neon, Cloudflare R2 and European Commission documentation.
