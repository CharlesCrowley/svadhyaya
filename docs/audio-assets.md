# Audio asset register

This register covers application sounds only. The devotional recordings have their
own separate rights record and remain outside Git.

## Meditation completion singing bowl

- App file: `public/sounds/singing-bowl-completion.mp3`
- Source: [singing bowl — single strike 6](https://freesound.org/people/s-light/sounds/411486/)
- Creator: `s-light`
- Source format: 49-second, 48 kHz, 24-bit stereo FLAC; Freesound preview used for the app edit
- Licence: [Creative Commons CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)
- Source page checked: 15 August 2026
- Source preview SHA-256: `58cc3ed0076e6a9194660c1e024aae31c47f3975b8be9beffc3f8a8f317bd3f3`
- App file SHA-256: `f6ed69b4a5beab2ede1280fbb627a3bbd8e02e84f8893b177a3e04e89afea1f5`

The app edit keeps the first 22 seconds of the single soft-mallet strike and fades
the final five seconds. It is encoded as 128 kbps stereo MP3 for reliable Telegram
WebView playback. CC0 does not require attribution, but the provenance is retained
here voluntarily.

The sound is preloaded and silently primed when the user starts a timer. If recorded
audio playback is refused or unavailable, the previous generated three-second tone
remains as a fallback.
