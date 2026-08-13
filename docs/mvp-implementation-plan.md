# Morning-practice MVP implementation plan

## Outcome

Ship a private Telegram Mini App that Charlie can reliably use during morning practice on his phone.

The first usable version must let him:

1. Open the app from Telegram without another login.
2. Play one authorised chant recording.
3. Run a meditation timer with an ending bell.
4. Mark svadhyaya and meditation complete for today.
5. See recent practice days and basic totals.

This is deliberately smaller than the organisational MVP in the product brief. It validates the daily ritual before building administration, reminders, multiple users or a full content library.

The independent review and proportional response are recorded in [MVP plan verification](verification/2026-08-12-mvp-plan-verification.md).

## Simplicity rules

- One repository, one service, one database and one audio bucket.
- One authorised user, configured by Telegram numeric user ID.
- Validate Telegram `initData` on every request; do not build a separate application-session system yet.
- Local development and one production environment are enough.
- Prefer focused tests and a short runbook over new infrastructure.
- Add a component only when it removes a demonstrated blocker for morning use.

## Architecture recommendation

Use one TypeScript repository and one Railway service:

```text
Telegram
  +-- private bot
  +-- Mini App web view
          |
          v
Railway service
  +-- Express API and Telegram webhook
  +-- built Vite/React Mini App
  +-- Drizzle migrations
          |
          +-- separate Neon PostgreSQL project
          +-- Cloudflare R2 audio bucket
```

### Reuse from existing apps

| Existing app | Pattern to reuse | What not to copy |
|---|---|---|
| Firstly Academy | Vite + React, Express, TypeScript, React Query, `apiRequest`, Zod, Drizzle and Vitest | Clerk, XP, learning-module and shared-session systems |
| WhatsEnglish | Railway deployment, central environment validation, Drizzle migration discipline, signed/private media approach, idempotent scheduled-work patterns | WhatsApp/Meta pipeline, student/teacher split identity and shared ESL schema |
| Free-English | Mobile-first Tailwind patterns and explicit Cloudflare deployment verification | Static Next.js export, Supabase identity bridge, SEO and anonymous-session architecture |
| Database governance | Explicit ownership, migration authority, invariants and isolation decision | The ESL production project itself |

### Data placement

- **Project:** a new, separate Neon project in an EU region.
- **Schema:** `svadhyaya` rather than `public` for application tables.
- **Owning repo:** this repository.
- **Migration authority:** `migrations/*.sql`, mirrored by `src/db/schema.ts`.
- **Identity:** Telegram user ID, mapped to an internal UUID. No connection to `public.users` in the ESL database.
- **Shared ESL surfaces:** none. Do not write to ESL `public.users`, `sessions`, `errors`, `xp_events` or entitlements.

This follows the database governance Tier 4 placement rule: the auth model is incompatible with the ESL identity assumptions and the practice history warrants its own privacy and failure boundary.

## Locked scope for version 0.1

### Must have

- Private bot restricted to Charlie's Telegram user ID.
- Telegram Mini App authentication validated on the server.
- Today screen with two completion controls.
- One Guru Gita or other authorised audio track.
- Play, pause and seek.
- Save and restore playback position.
- 10, 20, 30 and 60-minute timer presets plus custom minutes.
- Optional opening bell and a closing bell while the Mini App is active, or immediately on resume.
- Timer derived from timestamps and restored after Mini App suspension.
- Record completed meditation duration.
- Seven-day view, current streak and total practice days.
- Europe/Madrid as the initial practice timezone.
- A way to correct today's record.
- Basic privacy notice and delete-my-data operation.
- Production health endpoint, structured error logging and database backup policy.

### Should have if it does not delay first use

- Install/open shortcut from the bot profile.
- A 30-day calendar rather than only seven days.
- Manual resume-position reset.
- Haptic feedback on timer start and completion.

### Explicitly deferred

- Daily reminders
- Multiple chant catalogue and search
- Admin interface
- Public registration
- Streak freezes, points, badges or leaderboards
- Sanskrit text, transliteration or translation
- Notes or journal entries
- Offline download
- Organisation analytics
- Payments

## Practice rules to decide before coding

These affect schema and acceptance tests. Record the answers in ADR-0002.

1. Does a practice day count when either habit is complete, or only when both are complete?
2. Does listening to any part of a chant automatically count as svadhyaya, or is completion always manual?
3. What minimum meditation duration counts as complete?
4. Should an interrupted timer be resumable or discarded?
5. Is the practice date always based on Europe/Madrid, even while travelling?

