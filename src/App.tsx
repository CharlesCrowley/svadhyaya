import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
  type RefObject
} from "react";
import {
  BookOpenText,
  Check,
  ChevronLeft,
  ChevronRight,
  Circle,
  History,
  ListMusic,
  Moon,
  MoreHorizontal,
  Pause,
  Play,
  Sparkles,
  Sun,
  TimerReset
} from "lucide-react";
import { chantTracks } from "./data/tracks";
import { copy } from "./data/copy";
import advaitaVidyaLogo from "./assets/advaita-vidya-logo.jpg";
import {
  acknowledgePracticeWrite,
  clearPendingPracticeWrites,
  queuePracticeWrite,
  readPlayback,
  readPendingPracticeWrites,
  readPracticeDays,
  readTimer,
  savePlayback,
  savePracticeDays,
  saveTimer,
  type PracticeDay,
  type PracticeType,
  type TimerState
} from "./lib/storage";
import { contributionCalendar, displayDate, formatClock, madridDate, recentDates } from "./lib/time";
import { applyTheme, readTheme, type Theme } from "./lib/theme";
import {
  CONSENT_VERSION,
  acceptPrivacyConsent,
  deleteRemoteData,
  exportRemoteData,
  initialiseTelegram,
  readRemoteHistory,
  readSession,
  saveRemotePractice
} from "./lib/telegram";

type View = "today" | "practice" | "history";
type SyncStatus = "local" | "checking" | "consent" | "ready" | "error";
const cloudHistoryEnabled = import.meta.env.VITE_CLOUD_HISTORY_ENABLED === "true";

