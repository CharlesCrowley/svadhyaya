export type PracticeType = "svadhyaya" | "meditation";

export interface PracticeDay {
  date: string;
  svadhyaya: boolean;
  meditation: boolean;
  meditationMinutes?: number;
}

export interface PlaybackState {
  trackId: string;
  position: number;
  playAll: boolean;
  playbackRate: number;
}

export interface TimerState {
  startedAt: number;
  expectedEndAt: number;
  durationMinutes: number;
}

const PRACTICE_KEY = "svadhyaya.practice.v1";
const PLAYBACK_KEY = "svadhyaya.playback.v1";
const TIMER_KEY = "svadhyaya.timer.v1";

export function readPracticeDays(): PracticeDay[] {
  return readJson<PracticeDay[]>(PRACTICE_KEY, []);
}

export function savePracticeDays(days: PracticeDay[]): void {
  localStorage.setItem(PRACTICE_KEY, JSON.stringify(days));
}

export function readPlayback(): PlaybackState {
  const stored = readJson<Partial<PlaybackState>>(PLAYBACK_KEY, {});
  const playbackRate = stored.playbackRate === 1.25 ? 1.2 : (stored.playbackRate ?? 1);
  return {
    trackId: "introductory-mantras",
    position: 0,
    playAll: false,
    ...stored,
    playbackRate
  };
}

export function savePlayback(state: PlaybackState): void {
  localStorage.setItem(PLAYBACK_KEY, JSON.stringify(state));
}

export function readTimer(): TimerState | null {
  return readJson<TimerState | null>(TIMER_KEY, null);
}

export function saveTimer(timer: TimerState | null): void {
  if (timer) localStorage.setItem(TIMER_KEY, JSON.stringify(timer));
  else localStorage.removeItem(TIMER_KEY);
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}