Recommended defaults for the personal MVP:

- Track the habits separately; “complete day” means both are complete.
- Svadhyaya is marked manually, because audio playback is not proof of attentive practice.
- Any deliberately completed timer of at least one minute counts; presets remain the normal path.
- An interrupted timer can be resumed until the end of the local day.
- Use the user's stored IANA timezone, initially `Europe/Madrid`.

## Implementation sequence

### Milestone 0 — Inputs and accounts

Estimated effort: half a day of coordination.

- [ ] Select the first recording and confirm written distribution permission.
- [ ] Obtain the final MP3 and a short title/source description.
- [ ] Select or create opening and closing bell audio with documented rights.
- [ ] Create the Telegram bot through BotFather.
- [ ] Record Charlie's Telegram numeric user ID securely in deployment configuration.
- [ ] Configure the bot's Main Mini App placeholder once a staging URL exists.
- [ ] Create a separate Neon project in an EU region.
- [ ] Create a private Cloudflare R2 bucket.
- [ ] Create a Railway project and staging service.
- [ ] Decide the five practice rules above.

Exit condition: all external accounts and audio inputs exist; no production secrets are committed.

### Milestone 1 — Walking skeleton

Estimated effort: one day.

- [ ] Scaffold Vite + React + TypeScript frontend and Express backend.
- [ ] Add Tailwind, React Query, Drizzle, Zod and Vitest.
- [ ] Serve the built frontend and `/api/*` from the same Express service.
- [ ] Add central, fail-fast environment validation.
- [ ] Add `/health` with application and database readiness results.
- [ ] Add a Telegram webhook endpoint with secret-token verification.
- [ ] Add the bot's `/start` response with an **Open Practice** button.
- [ ] Validate raw Telegram Mini App `initData` on every API request, including hash, freshness and constant-time comparison.
- [ ] Enforce the private-user allowlist after authentication.
- [ ] Require same-origin JSON mutations and cap request-body sizes.
- [ ] Ignore Telegram webhook retries and older updates using `update_id`.
- [ ] Deploy staging to Railway and open it from Telegram on Charlie's phone.

Exit condition: the private app opens inside Telegram and the API knows the authenticated, allowlisted Telegram user.

### Milestone 2 — Database and daily practice

Estimated effort: one day.

- [ ] Write the initial SQL migration with constraints and indexes.
- [ ] Rehearse it against a disposable Neon branch before applying to the app project.
- [ ] Implement idempotent `PUT /api/practice/:date/:type` mutation.
- [ ] Implement `GET /api/today` and `GET /api/history`.
- [ ] Build the Today screen with svadhyaya and meditation controls.
- [ ] Build the seven-day history and summary.
- [ ] Calculate streaks from user-local dates rather than storing a mutable counter.
- [ ] Test timezone boundaries and duplicate completion requests.

Exit condition: Charlie can mark and correct both habits and see the result after closing and reopening Telegram.

### Milestone 3 — Audio practice

Estimated effort: one day.

- [ ] Optimise the authorised MP3 for mobile streaming.
- [ ] Upload it to the private R2 bucket through an operator script.
- [ ] Seed track metadata with provenance and rights basis.
- [ ] Issue short-lived direct R2 GET URLs and provide an authenticated refresh endpoint.
- [ ] Configure R2 CORS and verify HTTP Range requests for seeking.
- [ ] Build the audio player with play, pause, seek, duration and loading states.
- [ ] Save playback progress periodically and on pause/page deactivation.
- [ ] Restore progress on the next opening.
- [ ] Test slow connection, interruption and expired media URL behaviour.

Exit condition: the recording starts quickly on the actual morning-practice device and resumes close to the previous position.

### Milestone 4 — Reliable meditation timer

Estimated effort: one to two days because mobile behaviour needs real-device testing.

- [ ] Implement timer presets and custom duration validation.
- [ ] Store `started_at`, `expected_end_at`, duration and status.
- [ ] Recompute remaining time from the clock after activation or reload.
- [ ] Make completion idempotent and create one meditation practice record.
- [ ] Add opening/closing bell playback and explicit audio permission handling while the app is active.
- [ ] Display a clear state if the Mini App was suspended past the finish time.
- [ ] Test Telegram foreground, minimised, phone locked and interrupted-call cases on iPhone and Android where available.
- [ ] Document any client limitation rather than disguising it.