export function App() {
  const initialPlayback = useMemo(readPlayback, []);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [view, setView] = useState<View>("today");
  const [trackIndex, setTrackIndex] = useState(() =>
    Math.max(0, chantTracks.findIndex((track) => track.id === initialPlayback.trackId))
  );
  const [position, setPosition] = useState(initialPlayback.position);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playAll, setPlayAll] = useState(initialPlayback.playAll);
  const [playbackRate, setPlaybackRate] = useState(initialPlayback.playbackRate);
  const [practiceDays, setPracticeDays] = useState<PracticeDay[]>(readPracticeDays);
  const [timer, setTimer] = useState<TimerState | null>(readTimer);
  const [remaining, setRemaining] = useState(() =>
    timer ? Math.max(0, (timer.expectedEndAt - Date.now()) / 1000) : 0
  );
  const [timerPreset, setTimerPreset] = useState(20);
  const [telegramInitData] = useState(() => cloudHistoryEnabled ? initialiseTelegram() : "");
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() => telegramInitData ? "checking" : "local");
  const [remoteEnabled, setRemoteEnabled] = useState(false);
  const [consentDismissed, setConsentDismissed] = useState(false);
  const [notice, setNotice] = useState("");
  const [playbackProblem, setPlaybackProblem] = useState(false);
  const [screenAwake, setScreenAwake] = useState(false);
  const [theme, setTheme] = useState<Theme>(readTheme);
  const completionHandled = useRef(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const completionSoundRef = useRef<HTMLAudioElement | null>(null);

  const activeTrack = chantTracks[trackIndex];
  const today = madridDate();
  const todayRecord = practiceDays.find((day) => day.date === today);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    applyTheme(nextTheme);
    setTheme(nextTheme);
  };

  useEffect(() => {
    if (!telegramInitData) return;
    let cancelled = false;
    void readSession(telegramInitData)
      .then(async (session) => {
        if (cancelled) return;
        if (!session.consented || session.consentVersion !== CONSENT_VERSION) {
          setSyncStatus("consent");
          return;
        }
        setRemoteEnabled(true);
        await flushPendingWrites(telegramInitData);
        const days = await readRemoteHistory(telegramInitData, madridDate());
        if (cancelled) return;
        savePracticeDays(days);
        setPracticeDays(days);
        setSyncStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setSyncStatus("error");
      });
    return () => { cancelled = true; };
  }, [telegramInitData]);

  const updatePractice = useCallback((type: PracticeType, complete: boolean, minutes?: number) => {
    setPracticeDays((current) => {
      const existing = current.find((day) => day.date === today) ?? {
        date: today,
        svadhyaya: false,
        meditation: false
      };
      const updated: PracticeDay = {
        ...existing,
        [type]: complete,
        ...(type === "meditation"
          ? { meditationMinutes: complete && minutes ? minutes : undefined }
          : {})
      };
      const next = [...current.filter((day) => day.date !== today), updated].sort((a, b) =>
        a.date.localeCompare(b.date)
      );
      savePracticeDays(next);
      return next;
    });
    if (remoteEnabled) {
      const write = { date: today, type, complete, ...(minutes ? { minutes } : {}) };
      queuePracticeWrite(write);
      void saveRemotePractice(telegramInitData, today, type, complete, minutes)
        .then(() => {
          acknowledgePracticeWrite(write);
          setSyncStatus("ready");
        })
        .catch(() => setSyncStatus("error"));
    }
  }, [remoteEnabled, telegramInitData, today]);

  const acceptConsent = async () => {
    setSyncStatus("checking");
    setNotice("");
    try {
      await acceptPrivacyConsent(telegramInitData);
      setRemoteEnabled(true);
      queueEligibleLocalHistory(practiceDays);
      await flushPendingWrites(telegramInitData);
      const days = await readRemoteHistory(telegramInitData, madridDate());
      savePracticeDays(days);
      setPracticeDays(days);
      setConsentDismissed(false);
      setSyncStatus("ready");
    } catch {
      setSyncStatus("error");
    }
  };

  const exportData = async () => {
    try {
      const data = await exportRemoteData(telegramInitData);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `svadhyaya-${today}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setSyncStatus("error");
    }
  };

  const deleteData = async () => {
    if (!window.confirm(copy.deleteConfirmation)) return;
    try {
      await deleteRemoteData(telegramInitData);
      clearPendingPracticeWrites();
      savePracticeDays([]);
      setPracticeDays([]);
      setSyncStatus("consent");
      setRemoteEnabled(false);
      setConsentDismissed(true);
      setNotice(copy.dataDeleted);
    } catch {
      setSyncStatus("error");
    }
  };

  useEffect(() => {
    const audio = new Audio("/sounds/singing-bowl-completion.mp3");
    audio.preload = "auto";
    audio.volume = 0.72;
    completionSoundRef.current = audio;
    return () => {
      audio.pause();
      audio.removeAttribute("src");
      completionSoundRef.current = null;
    };
  }, []);

  const playGeneratedBell = useCallback(() => {
    const AudioContextClass = window.AudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const gain = context.createGain();
    const oscillator = context.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(523.25, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(261.63, context.currentTime + 2.8);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.22, context.currentTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 3);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 3);
    oscillator.addEventListener("ended", () => void context.close());
  }, []);

  const playCompletionSound = useCallback(() => {
    const audio = completionSoundRef.current;
    if (!audio) {
      playGeneratedBell();
      return;
    }
    audio.muted = false;
    audio.currentTime = 0;
    void audio.play().catch(playGeneratedBell);
  }, [playGeneratedBell]);

  useEffect(() => {
    if (!timer) return;
    const tick = () => {
      const nextRemaining = Math.max(0, (timer.expectedEndAt - Date.now()) / 1000);
      setRemaining(nextRemaining);
      if (nextRemaining === 0 && !completionHandled.current) {
        completionHandled.current = true;
        updatePractice("meditation", true, timer.durationMinutes);
        saveTimer(null);
        setTimer(null);
        playCompletionSound();
      }
    };
    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [playCompletionSound, timer, updatePractice]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.src = activeTrack.source;
    audio.playbackRate = playbackRate;
    audio.load();
    const restorePosition = () => {
      audio.currentTime = Math.min(position, Math.max(0, audio.duration - 0.5));
      audio.removeEventListener("loadedmetadata", restorePosition);
    };
    audio.addEventListener("loadedmetadata", restorePosition);
    setIsPlaying(false);
    return () => audio.removeEventListener("loadedmetadata", restorePosition);
    // Position is intentionally restored only when the track changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTrack.id]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const currentPosition = audioRef.current?.currentTime ?? position;
      savePlayback({ trackId: activeTrack.id, position: currentPosition, playAll, playbackRate });
    }, 3000);
    return () => window.clearInterval(interval);
  }, [activeTrack.id, playAll, playbackRate, position]);

  const chooseTrack = (index: number, shouldPlay = false) => {
    const audio = audioRef.current;
    if (audio) audio.pause();
    setTrackIndex(index);
    setPosition(0);
    setIsPlaying(false);
    setPlaybackProblem(false);
    savePlayback({ trackId: chantTracks[index].id, position: 0, playAll, playbackRate });
    if (shouldPlay) {
      window.setTimeout(() => {
        void audioRef.current?.play().then(() => setIsPlaying(true));
      }, 80);
    }
  };

  useEffect(() => {
    const shouldStayAwake = isPlaying || playbackProblem || timer !== null;
    let disposed = false;

    const requestWakeLock = async () => {
      if (
        !shouldStayAwake ||
        document.visibilityState !== "visible" ||
        !("wakeLock" in navigator) ||
        (wakeLockRef.current && !wakeLockRef.current.released)
      ) return;

      try {
        const sentinel = await navigator.wakeLock.request("screen");
        if (disposed || !shouldStayAwake) {
          await sentinel.release();
          return;
        }
        wakeLockRef.current = sentinel;
        setScreenAwake(true);
        sentinel.addEventListener("release", () => {
          if (wakeLockRef.current === sentinel) {
            wakeLockRef.current = null;
            setScreenAwake(false);
          }
        });
      } catch {
        setScreenAwake(false);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") void requestWakeLock();
    };

    void requestWakeLock();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      const sentinel = wakeLockRef.current;
      wakeLockRef.current = null;
      setScreenAwake(false);
      if (sentinel && !sentinel.released) void sentinel.release();
    };
  }, [isPlaying, playbackProblem, timer]);

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused || !isPlaying || playbackProblem) {
      if (audio.error || playbackProblem) {
        const resumeAt = position;
        audio.load();
        await new Promise<void>((resolve, reject) => {
          const ready = () => { cleanup(); resolve(); };
          const failed = () => { cleanup(); reject(new Error("Audio could not be reloaded")); };
          const cleanup = () => {
            audio.removeEventListener("loadedmetadata", ready);
            audio.removeEventListener("error", failed);
          };
          audio.addEventListener("loadedmetadata", ready, { once: true });
          audio.addEventListener("error", failed, { once: true });
        });
        audio.currentTime = resumeAt;
      }
      try {
        await audio.play();
        setPlaybackProblem(false);
        setIsPlaying(true);
      } catch {
        setPlaybackProblem(true);
        setIsPlaying(false);
      }
    } else {
      audio.pause();
      setIsPlaying(false);
      setPosition(audio.currentTime);
    }
  };

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: activeTrack.title,
      artist: "Advaita Vidya",
      album: copy.morningPractice
    });
    navigator.mediaSession.setActionHandler("play", () => {
      if (!isPlaying) void togglePlayback();
    });
    navigator.mediaSession.setActionHandler("pause", () => {
      if (isPlaying) void togglePlayback();
    });
    navigator.mediaSession.setActionHandler("seekbackward", (details) => {
      const audio = audioRef.current;
      if (audio) audio.currentTime = Math.max(0, audio.currentTime - (details.seekOffset ?? 10));
    });
    navigator.mediaSession.setActionHandler("seekforward", (details) => {
      const audio = audioRef.current;
      if (audio) audio.currentTime = Math.min(audio.duration, audio.currentTime + (details.seekOffset ?? 10));
    });
    return () => {
      for (const action of ["play", "pause", "seekbackward", "seekforward"] as MediaSessionAction[]) {
        navigator.mediaSession.setActionHandler(action, null);
      }
    };
  }, [activeTrack.title, isPlaying, playbackProblem]);

  const changePlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) audioRef.current.playbackRate = rate;
    savePlayback({
      trackId: activeTrack.id,
      position: audioRef.current?.currentTime ?? position,
      playAll,
      playbackRate: rate
    });
  };

  const startCompletePractice = () => {
    setPlayAll(true);
    chooseTrack(0, true);
  };

  const handleTrackEnd = () => {
    if (playAll && trackIndex < chantTracks.length - 1) {
      chooseTrack(trackIndex + 1, true);
      return;
    }
    setIsPlaying(false);
    setPosition(0);
    setPlayAll(false);
  };

  const startTimer = () => {
    const completionSound = completionSoundRef.current;
    if (completionSound) {
      completionSound.muted = true;
      void completionSound.play().then(() => {
        completionSound.pause();
        completionSound.currentTime = 0;
        completionSound.muted = false;
      }).catch(() => {
        completionSound.muted = false;
      });
    }
    const startedAt = Date.now();
    const nextTimer = {
      startedAt,
      expectedEndAt: startedAt + timerPreset * 60_000,
      durationMinutes: timerPreset
    };
    completionHandled.current = false;
    setTimer(nextTimer);
    setRemaining(timerPreset * 60);
    saveTimer(nextTimer);
  };

  const cancelTimer = () => {
    setTimer(null);
    setRemaining(0);
    saveTimer(null);
    completionHandled.current = false;
  };

  const recent = recentDates(7);
  const completeDays = practiceDays.filter((day) => day.svadhyaya && day.meditation).length;
  const currentStreak = calculateStreak(practiceDays);
  const heatmapDates = contributionCalendar(12);

  return (
    <div className="app-shell">
      <header className="app-header">
        <img className="brand-logo" src={advaitaVidyaLogo} alt="Advaita Vidya" />
        <div className="header-actions">
          <div className="header-status">
            <p className="header-date">{displayDate()}</p>
            {screenAwake && <small>{copy.screenAwake}</small>}
          </div>
          <button
            className="theme-toggle"
            type="button"
            aria-label={theme === "light" ? copy.useDarkMode : copy.useLightMode}
            onClick={toggleTheme}
          >
            {theme === "light" ? <Moon /> : <Sun />}
          </button>
        </div>
      </header>

      <main>
        <SyncNotice
          status={syncStatus}
          notice={notice}
          onShowConsent={() => setConsentDismissed(false)}
        />
        {syncStatus === "consent" && !consentDismissed && (
          <ConsentCard
            onAccept={() => void acceptConsent()}
            onDecline={() => setConsentDismissed(true)}
          />
        )}
        {view === "today" && (
          <div className="view-enter">
            <section className="opening-copy">
              <p className="eyebrow">{copy.morningPractice}</p>
            </section>

            <Player
              audioRef={audioRef}
              track={activeTrack}
              position={position}
              isPlaying={isPlaying}
              playAll={playAll}
              playbackRate={playbackRate}
              onToggle={togglePlayback}
              onTime={(nextPosition) => setPosition(nextPosition)}
              onSeek={(nextPosition) => {
                if (audioRef.current) audioRef.current.currentTime = nextPosition;
                setPosition(nextPosition);
              }}
              onEnded={handleTrackEnd}
              playbackProblem={playbackProblem}
              onPlaybackProblem={() => {
                setPlaybackProblem(true);
                setIsPlaying(false);
              }}
              onPlaybackResumed={() => {
                setPlaybackProblem(false);
                setIsPlaying(true);
              }}
              onRateChange={changePlaybackRate}
              onPrevious={() => chooseTrack(Math.max(0, trackIndex - 1))}
              onNext={() => chooseTrack(Math.min(chantTracks.length - 1, trackIndex + 1))}
            />

            <button className="complete-practice" type="button" onClick={startCompletePractice}>
              <ListMusic size={18} />
              {copy.playCompletePractice}
              <span>61 min</span>
            </button>

            <PracticeChecks record={todayRecord} onChange={updatePractice} />
          </div>
        )}

        {view === "practice" && (
          <div className="view-enter">
            <section className="section-heading">
              <p className="eyebrow">{copy.practice}</p>
              <h1>{copy.chantsAndMeditation}</h1>
            </section>

            <div className="track-list" aria-label={copy.chantSections}>
              {chantTracks.map((track, index) => (
                <button
                  className={`track-row ${index === trackIndex ? "is-active" : ""}`}
                  key={track.id}
                  type="button"
                  onClick={() => chooseTrack(index, true)}
                >
                  <span className="track-number">{String(track.number).padStart(2, "0")}</span>
                  <span className="track-copy">
                    <strong>{track.title}</strong>
                    <small>{track.subtitle}</small>
                  </span>
                  <span className="track-duration">{formatClock(track.duration)}</span>
                </button>
              ))}
            </div>

            <section className="timer-section">
              <div className="timer-heading">
                <div>
                  <p className="eyebrow">{copy.meditation}</p>
                  {!timer && <h2>{copy.chooseDuration}</h2>}
                </div>
                <TimerReset size={22} />
              </div>

              {timer ? (
                <div className="timer-active">
                  <div className="timer-ring" style={{ "--progress": `${remaining / (timer.durationMinutes * 60)}` } as CSSProperties}>
                    <span>{formatClock(remaining)}</span>
                    <small>{copy.remaining}</small>
                  </div>
                  <button className="text-button" type="button" onClick={cancelTimer}>{copy.endSession}</button>
                </div>
              ) : (
                <>
                  <div className="preset-row">
                    {[10, 20, 30, 60].map((minutes) => (
                      <button
                        className={minutes === timerPreset ? "selected" : ""}
                        key={minutes}
                        type="button"
                        onClick={() => setTimerPreset(minutes)}
                      >
                        {minutes}
                        <small>min</small>
                      </button>
                    ))}
                  </div>
                  <button className="primary-action" type="button" onClick={startTimer}>
                    {copy.beginMeditation}
                  </button>
                </>
              )}
            </section>
          </div>
        )}

        {view === "history" && (
          <div className="view-enter">
            <section className="section-heading">
              <p className="eyebrow">{copy.history}</p>
              <h1>{copy.quietRecord}</h1>
            </section>

            <section className="practice-heatmap" aria-label={copy.practiceActivity}>
              <div className="heatmap-heading">
                <span>{copy.practiceActivity}</span>
                <small>{copy.lastTwelveWeeks}</small>
              </div>
              <div className="heatmap-grid">
                {heatmapDates.map((date, index) => {
                  if (!date) return <span className="heatmap-cell is-future" key={`future-${index}`} />;
                  const record = practiceDays.find((day) => day.date === date);
                  const level = Number(Boolean(record?.svadhyaya)) + Number(Boolean(record?.meditation));
                  const description = level === 2 ? copy.fullPracticeDay : level === 1 ? copy.onePractice : copy.noPractice;
                  return (
                    <span
                      className={`heatmap-cell level-${level}`}
                      key={date}
                      title={`${new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" }).format(new Date(`${date}T12:00:00`))}: ${description}`}
                    />
                  );
                })}
              </div>
              <div className="heatmap-legend">
                <span>{copy.less}</span>
                <i className="heatmap-cell level-0" />
                <i className="heatmap-cell level-1" />
                <i className="heatmap-cell level-2" />
                <span>{copy.more}</span>
              </div>
            </section>

            <div className="history-summary compact-summary">
              <div><strong>{currentStreak}</strong><span>{copy.currentStreak}</span></div>
              <div><strong>{completeDays}</strong><span>{copy.totalDays}</span></div>
            </div>

            <section className="week-list" aria-label={copy.lastSevenDays}>
              {recent.map((date) => {
                const record = practiceDays.find((day) => day.date === date);
                const dateValue = new Date(`${date}T12:00:00`);
                return (
                  <div className="day-row" key={date}>
                    <div>
                      <span>{new Intl.DateTimeFormat("es-ES", { weekday: "short" }).format(dateValue)}</span>
                      <strong>{new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" }).format(dateValue)}</strong>
                    </div>
                    <HabitDot complete={Boolean(record?.svadhyaya)} label="Svadhyaya" />
                    <HabitDot complete={Boolean(record?.meditation)} label={copy.meditation} />
                  </div>
                );
              })}
            </section>

            {syncStatus === "ready" && (
              <section className="data-controls">
                <p className="eyebrow">{copy.privacyAndData}</p>
                <button type="button" onClick={() => void exportData()}>{copy.exportData}</button>
                <button className="danger" type="button" onClick={() => void deleteData()}>{copy.deleteData}</button>
              </section>
            )}
          </div>
        )}
      </main>

      <nav className="bottom-nav" aria-label={copy.mainNavigation}>
        <NavButton active={view === "today"} label={copy.today} icon={<Sparkles />} onClick={() => setView("today")} />
        <NavButton active={view === "practice"} label={copy.practice} icon={<BookOpenText />} onClick={() => setView("practice")} />
        <NavButton active={view === "history"} label={copy.history} icon={<History />} onClick={() => setView("history")} />
      </nav>
    </div>
  );
}

