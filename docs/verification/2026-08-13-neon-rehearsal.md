# Neon rehearsal verification — 2026-08-13

## Scope

Migration `migrations/001_initial_practice_schema.sql` was applied only to the
expiring Neon branch `br-icy-dawn-b2jjp8gx` (`rehearsal-2026-08-13`) in project
`royal-darkness-08840874`.

The production branch `br-patient-glitter-b2p8hssz` (`main`) was not changed.

Migration `migrations/002_application_role_privileges.sql` was also rehearsed after
creating branch-local login role `svadhyaya_app`. It grants only connection, schema
usage, and CRUD access to the two application tables.

## Verified rehearsal state

- PostgreSQL 18.4 in `aws-eu-central-1`
- schema `svadhyaya` created
- tables `svadhyaya.users` and `svadhyaya.practice_days` created
- 16 columns matched the reviewed two-table design
- positive Telegram ID and non-blank timezone, locale and consent-version checks exist
- unique Telegram ID exists
- unique `(user_id, practice_date)` exists
- user foreign key cascades on deletion
- meditation completion requires non-null minutes of at least one
- incomplete meditation requires null minutes
- test transaction rolled back; both tables contain zero rows
- `svadhyaya_app` can select, insert, update and delete application rows
- `svadhyaya_app` cannot create tables in the application schema
- `svadhyaya_app` cannot truncate either application table
- the production branch was rechecked after rehearsal and still has zero tables in
  schema `svadhyaya`

## Constraint tests

`migrations/verify/001_initial_practice_schema.sql` verified:

- a valid svadhyaya and 20-minute meditation day succeeds
- completed meditation with null minutes fails
- completed meditation with zero minutes fails
- incomplete meditation with minutes fails
- duplicate user/date fails
- deleting the user cascades to practice days

## Schema authority comparison

The live rehearsal columns, defaults, constraints and indexes were compared with:

- `migrations/001_initial_practice_schema.sql`
- `src/db/schema.ts`

The mirror uses the live constraint names, including
`users_telegram_user_id_key` and `practice_days_user_date_unique`.

## Remaining approvals

This rehearsal is not production-apply approval. Before production:

- implement and test Telegram authentication and owner-scoped API queries
- create and verify a least-privilege application role
- finalize Spanish consent, export and deletion flows
- obtain explicit production-migration approval

## Rehearsal API smoke test

The local production server build was connected to the rehearsal branch using only
`svadhyaya_app`. A freshly signed synthetic Telegram Mini App payload for the allowlisted
user exercised:

- authenticated but not-yet-consented session lookup
- versioned consent creation
- manual svadhyaya completion
- 20-minute meditation completion
- history read
- machine-readable export
- immediate hard deletion

All expected responses succeeded. A final owner-role query confirmed zero users and zero
practice rows after deletion. The production branch and hosted Railway service were not
connected to Neon during this test.

Telegram authentication has unit coverage for valid, tampered, expired, future-dated and
duplicate-field payloads, following Telegram's official HMAC-SHA-256 validation method.

## Client persistence completion

The pre-production client now:

- initializes the official Telegram Mini App bridge and sends only `initData` as authentication proof
- requires the exact Spanish consent version `pilot-es-v1`
- leaves browser-only use local and permits declining cloud history
- migrates valid local marks from the permitted eight-day correction window only after consent
- loads server history only after current-version consent
- sends svadhyaya changes and only timer-completed meditation with at least one minute
- allows completed meditation to be unmarked as a correction but cannot manually create it
- provides in-app JSON export and immediate account/history deletion
- uses the Madrid calendar date when loading history
- keeps failed authenticated writes in a small device-local retry queue and flushes them on relaunch

A second rehearsal smoke test verified that an unknown consent version returns `400`, the
accepted version is returned by `/api/session`, practice and 20-minute meditation writes are
read back correctly, export succeeds, and deletion returns the session to unconsented. Final
rehearsal counts were again `0` users and `0` practice days. Production was not changed.
