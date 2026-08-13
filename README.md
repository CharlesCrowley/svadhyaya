# Advaita Vidya Svadhyaya

A Telegram Mini App for listening to Hindu chants and maintaining a simple, private record of svadhyaya and meditation practice.

## Status

This repository is in the discovery and planning phase. The proposed MVP combines:

- A Telegram Mini App for the audio library, meditation timer, daily practice and history.
- A Telegram bot for reminders, onboarding and quick actions.
- A small backend for authentication, practice records and content metadata.
- Object storage for chant recordings.

The initial pilot can operate within free service tiers. See [Feasibility and costs](docs/feasibility-and-costs.md) for the research and assumptions.

## Run the prototype

Requirements: Node.js 20 or newer and the five locally split MP3 files in `audio/sections/`.

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. The web interface proxies audio and API requests to the local server on port 3001.

```bash
npm run typecheck
npm test
npm run build
npm start
```

The current prototype stores practice, timer and playback state in the browser. Telegram identity and server-side persistence are the next milestone; secrets and copyrighted audio remain outside Git.

The MVP interface is currently Spanish-only. Catalan and English are planned once the core morning-practice flow has been validated.

## MVP

- Telegram-based sign-in
- Library containing 3–5 authorised chant recordings
- Audio playback with position resume
- Meditation timer with preset and custom durations
- Daily svadhyaya and meditation completion
- Calendar, streak and total practice days
- Optional reminder from the bot
- Basic content administration
- Consent, data export and account deletion

The full requirements are in the [product brief](docs/product-brief.md).

## Proposed architecture

```text
Telegram user
    |
    +-- Bot: onboarding, reminders, quick actions
    |
    +-- Mini App: Today, Chants, Meditation, History
             |
             +-- Application API
                    +-- PostgreSQL: users and practice records
                    +-- Object storage: audio recordings
```

The architecture and initial data model are documented in [technical architecture](docs/technical-architecture.md).

## Documentation

- [Product brief](docs/product-brief.md)
- [Feasibility and costs](docs/feasibility-and-costs.md)
- [Technical architecture](docs/technical-architecture.md)
- [Privacy and content rights](docs/privacy-and-content-rights.md)
- [Delivery roadmap](docs/roadmap.md)
- [Morning-practice MVP implementation plan](docs/mvp-implementation-plan.md)
- [Independent MVP plan verification](docs/verification/2026-08-12-mvp-plan-verification.md)
- [Design system](docs/design-system.md)
- [Immediate next steps](docs/next-steps.md)
- [Architecture decisions](docs/decisions/README.md)

## Suggested next step

Build the private [morning-practice MVP](docs/mvp-implementation-plan.md), use it for three consecutive mornings, and let that evidence determine the next feature.

## Licence

No licence has been selected. All rights are reserved until Advaita Vidya decides how the software and content should be licensed.
