# ADR-0002: Personal practice rules

## Status

Accepted

## Context

The personal MVP needs unambiguous rules for daily completion, streaks and timer behaviour before persistence is implemented.

## Decision

- Svadhyaya and meditation are tracked separately.
- A complete practice day means both habits were completed.
- Svadhyaya is always marked manually; audio playback alone does not complete it.
- A deliberately completed meditation of at least one minute counts.
- In the persisted MVP, meditation completion is created only when its timer finishes with a duration of at least one minute. The local prototype's manual meditation toggle must be removed before persistent writes are enabled; a completed meditation may still be unmarked as a correction.
- An interrupted timer may be resumed until the end of that local day.
- Practice dates use the stored IANA timezone, initially `Europe/Madrid`.

## Consequences

- Streak calculations require both daily records.
- Playback and completion remain separate concepts.
- Timer state must survive reload or suspension.
- A future timezone setting can change how subsequent days are assigned without rewriting historical dates.
