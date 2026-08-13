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
