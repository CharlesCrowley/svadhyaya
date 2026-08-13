# ADR-0001: Separate application and database

## Status

Accepted

## Context

Advaita Vidya Svadhyaya is not an ESL product. Its identity comes from Telegram rather than Clerk, Supabase or WhatsEnglish's local onboarding. Its practice history can also reveal religious or philosophical beliefs.

The existing ESL applications share a Neon project, but current database governance explicitly reserves that project for first-class ESL capabilities benefiting from shared identity, sessions, errors, XP, entitlements or reporting.

## Decision

Run Svadhyaya as a separate application with a separate Neon project and separate deployment configuration.

- This repository owns the application and migrations.
- Application tables live in the `svadhyaya` schema.
- Telegram user identity maps to an internal UUID.
- No ESL `public.*` tables or cross-app identity bridges are used.
- The initial deployment is one Railway service serving Express, the Telegram webhook and the built Vite/React Mini App.
- Audio is stored in a private Railway storage bucket and streamed through the application server with HTTP range support. Storage credentials are never exposed to the client.
- The isolated Neon project is `royal-darkness-08840874` in Frankfurt (`aws-eu-central-1`). Its production branch remains schema-empty until a reviewed migration is explicitly approved.

## Consequences

### Positive

- Sensitive practice data has a smaller access and failure boundary.
- Telegram authentication remains simple and does not add another login.
- The app can be deployed, restored or deleted independently of the ESL ecosystem.
- Database migrations have one unambiguous owner.
- Existing engineering patterns can still be reused at the code level.

### Negative

- Another database project and deployment require maintenance.
- There is no automatic cross-app identity or shared operational dashboard.
- Some infrastructure configuration is duplicated.

### Neutral

The product can later move providers without changing its isolation boundary. A public organisational release should revisit capacity, backups, processor agreements and access controls, but should not join the ESL database merely for convenience.
