# Immediate next steps

## Target

Produce a private Telegram-openable prototype that Charlie can use for one complete morning practice on a Samsung Galaxy A52s.

The prototype should prove the experience before permanent cloud infrastructure is introduced.

## Build order

### Step 1 — Establish the application baseline

Owner: implementation.

- Scaffold one TypeScript project with a Vite/React frontend and small Express server.
- Add Tailwind, React Query, Zod and Vitest.
- Add commands for development, build, type-check and tests.
- Serve the frontend and local audio from the Express service.
- Add a safe environment loader for the existing Telegram variables.
- Add a minimal `/health` endpoint.
- Record the agreed practice rules in ADR-0002.
- Create the repository's initial commit after verification.

Deliverable: a branded app shell opens in a desktop browser and at an A52s-sized viewport.

### Step 2 — Build the complete local morning experience

Owner: implementation.

- Implement the Today screen using the documented Advaita Vidya palette.
- Display the five chant sections in order.
- Build one persistent audio player with play, pause, seek, previous and next.
- Add **Play complete practice** using the five files as a continuous queue.
- Save the active track and playback position in browser storage.
- Add the 10, 20, 30 and 60-minute meditation presets.
- Use a simple generated Web Audio chime for the prototype; no separate bell asset is required yet.
- Calculate the timer from timestamps so reload and suspension do not lose elapsed time.
- Add manual svadhyaya and meditation completion.
- Add a seven-day history using browser storage.

Deliverable: the whole flow works locally without a database or cloud storage.

### Step 3 — Test the experience on the Samsung A52s

Owner: implementation with a short Charlie test.

- Expose the local app temporarily through an HTTPS development tunnel.
- Configure the bot's temporary Mini App/menu URL.
- Validate Telegram `initData` and permit only Telegram user `711613757`.
- Open the app from `@svadhyaya_advaitavidya_bot`.
- Test audio start, seek, section change and resume.
- Test a one-minute timer while active, minimised and phone-locked.
- Test Android font scaling and Telegram's available viewport.
- Adjust touch sizes, spacing and player behaviour from the real-device findings.

Deliverable: Charlie completes one test practice from inside Telegram.

### Step 4 — Decide whether the interaction is good enough

Owner: Charlie.

Answer only:

1. Is starting the desired chant fast and obvious?
2. Should **Play complete practice** or individual sections be the main action?
3. Does the timer behave acceptably when Telegram is minimised or locked?
4. Are manual completion controls natural after practice?
5. Is anything distracting during the practice itself?

Fix only issues that obstruct actual morning use. Do not add reminders, administration or social features here.

### Step 5 — Add permanent storage and deployment

Start only after Step 4 passes.

- Create one Railway production service.
- Create one separate EU Neon project.
- Use the existing private Railway audio bucket containing the five verified sections.
- Add the narrowed two-table database slice for versioned consent and daily practice history. Keep timers and playback state local for the pilot.
- Replace browser-only history with authenticated API persistence.
- Retain browser storage as a temporary offline/retry buffer, not the authority.
- Deploy, set the permanent Mini App URL and run the release checklist.

Deliverable: practice history and playback progress survive device/browser storage loss.

### Step 6 — Three-morning pilot

- Use the app for three consecutive real mornings.
- Record friction in a short note after each practice.
- Confirm no duplicate or missing practice entries.
- Confirm audio resume and timer behaviour.
- Choose at most one improvement for the following week.

## What Charlie needs to do

### Before the Telegram device test

- Listen to approximately five seconds before and after each of the four audio boundaries.
- Confirm the recording can be used in this private prototype.

### Before public or organisational use

- Confirm written streaming/distribution permission.
- Provide the approved Advaita Vidya logo asset or approve use of the current official logo.
- Confirm the preferred spelling of the five track titles.

### Later, when Step 5 begins

- Sign in to Railway, Neon and Cloudflare if account creation or authorization is required.

Nothing else is needed from Charlie before Steps 1 and 2.

## Scope guard

Do not add these before the three-morning pilot:

- Daily reminders
- Admin tools
- Multiple users
- Analytics
- Payments
- Public registration
- Full Sanskrit transcripts
- Native Android packaging
- Advanced streak mechanics

## Expected sequence

| Work block | Result |
|---|---|
| 1 | Repository and branded app shell |
| 2 | Local audio, timer and habit prototype |
| 3 | Telegram/A52s device test |
| 4 | Focused usability corrections |
| 5 | Permanent deployment and persistence |
| 6 | Three real mornings of validation |

The next implementation action is **Step 1: establish the application baseline**.