interface PlayerProps {
  audioRef: RefObject<HTMLAudioElement | null>;
  track: (typeof chantTracks)[number];
  position: number;
  isPlaying: boolean;
  playAll: boolean;
  playbackRate: number;
  onToggle: () => void;
  onTime: (position: number) => void;
  onSeek: (position: number) => void;
  onEnded: () => void;
  playbackProblem: boolean;
  onPlaybackProblem: () => void;
  onPlaybackResumed: () => void;
  onRateChange: (rate: number) => void;
  onPrevious: () => void;
  onNext: () => void;
}

function Player({ audioRef, track, position, isPlaying, playAll, playbackRate, onToggle, onTime, onSeek, onEnded, playbackProblem, onPlaybackProblem, onPlaybackResumed, onRateChange, onPrevious, onNext }: PlayerProps) {
  const playbackRates = [1, 1.2, 1.5, 2];
  const [optionsOpen, setOptionsOpen] = useState(false);
  const optionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!optionsOpen) return;

    const closeFromOutside = (event: PointerEvent) => {
      if (!optionsRef.current?.contains(event.target as Node)) setOptionsOpen(false);
    };
    const closeFromKeyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOptionsOpen(false);
    };

    document.addEventListener("pointerdown", closeFromOutside);
    document.addEventListener("keydown", closeFromKeyboard);
    return () => {
      document.removeEventListener("pointerdown", closeFromOutside);
      document.removeEventListener("keydown", closeFromKeyboard);
    };
  }, [optionsOpen]);

  return (
    <section className="player-surface">
      <audio
        ref={audioRef}
        onTimeUpdate={(event) => onTime(event.currentTarget.currentTime)}
        onEnded={onEnded}
        onError={onPlaybackProblem}
        onStalled={() => { if (isPlaying) onPlaybackProblem(); }}
        onPlaying={onPlaybackResumed}
        preload="auto"
      />
      <div className="player-topline">
        <span>{playAll ? `${copy.completePractice} · ${track.number} ${copy.of} 5` : `${copy.section} ${track.number} ${copy.of} 5`}</span>
        <div className="player-options" ref={optionsRef}>
          <button
            className="options-toggle"
            type="button"
            aria-label={copy.changePlaybackSpeed}
            aria-expanded={optionsOpen}
            onClick={() => setOptionsOpen((open) => !open)}
          >
            <span className="rate-indicator" aria-hidden="true">{playbackRate}×</span>
            <MoreHorizontal />
          </button>
          {optionsOpen && (
            <div className="options-menu" aria-label={copy.playbackSpeed}>
              {playbackRates.map((rate) => (
                <button
                  className={playbackRate === rate ? "active" : ""}
                  key={rate}
                  type="button"
                  onClick={() => {
                    onRateChange(rate);
                    setOptionsOpen(false);
                  }}
                >
                  {rate}× {playbackRate === rate && <Check size={13} />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="player-title">
        <h2>{track.title}</h2>
        <p>{track.subtitle}</p>
      </div>
      <input
        aria-label={copy.playbackPosition}
        className="progress-range"
        type="range"
        min="0"
        max={track.duration}
        step="0.1"
        value={Math.min(position, track.duration)}
        onChange={(event) => onSeek(Number(event.target.value))}
        style={{ "--played": `${(position / track.duration) * 100}%` } as CSSProperties}
      />
      <div className="player-times"><span>{formatClock(position)}</span><span>-{formatClock(track.duration - position)}</span></div>
      {playbackProblem && (
        <button className="player-retry" type="button" onClick={onToggle}>{copy.retryPlayback}</button>
      )}
      <div className="player-controls">
        <button type="button" aria-label={copy.previousSection} onClick={onPrevious}><ChevronLeft /></button>
        <button className="play-button" type="button" aria-label={isPlaying ? copy.pause : copy.play} onClick={onToggle}>
          {isPlaying ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}
        </button>
        <button type="button" aria-label={copy.nextSection} onClick={onNext}><ChevronRight /></button>
      </div>
    </section>
  );
}

function PracticeChecks({ record, onChange }: { record?: PracticeDay; onChange: (type: PracticeType, complete: boolean) => void }) {
  return (
    <section className="practice-checks">
      <div className="section-label"><span>{copy.today}</span><small>{copy.completeBoth}</small></div>
      <CheckRow label={copy.svadhyaya} detail={copy.studyAndRecitation} complete={Boolean(record?.svadhyaya)} onClick={() => onChange("svadhyaya", !record?.svadhyaya)} />
      <CheckRow
        label={copy.meditation}
        detail={record?.meditationMinutes ? `${record.meditationMinutes} ${copy.minutes}` : copy.timerCompletion}
        complete={Boolean(record?.meditation)}
        disabled={!record?.meditation}
        onClick={() => onChange("meditation", false)}
      />
    </section>
  );
}

function CheckRow({ label, detail, complete, disabled = false, onClick }: { label: string; detail: string; complete: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button className="check-row" type="button" onClick={onClick} aria-pressed={complete} disabled={disabled}>
      <span className={`check-circle ${complete ? "complete" : ""}`}>{complete ? <Check size={17} /> : <Circle size={18} />}</span>
      <span><strong>{label}</strong><small>{detail}</small></span>
      <span className="check-status">{complete ? copy.correct : typeStatus(disabled)}</span>
    </button>
  );
}

function typeStatus(disabled: boolean) {
  return disabled ? "" : copy.markDone;
}

function SyncNotice({ status, notice, onShowConsent }: { status: SyncStatus; notice: string; onShowConsent: () => void }) {
  if (status === "ready") return <p className="sync-notice is-ready">{copy.historySaved}</p>;
  if (status === "checking") return <p className="sync-notice">{copy.savingHistory}</p>;
  if (status === "error") return <p className="sync-notice is-error">{copy.syncProblem}</p>;
  if (status === "consent") {
    return <button className="sync-notice consent-link" type="button" onClick={onShowConsent}>{notice || copy.saveHistory}</button>;
  }
  return <p className="sync-notice">{copy.localOnly}</p>;
}

function ConsentCard({ onAccept, onDecline }: { onAccept: () => void; onDecline: () => void }) {
  return (
    <section className="consent-card" role="dialog" aria-labelledby="consent-title">
      <p className="eyebrow">{copy.privacyAndData}</p>
      <h2 id="consent-title">{copy.consentTitle}</h2>
      <p>{copy.consentBody}</p>
      <p>{copy.consentPrivacy}</p>
      <button className="primary-action" type="button" onClick={onAccept}>{copy.consentAccept}</button>
      <button className="text-button" type="button" onClick={onDecline}>{copy.consentDecline}</button>
    </section>
  );
}

function HabitDot({ complete, label }: { complete: boolean; label: string }) {
  return <span className={`habit-dot ${complete ? "complete" : ""}`} title={label}>{complete ? <Check size={14} /> : null}<small>{label}</small></span>;
}

function NavButton({ active, label, icon, onClick }: { active: boolean; label: string; icon: ReactElement; onClick: () => void }) {
  return <button className={active ? "active" : ""} type="button" onClick={onClick}>{icon}<span>{label}</span></button>;
}

function calculateStreak(days: PracticeDay[]): number {
  const completed = new Set(days.filter((day) => day.svadhyaya && day.meditation).map((day) => day.date));
  let streak = 0;
  const cursor = new Date();
  while (completed.has(madridDate(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

async function flushPendingWrites(initData: string): Promise<void> {
  for (const write of readPendingPracticeWrites()) {
    await saveRemotePractice(initData, write.date, write.type, write.complete, write.minutes);
    acknowledgePracticeWrite(write);
  }
}

function queueEligibleLocalHistory(days: PracticeDay[]): void {
  const editableDates = new Set(recentDates(8));
  for (const day of days) {
    if (!editableDates.has(day.date)) continue;
    if (day.svadhyaya) {
      queuePracticeWrite({ date: day.date, type: "svadhyaya", complete: true });
    }
    if (day.meditation && day.meditationMinutes && day.meditationMinutes >= 1) {
      queuePracticeWrite({
        date: day.date,
        type: "meditation",
        complete: true,
        minutes: day.meditationMinutes
      });
    }
  }
}
