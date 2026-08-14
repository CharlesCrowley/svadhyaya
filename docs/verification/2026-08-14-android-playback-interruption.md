# Android playback interruption — 2026-08-14

## Report

During a real morning practice on a Samsung Galaxy A52s inside Telegram, Śrī Guru
Gītā continued briefly after the screen switched off, stopped at approximately 13
minutes, and could not be restarted until the Mini App was closed and reopened.

## Evidence

- The Railway service remained healthy and had not restarted.
- `/api/health` returned `200` in 58 ms.
- The live proxy then failed to return headers or data within 15 seconds for an
  11-byte range of the Guru Gītā file.
- Using the same credentials directly against the private Railway bucket returned
  that range in about 0.5 seconds. The object was present at 61,958,246 bytes.
- The existing proxy reused one S3 client indefinitely and did not abort or destroy
  its upstream stream when a phone/WebView disconnected.

This isolates the observed restart failure to the running proxy connection rather
than a missing or corrupt audio object. Android WebView suspension was the likely
trigger for the dropped request, but the server must recover regardless.

## Fix

- Create an isolated S3 client for each media request.
- Abort the upstream request if the browser disconnects.
- Bound the wait for upstream response headers to ten seconds.
- Destroy the S3 body and client after completion, error or disconnect.
- Log only the media filename, phase, status and error class on failures.
- Ask the browser to preload audio and register Android Media Session play, pause
  and seek actions.
- Show an explicit resume control if the media element reports an error or stall.
- Keep cloud history feature-disabled in this deployment.

## Verification

Against a production build connected to the private bucket:

1. A 65,536-byte range returned `206` in 0.83 seconds.
2. A full Guru Gītā request was deliberately aborted by the client.
3. A different 65,536-byte range immediately returned `206` in 0.50 seconds.

Automated tests, TypeScript checks and the production build pass. The remaining
acceptance test is one screen-off playback run on the actual A52s inside Telegram.

## Production verification

Railway deployment `924b8501-0296-4e99-a27e-739f19975018` completed successfully.
On the live public endpoint:

- health returned `200` in 0.08 seconds
- three separate 65,536-byte Guru Gītā ranges returned `206` in 0.29–0.36 seconds
- a full stream was deliberately disconnected by the client
- a subsequent range immediately returned `206` in 0.28 seconds
- runtime logs show a clean start and no media-stream error

The deployment leaves `VITE_CLOUD_HISTORY_ENABLED` false by default, so it does
not expose consent or attempt database persistence during the current single-user test.
