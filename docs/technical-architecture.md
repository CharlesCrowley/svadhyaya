# Technical architecture

## Architecture decision

Use a Telegram Mini App and bot with a small web API. Keep media separate from transactional data and avoid a native application until the timer behaviour or offline requirements prove that one is necessary.

## Components

### Telegram bot

- Created and configured through BotFather.
- Presents the main **Open Practice App** action.
- Handles onboarding and reminder preferences.
- Sends scheduled reminders and deep links.
- Uses a webhook in production rather than long polling.

### Telegram Mini App

- Mobile-first web interface.
- Screens: Today, Chants, Meditation, History and Settings.
- Uses Telegram theme and safe-area values.
- Sends signed Telegram `initData` to the backend.
- Never trusts `initDataUnsafe` as proof of identity.

### Application API

- Validates Telegram Mini App authentication server-side.
- Issues a short-lived application session.
- Enforces access to each user's own practice records.
- Provides content catalogue and signed or public media URLs.
- Processes account export and deletion.
- Receives bot webhooks and runs reminder jobs.

### Database

PostgreSQL is recommended. It provides a straightforward migration path from a managed free tier to an organisation-controlled deployment.

### Audio storage

- Store master recordings outside the application repository.
- Publish web-optimised audio files through object storage.
- Keep recording rights and provenance in content metadata.
- Use stable object keys; do not expose storage administration credentials to the client.

## Authentication flow

1. Telegram opens the Mini App and supplies signed `initData`.
2. The client posts the raw `initData` to the application API.
3. The API validates its signature with the bot token using a constant-time comparison and checks freshness.
4. Before consent, identity remains ephemeral and no persistent user is created.
5. Once consent is accepted, the API creates or finds the internal user by Telegram user ID.
6. For private version 0.1, every request revalidates Telegram `initData`, derives ownership from it and checks the configured user allowlist.

A separate cookie, token-refresh or server-side session system is intentionally deferred. Revisit it before admitting other users or supporting access outside Telegram.

The bot token must only exist in server-side secret storage. Logs must not contain it or raw authentication payloads.

## Initial data model

### users

| Field | Purpose |
|---|---|
| id | Internal UUID |
| telegram_user_id | Unique Telegram identifier |
| timezone | User's IANA timezone |
| locale | Interface locale |
| consented_at | Required explicit privacy consent timestamp |
| consent_version | Required version of the accepted notice |
| created_at / updated_at | Audit timestamps |

### practice_days

| Field | Purpose |
|---|---|
| id | Internal UUID |
| user_id | Owner |
| practice_date | User-local calendar date |
| svadhyaya_complete | Manual daily completion |
| meditation_complete | Completion created by a finished timer |
| meditation_minutes | Required and at least one when meditation is complete; otherwise null |
| created_at / updated_at | Audit timestamps |

Use a unique constraint on `(user_id, practice_date)`. The API calculates streaks from dates where both fields are complete. Do not store a mutable streak counter. Audio metadata, playback progress and running timer state stay outside Postgres for the initial persistence slice.

## Timer implementation

Store these values locally when starting a session:

- `started_at`
- `target_duration_seconds`
- `expected_end_at`
- Current state: running, completed, cancelled

The remaining time is `max(0, expected_end_at - now)`. A visual interval only refreshes the display; it is not the clock. On application activation, recompute from timestamps. When a timer of at least one minute finishes, send an idempotent daily meditation upsert. Do not persist a running timer in the initial slice.

## Security baseline

- Validate Telegram authentication on every new application session.
- Apply database row-level access controls or equivalent API enforcement.
- Use rate limits on authentication, data mutation and bot webhook endpoints.
- Store secrets only in deployment secret management.
- Keep backups encrypted and retention limited.
- Record administrative changes to published content.
- Provide account export and hard deletion workflows.
- Avoid third-party behavioural analytics in the MVP.

## Suggested repository structure after implementation begins

```text
apps/
  mini-app/       Telegram Mini App frontend
  bot/            Bot webhook and reminder worker
packages/
  database/       Schema and migrations
  shared/         Shared validation and domain types
docs/             Product and technical documentation
```

Do not create empty application packages until the implementation stack has been selected.