Exit condition: the timer neither loses time nor creates duplicate sessions. The bell sounds at the deadline while active; after suspension it sounds on resume. Exact locked-screen delivery is not promised.

### Milestone 5 — Privacy, resilience and morning launch

Estimated effort: one day.

- [ ] Show privacy consent before creating the first persistent user or practice record.
- [ ] Add authenticated export and hard deletion.
- [ ] Ensure logs omit Telegram authentication payloads, bot tokens and practice details.
- [ ] Configure error reporting with sensitive-data scrubbing, or retain minimal structured Railway logs for the private pilot.
- [ ] Create an encrypted daily database export with 14-day retention and test restoring it into an isolated database.
- [ ] Write a short release checklist covering build, tests, migration, smoke check and replacement of compromised secrets.
- [ ] Run the end-to-end acceptance checklist below.
- [ ] Configure the production Mini App URL in BotFather.
- [ ] Use it for three consecutive mornings before adding features.

Exit condition: version 0.1 is usable, recoverable and private enough for the single-user pilot.

## Initial schema

Keep version 0.1 to five tables.

### `svadhyaya.users`

- `id UUID PRIMARY KEY`
- `telegram_user_id BIGINT UNIQUE NOT NULL`
- `display_name TEXT NULL`
- `timezone TEXT NOT NULL DEFAULT 'Europe/Madrid'`
- `consented_at TIMESTAMPTZ NULL`
- `consent_version TEXT NOT NULL`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`

### `svadhyaya.audio_tracks`

- `id UUID PRIMARY KEY`
- `title TEXT NOT NULL`
- `teacher_or_source TEXT NOT NULL`
- `description TEXT NULL`
- `duration_seconds INTEGER NOT NULL CHECK (duration_seconds > 0)`
- `object_key TEXT UNIQUE NOT NULL`
- `rights_basis TEXT NOT NULL`
- `rights_notes TEXT NULL`
- `published_at TIMESTAMPTZ NULL`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`

### `svadhyaya.playback_progress`

- `user_id UUID REFERENCES svadhyaya.users(id) ON DELETE CASCADE`
- `audio_track_id UUID REFERENCES svadhyaya.audio_tracks(id) ON DELETE CASCADE`
- `position_seconds INTEGER NOT NULL DEFAULT 0 CHECK (position_seconds >= 0)`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- primary key on `(user_id, audio_track_id)`

### `svadhyaya.practice_entries`

- `id UUID PRIMARY KEY`
- `user_id UUID REFERENCES svadhyaya.users(id) ON DELETE CASCADE`
- `practice_date DATE NOT NULL`
- `practice_type TEXT NOT NULL CHECK (practice_type IN ('svadhyaya', 'meditation'))`
- `duration_seconds INTEGER NULL CHECK (duration_seconds IS NULL OR duration_seconds >= 0)`
- `source TEXT NOT NULL CHECK (source IN ('manual', 'timer'))`
- `meditation_session_id UUID UNIQUE NULL`
- `completed_at TIMESTAMPTZ NOT NULL`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- unique constraint on `(user_id, practice_date, practice_type)`

### `svadhyaya.meditation_sessions`

- `id UUID PRIMARY KEY`
- `user_id UUID REFERENCES svadhyaya.users(id) ON DELETE CASCADE`
- `started_at TIMESTAMPTZ NOT NULL`
- `expected_end_at TIMESTAMPTZ NOT NULL`
- `target_duration_seconds INTEGER NOT NULL CHECK (target_duration_seconds > 0)`
- `status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'cancelled'))`
- `completed_at TIMESTAMPTZ NULL`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`

All foreign keys are `NOT NULL` unless explicitly marked nullable. Add checks that `expected_end_at > started_at`, timer duration is 1–180 minutes, and `completed_at` is present exactly for completed sessions.

Enforce at most one running session per user with a partial unique index. Complete it using a conditional `running → completed` update and link/upsert the daily meditation entry in one transaction. If a daily meditation entry already exists, retain one entry and use the greater recorded duration.

## API surface

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/consent` | Validate Telegram `initData`, accept consent and create the user |
| `GET` | `/api/today` | Today, active timer and featured track |
| `PUT` | `/api/practice/:date/:type` | Mark or correct one daily habit |
| `DELETE` | `/api/practice/:date/:type` | Remove an accidental mark |
| `GET` | `/api/history?from=&to=` | Calendar entries and calculated totals |
| `PUT` | `/api/tracks/:id/progress` | Idempotently save playback position |
| `POST` | `/api/meditation-sessions` | Start a timer session |
| `POST` | `/api/meditation-sessions/:id/complete` | Atomically complete the timer and habit |
| `POST` | `/api/meditation-sessions/:id/cancel` | Cancel a timer |
| `GET` | `/api/me/export` | Export personal data |
| `DELETE` | `/api/me` | Delete account and practice history |
| `POST` | `/telegram/webhook` | Receive bot commands and button activity |
| `GET` | `/health` | Deployment health check |

