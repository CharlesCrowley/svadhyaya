# Product brief

## Working title

Advaita Vidya Svadhyaya

## Purpose

Provide a calm, simple place inside Telegram where members can listen to authorised chants, meditate with a timer and privately record a consistent daily practice.

The product should support practice without turning it into a competitive or distracting experience.

## Intended users

- An initial private user or small pilot group
- Members and students of Advaita Vidya
- Administrators who publish authorised audio recordings

## Core user journey

1. A user opens the Advaita Vidya bot and chooses **Open Practice App**.
2. The Today screen shows the two practices: svadhyaya and meditation.
3. The user can play a chant or start a meditation timer.
4. Completing an activity records it for the current local date.
5. The user sees a simple calendar, current streak and total practice days.
6. If enabled, the bot sends a reminder at the user's preferred local time.

## MVP requirements

### Today

- Show today's svadhyaya and meditation status.
- Provide one-tap access to the chant library and meditation timer.
- Permit manual completion and correction of today's entries.
- Celebrate completion subtly, without points or competitive rankings.

### Chant library

- Display title, teacher or source, duration and short description.
- Play, pause and seek within a recording.
- Remember the most recent playback position per user and recording.
- Allow authorised administrators to publish or unpublish content.
- Begin with 3–5 recordings for the pilot.

### Meditation timer

- Offer 10, 20, 30 and 60-minute presets.
- Allow a custom duration.
- Provide optional opening and closing bells.
- Store the intended finish time so the timer remains accurate after app suspension.
- Record a completed session and its duration.
- Permit the user to discard an interrupted session.

### Practice history

- Display a monthly calendar.
- Distinguish svadhyaya, meditation and days containing both.
- Show current streak, total practice days and minutes meditated.
- Treat a streak as supportive information, not a penalty mechanism.

### Telegram bot

- Welcome new users and open the Mini App.
- Request permission before sending reminders.
- Allow reminders to be enabled, disabled and rescheduled.
- Deep-link reminders to the relevant app screen.

### User controls

- View the privacy notice and current consent state.
- Export personal practice data in a common format.
- Delete the account and associated practice data.

## Explicitly out of scope for the MVP

- Public leaderboards or competitive rankings
- Social feeds and direct messaging
- AI-generated spiritual guidance
- Paid subscriptions
- Offline downloads
- Native iOS or Android applications
- Detailed teacher or organisation analytics about named individuals
- A complex content-management system

## Success criteria for a pilot

- At least 5 pilot users complete onboarding without assistance.
- At least 80% can find and play a chant and start the timer.
- Timer completion is dependable on the supported iOS and Android test devices.
- Users understand what is recorded and can delete their data.
- The organisation confirms it has distribution rights for every pilot recording.
- At least half of pilot participants return on three or more days during a two-week test.

## Product principles

- Calm over gamified
- Private by default
- One tap for common actions
- Minimal data collection
- Content provenance is visible
- Correctness is more important than an animated countdown
- Accessible, mobile-first design
