# Privacy and content rights

This document identifies product requirements and risks. It is not legal advice; Advaita Vidya should obtain appropriate legal review before a public launch.

## Why the data needs particular care

A history of chanting, svadhyaya or meditation associated with an identifiable Telegram account may reveal religious or philosophical beliefs. The European Commission identifies data revealing religious or philosophical beliefs as a special category of personal data under the GDPR.

The pilot should therefore use explicit, informed consent and collect only what is necessary to provide the tracker.

## Minimum privacy controls

- Explain what practice data is stored before the first record is created.
- Obtain explicit, affirmative and revocable consent.
- Make reminders opt-in.
- Do not require a phone number, email address or legal name.
- Store the Telegram user ID only where needed for account linkage.
- Keep practice records private to the user by default.
- Offer a machine-readable export.
- Offer deletion inside the application without requiring an email request.
- Define retention periods and delete backups on an appropriate schedule.
- Identify Advaita Vidya as the responsible organisation and provide contact details.
- Document processors and storage regions.
- Avoid advertising trackers and behavioural analytics.

Telegram's developer terms also require deletion when a user requests it, when the data is no longer needed, or when the Mini App ceases operation, subject to applicable law.

## Organisational analytics

The MVP should not give administrators named-user practice dashboards. If Advaita Vidya later needs adoption metrics, use anonymous or strongly aggregated counts, such as weekly active users, and establish a documented purpose and legal basis first.

Do not expose small cohorts in a way that lets administrators infer an individual's practice.

## Audio and textual content rights

Traditional or ancient source texts and a modern audio recording are separate works. Even when an underlying Sanskrit text is in the public domain, a teacher, performer, translator, producer or publisher may hold rights in:

- The sound recording
- The performance
- A translation or transliteration
- Musical accompaniment
- Cover artwork, photographs or explanatory notes

Before publishing a recording, retain:

- The owner or licensor
- Written permission or licence reference
- Permitted territories and audience
- Whether download or streaming is permitted
- Expiry date, if any
- Attribution requirements
- Permission to edit, compress or divide the recording

Only administrators should be able to publish content, and publication should be blocked until the rights basis is recorded.

## Draft consent meaning

The eventual interface should communicate, in plain language:

> Advaita Vidya Svadhyaya stores the practices and meditation durations you choose to record so that you can see your personal history and streak. This information may reveal religious or philosophical beliefs. It is private by default and is not used for advertising. You can export or delete it at any time.

The final notice must also identify the controller, processors, retention, international transfers where relevant, contact channel and applicable user rights.

## Sources

- [European Commission: special categories of personal data](https://commission.europa.eu/law/law-topic/data-protection/information-individuals_en)
- [Telegram Bot Platform Developer Terms](https://telegram.org/tos/bot-developers)
- [Telegram Privacy Policy](https://telegram.org/privacy)
