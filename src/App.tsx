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
  MoreHorizontal,
  Pause,
  Play,
  Sparkles,
  TimerReset
} from "lucide-react";
import { chantTracks } from "./data/tracks";
import { copy } from "./data/copy";
import advaitaVidyaLogo from "./assets/advaita-vidya-logo.jpg";
import {
  readPlayback,
  readPracticeDays,
  readTimer,
  savePlayback,
  savePracticeDays,
  saveTimer,
  type PracticeDay,
  type PracticeType,
  type TimerState
} from "./lib/storage";
import { displayDate, formatClock, madridDate, recentDates } from "./lib/time";

type View = "today" | "practice" | "history";

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
  const completionHandled = useRef(false);

  const activeTrack = chantTracks[trackIndex];
  const today = madridDate();
  const todayRecord = practiceDays.find((day) => day.date === today);

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
        ...(type === "meditation" && minutes ? { meditationMinutes: minutes } : {})
      };
      const next = [...current.filter((day) => day.date !== today), updated].sort((a, b) =>
        a.date.localeCompare(b.date)
      );
      savePracticeDays(next);
      return next;
    });
  }, [today]);

  const playBell = useCallback(() => {
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
        playBell();
      }
    };
    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [playBell, timer, updatePractice]);

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
    savePlayback({ trackId: chantTracks[index].id, position: 0, playAll, playbackRate });
    if (shouldPlay) {
      window.setTimeout(() => {
        void audioRef.current?.play().then(() => setIsPlaying(true));
      }, 80);
    }
  };

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      await audio.play();
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
      setPosition(audio.currentTime);
    }
  };

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

  return (
    <div className="app-shell">
      <header className="app-header">
        <img className="brand-logo" src={advaitaVidyaLogo} alt="Advaita Vidya" />
        <p className="header-date">{displayDate()}</p>
      </header>

      <main>
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

            <div className="history-summary">
              <div><strong>{currentStreak}</strong><span>{copy.currentStreak}</span></div>
              <div><strong>{completeDays}</strong><span>{copy.completeDays}</span></div>
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
  onRateChange: (rate: number) => void;
  onPrevious: () => void;
  onNext: () => void;
}

function Player({ audioRef, track, position, isPlaying, playAll, playbackRate, onToggle, onTime, onSeek, onEnded, onRateChange, onPrevious, onNext }: PlayerProps) {
  const playbackRates = [1, 1.25, 1.5, 2];
  const [optionsOpen, setOptionsOpen] = useState(false);

  return (
    <section className="player-surface">
      <audio ref={audioRef} onTimeUpdate={(event) => onTime(event.currentTarget.currentTime)} onEnded={onEnded} preload="metadata" />
      <div className="player-topline">
        <span>{playAll ? `${copy.completePractice} · ${track.number} ${copy.of} 5` : `${copy.section} ${track.number} ${copy.of} 5`}</span>
        <div className="player-options">
          <button
            className="options-toggle"
            type="button"
            aria-label={copy.changePlaybackSpeed}
            aria-expanded={optionsOpen}
            onClick={() => setOptionsOpen((open) => !open)}
          >
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
      <CheckRow label={copy.meditation} detail={record?.meditationMinutes ? `${record.meditationMinutes} ${copy.minutes}` : copy.silentPractice} complete={Boolean(record?.meditation)} onClick={() => onChange("meditation", !record?.meditation)} />
    </section>
  );
}

function CheckRow({ label, detail, complete, onClick }: { label: string; detail: string; complete: boolean; onClick: () => void }) {
  return (
    <button className="check-row" type="button" onClick={onClick} aria-pressed={complete}>
      <span className={`check-circle ${complete ? "complete" : ""}`}>{complete ? <Check size={17} /> : <Circle size={18} />}</span>
      <span><strong>{label}</strong><small>{detail}</small></span>
      <span className="check-status">{complete ? copy.complete : copy.markDone}</span>
    </button>
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
