# Delivery roadmap

For the executable single-user plan, milestones and acceptance tests, see the [morning-practice MVP implementation plan](mvp-implementation-plan.md). This roadmap describes the broader path towards an organisational release.

## Phase 0 — Decisions and content readiness

Target: 2–3 days.

- Confirm the product name and organisation contact.
- Select 3–5 pilot recordings.
- Verify and record distribution rights.
- Identify 5–10 pilot users and their typical devices.
- Decide whether the pilot tracks a day when either practice is complete or only when both are complete.
- Confirm supported languages and timezones.
- Approve the privacy approach and consent language.

Exit condition: content and privacy inputs are sufficient to build a realistic prototype.

## Phase 1 — Clickable prototype

Target: 2–4 days.

- Design Today, Chants, Meditation, History and Settings screens.
- Test navigation and wording inside Telegram's mobile viewport.
- Test the practice model with pilot users before building the backend.

Exit condition: at least five users can explain what the app records and complete the main journeys without assistance.

## Phase 2 — Private MVP

Target: 1–2 focused weeks.

- Create and configure the Telegram bot and Mini App.
- Implement server-side Telegram authentication.
- Add the database schema and access controls.
- Implement audio catalogue and playback progress.
- Implement timestamp-based meditation timer.
- Implement daily entries, calendar and streak calculation.
- Add opt-in reminders.
- Add consent, export and deletion.
- Test on current Telegram clients for iOS, Android and desktop.

Exit condition: the pilot success criteria in the product brief are met.

## Phase 3 — Pilot and hardening

Target: 2 weeks of real use.

- Monitor errors, reminder delivery and timer reliability.
- Gather qualitative feedback without collecting unnecessary sensitive data.
- Test interrupted audio, poor connectivity and app suspension.
- Verify deletion and restore procedures.
- Review accessibility and low-end Android performance.
- Correct usability problems before adding features.

Exit condition: no critical privacy, rights, data-loss or timer issues remain.

## Phase 4 — Organisational release

- Add a restrained administration interface.
- Establish operational ownership and support contact.
- Move to paid infrastructure if free-tier pausing or backups are unacceptable.
- Complete legal and privacy review.
- Publish user-facing terms, privacy notice and content attribution.
- Introduce anonymous service-health metrics.

## Backlog after evidence of demand

- Sanskrit text, transliteration and authorised translations
- Chapters or bookmarks within long recordings
- Multiple reminder schedules
- Practice notes stored privately
- Additional languages
- Installable standalone web experience
- Optional anonymous aggregate reporting
- Native application only if background behaviour or offline access demands it

## First implementation decision

Before adding application code, record the chosen language, framework, hosting provider and database in an architecture decision record. The default recommendation is a TypeScript web stack, but the team should choose based on who will maintain the system.