All mutations should be safe to retry. Do not accept a user ID from the browser as ownership proof.

For version 0.1, each request carries fresh-enough Telegram `initData`; the server validates it and derives ownership from the authenticated Telegram user. Ordinary completion uses server-calculated today. Corrections are limited to today and the previous seven days; future dates are rejected. Timer creation uses a client idempotency key and returns `409` when another timer is running.

## Tests required before first use

### Unit

- Telegram signature validation, expiry and malformed payloads
- Telegram allowlist and replay-window validation
- IANA timezone/local-date calculation around midnight and DST
- Streak calculation with gaps and separate habit types
- Timer remaining-time calculation after suspension
- Practice and session validation schemas

### Integration

- Non-allowlisted Telegram user is rejected
- Duplicate daily completion remains one row
- Deleting a mark updates history
- Duplicate timer completion creates one practice entry
- Concurrent timer completion creates one practice entry
- User cannot read another user's data
- Account deletion cascades through private data
- Expired media access is rejected
- Seeking uses a partial response and URL refresh preserves position

### Real-device acceptance

- Open from the Telegram bot on Charlie's primary phone.
- Start and seek the recording; reopen and confirm resume.
- Start a short test timer, minimise Telegram and return.
- Lock and unlock the phone during a timer; verify correct time and bell-on-resume without expecting an exact background alarm.
- Complete both habits and confirm the calendar after reopening.
- Cross local midnight in a controlled test or with a temporary timezone.
- Simulate offline/reconnect and verify no duplicate completion.
- Export data, then test deletion using a disposable account before using the real record.

## Definition of done

Version 0.1 is done when:

- Charlie completes three real morning practices with it.
- No session or practice record is duplicated.
- The timer remains correct after the tested suspension paths.
- Audio playback resumes reliably enough for the chosen recording.
- The app contains no unauthorised media.
- Only Charlie can access the private pilot.
- Export and deletion have been exercised, and an encrypted backup has been restored into an isolated database.
- The recurring infrastructure cost remains within the agreed pilot ceiling, initially €0–10/month.

## After three mornings

Hold a short review and answer only:

- What caused friction before or during practice?
- Did the timer and bell behave as expected?
- Was manual habit completion natural?
- Was playback resume useful and accurate?
- What single addition would most improve the next seven mornings?

Add no more than one improvement before the next week of use. Reminders and additional recordings are the likely first candidates, but actual morning use should decide.

## Evidence reviewed

- Firstly Academy `AGENTS.md`, feature standardisation, package manifest and API-client conventions
- Firstly Academy shared `esl-docs` overview, while treating its older uniform-auth claims as superseded by database governance evidence
- WhatsEnglish `AGENTS.md`, engineering docs, Railway/Drizzle conventions, private S3 media helper and timezone-aware daily-prompt design
- Free-English `AGENTS.md`, deployment guide, auth/database conventions and Cloudflare/R2 deployment shape
- `~/database` source-of-truth, feature-gate, tenancy/isolation, shared-contract, migration and auth governance documents

## Evidence labels

- **Verified:** the three ESL apps use differing auth implementations and a shared Neon database governed by `~/database`.
- **Verified:** existing app patterns cover the proposed TypeScript, React, Express, Drizzle, Railway and object-storage components.
- **Verified:** the isolation policy places incompatible auth or privacy-isolated products in a separate project or deployment stamp.
- **Inference:** combining the Firstly web stack with WhatsEnglish deployment patterns will minimise learning and operational overhead.
- **Provisional:** Railway, Neon and R2 remain the final providers until accounts, current pricing and deployment constraints are confirmed during Milestone 0.
