# Feasibility and costs

Research checked on 12 August 2026. Prices and platform limits can change and should be rechecked before launch.

## Recommendation

Build a Telegram Mini App supported by a Telegram bot. A chat-only bot can distribute audio, but it is poorly suited to a timer, calendar and browsable media library. The Mini App provides the interface while the bot supplies onboarding, reminders and deep links.

This product is technically feasible and a private pilot should fit within approximately €1–10 per month. Telegram itself is free, but application hosting should not be assumed to remain free.

## Platform feasibility

Telegram states that its Bot Platform is free for users and developers. Mini Apps are JavaScript web applications that run inside Telegram, support Telegram-provided identity, full-screen presentation, home-screen shortcuts and bot communication.

Telegram bots can send audio. The hosted Bot API currently documents a 50 MB limit for audio uploaded with `sendAudio`; Telegram recommends reusing persistent `file_id` values. This may be useful for short recordings, but object storage is preferable for a flexible, browsable library and larger files.

Normal bot messages and reminders are free within broadcast limits. Telegram advises staying below approximately 30 messages per second for bulk notifications. A small organisation can spread scheduled reminders over time and should not need paid broadcasts.

## Proposed service options

| Component | Pilot option | Production option |
|---|---|---|
| Telegram access | Bot and Mini App | Same |
| Mini App and API | One Railway service | Same or a larger Railway service |
| Database | Separate Neon project | Paid Neon tier or managed PostgreSQL |
| Audio | Cloudflare R2 | Cloudflare R2 or compatible object storage |
| Domain | Platform subdomain | Branded domain recommended |

The implementation plan selects Neon rather than Supabase so it can reuse existing Drizzle and Railway operating patterns. Provider limits, pricing and restore windows must be rechecked when the project is created.

Cloudflare R2 currently includes 10 GB-month of standard storage, one million Class A operations and ten million Class B operations per month, with free direct internet egress. Beyond the free tier, standard storage is US$0.015 per GB-month and Class B reads are US$0.36 per million.

## Cost scenarios

### Private pilot

| Item | Expected recurring cost |
|---|---:|
| Telegram bot and Mini App | €0 |
| Railway application hosting | Approximately €1–5 minimum, depending on the current plan |
| Database | €0 |
| Up to 10 GB audio in R2 free tier | €0 |
| TLS certificate | €0 |
| Domain | Optional, typically €10–20/year |
| Expected total | **Approximately €1–10/month** |

Neon and R2 may remain within their free tiers for the private pilot. The MVP nevertheless requires a small encrypted daily database export because a free provider restore window may be too short for daily practice history.

### Small organisational release

| Scenario | Planning allowance |
|---|---:|
| Existing server and free database/storage tiers | €0–10/month |
| Managed production database and hosting | €25–50/month |
| Several thousand active users or greater media usage | €25–75/month initially |

These are planning estimates rather than provider quotations. Audio storage capacity is unlikely to be expensive at this scale; operational support, backups and development are more significant costs.

## Development estimate

- Clickable prototype: 2–4 development days
- Private functional MVP: 1–2 focused development weeks
- Polished organisational release: 3–5 weeks
- Indicative freelance MVP: €1,500–4,000
- Indicative polished release: €4,000–10,000

The ranges depend on design polish, content administration, device testing, privacy work and whether existing infrastructure can be reused.

## Timer constraint

A Telegram Mini App runs in a mobile web view. Mobile operating systems and browsers may throttle or suspend JavaScript when an application becomes inactive. The timer must therefore store a start timestamp and intended finish timestamp, then calculate the displayed time from the clock whenever the Mini App resumes. It must not rely on counting one JavaScript interval per second.

An audible or silent audio session may improve background continuity on some clients, but behaviour is platform-dependent. Locked-screen and background tests on supported iPhone and Android versions are a release requirement. A native application would provide stronger system-level timer behaviour, but is not justified for the MVP.

## Risks requiring validation

- Background audio and completion-bell behaviour differs across Telegram clients.
- Long recordings may need compression, chaptering or external streaming.
- Free database tiers may have short restore windows or usage limits.
- The organisation must prove rights to distribute each recording.
- Practice records may reveal religious or philosophical beliefs and require careful consent and handling.
- Telegram platform terms and provider prices can change.

## Sources

- [Telegram: Bots—An introduction for developers](https://core.telegram.org/bots)
- [Telegram Mini Apps documentation](https://core.telegram.org/bots/webapps)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Telegram Bots FAQ](https://core.telegram.org/bots/faq)
- [Neon pricing](https://neon.com/pricing)
- [Railway pricing](https://railway.com/pricing)
- [Cloudflare R2 pricing](https://developers.cloudflare.com/r2/pricing/)
- [MDN: setTimeout and inactive-tab throttling](https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout)
