'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import './pomodoro.css';

type Mode = 'focus' | 'short' | 'long';
type SessionType = 'Deep Work' | 'Study' | 'Creative';

const DURATIONS: Record<Mode, number> = {
  focus: 25 * 60,
  short: 5 * 60,
  long: 15 * 60,
};

const MODE_LABELS: Record<Mode, string> = {
  focus: 'FOCUS SESSION',
  short: 'SHORT BREAK',
  long: 'LONG BREAK',
};

const SESSION_TYPES: SessionType[] = ['Deep Work', 'Study', 'Creative'];

function fmt(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// Alarm looping — terus bunyi sampai di-stop
let alarmCtx: AudioContext | null = null;
let alarmLoop: ReturnType<typeof setTimeout> | null = null;

function playAlarmLoop(type: 'focus' | 'short' | 'long', onEnd?: () => void) {
  if (typeof window === 'undefined') return;
  stopAlarmLoop();
  try {
    alarmCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  } catch { return; }

  const notes = type === 'focus'
    ? [523, 659, 784, 1047]   // C5 E5 G5 C6
    : [784, 659, 523];        // G5 E5 C5

  const totalDuration = notes.length * 0.22 + 0.55 + 0.6; // per cycle

  function playOnce() {
    if (!alarmCtx) return;
    notes.forEach((freq, i) => {
      const osc = alarmCtx!.createOscillator();
      const gain = alarmCtx!.createGain();
      osc.connect(gain);
      gain.connect(alarmCtx!.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = alarmCtx!.currentTime + i * 0.22;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.4, start + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);
      osc.start(start);
      osc.stop(start + 0.55);
    });
    // Loop lagi setelah satu cycle selesai
    alarmLoop = setTimeout(playOnce, totalDuration * 1000);
  }

  playOnce();
}

function stopAlarmLoop() {
  if (alarmLoop) { clearTimeout(alarmLoop); alarmLoop = null; }
  if (alarmCtx) { alarmCtx.close(); alarmCtx = null; }
}


export default function PomodoroPage() {
  const [mode, setMode] = useState<Mode>('focus');
  const [sessionType, setSessionType] = useState<SessionType>('Deep Work');
  const [timeLeft, setTimeLeft] = useState(DURATIONS.focus);
  const [running, setRunning] = useState(false);
  const [completedToday, setCompletedToday] = useState(0);
  const [totalMinutesToday, setTotalMinutesToday] = useState(0);
  const [saving, setSaving] = useState(false);
  const [alarming, setAlarming] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rafRef = useRef<number | null>(null);
  const endTimeRef = useRef<number>(0);
  const startedAt = useRef<number>(0);

  // Load today's sessions on mount
  const loadTodaySessions = useCallback(async () => {
    try {
      const res = await fetch('/api/focus-sessions');
      if (!res.ok) return;
      const sessions = await res.json();
      const today = new Date().toDateString();
      const todaySessions = sessions.filter(
        (s: { createdAt: string; type: string; duration: number }) =>
          new Date(s.createdAt).toDateString() === today && s.type !== 'Short Break' && s.type !== 'Long Break'
      );
      setCompletedToday(todaySessions.length);
      setTotalMinutesToday(todaySessions.reduce((sum: number, s: { duration: number }) => sum + s.duration, 0));
    } catch { /* silent */ }
  }, []);

  useEffect(() => { loadTodaySessions(); }, [loadTodaySessions]);

  // Switch mode
  const switchMode = (newMode: Mode) => {
    if (running) return;
    setMode(newMode);
    setTimeLeft(DURATIONS[newMode]);
  };

  // Timestamp-based countdown — tidak lag karena selalu hitung dari waktu nyata
  const tick = useCallback(() => {
    const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
    setTimeLeft(remaining);

    if (remaining <= 0) {
      setRunning(false);
      handleSessionComplete();
      return;
    }

    rafRef.current = requestAnimationFrame(tick);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (running) {
      rafRef.current = requestAnimationFrame(tick);
    } else {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    }
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  // Update browser tab title
  useEffect(() => {
    if (running) {
      document.title = `${fmt(timeLeft)} — ${MODE_LABELS[mode]} | StudySpace`;
    } else {
      document.title = 'StudySpace | Focus Better';
    }
  }, [timeLeft, running, mode]);

  const handleStart = () => {
    endTimeRef.current = Date.now() + timeLeft * 1000;
    startedAt.current = Date.now();
    setRunning(true);
  };

  const handlePause = () => setRunning(false);

  const handleReset = () => {
    setRunning(false);
    setTimeLeft(DURATIONS[mode]);
  };

  const handleSkip = () => {
    setRunning(false);
    handleSessionComplete();
  };

  const handleSessionComplete = async () => {
    // Mainkan alarm looping
    setAlarming(true);
    playAlarmLoop(mode);

    // Kalau mode focus, simpan ke DB
    if (mode === 'focus') {
      const elapsed = Math.round((DURATIONS[mode] - timeLeft) / 60);
      const duration = elapsed > 0 ? elapsed : DURATIONS[mode] / 60;
      setSaving(true);
      try {
        await fetch('/api/focus-sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ duration, type: sessionType }),
        });
        setCompletedToday(prev => prev + 1);
        setTotalMinutesToday(prev => prev + duration);
      } catch { /* silent */ }
      setSaving(false);
    }
    // Reset timer ke mode saat ini
    setTimeLeft(DURATIONS[mode]);

    // Notifikasi browser
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(mode === 'focus' ? '🎉 Focus session done!' : '☕ Break over, back to work!', {
        body: mode === 'focus' ? `${sessionType} session completed. Time for a break!` : 'Ready for your next focus session?',
      });
    }
  };

  const handleStopAlarm = () => {
    stopAlarmLoop();
    setAlarming(false);
  };

  // Progress ring
  const total = DURATIONS[mode];
  const progress = (total - timeLeft) / total;
  const circumference = 2 * Math.PI * 140; // r=140
  const strokeDashoffset = circumference * (1 - progress);

  const modeColor = mode === 'focus' ? '#9d80ff' : mode === 'short' ? '#4cc9f0' : '#34d399';

  return (
    <div className="pomodoro-container">
      {/* Header */}
      <div className="pomodoro-header">
        <div className="pomodoro-subtitle">COZY FOCUS SESSION</div>
        <h1 className="pomodoro-title">
          <span>Breathe in.</span>{' '}
          <span className="text-gradient" style={{ fontFamily: 'Times New Roman, serif', fontStyle: 'italic', fontWeight: 'normal' }}>
            Begin.
          </span>
        </h1>
      </div>

      {/* Mode Tabs */}
      <div className="pomodoro-tabs">
        <button className={`tab-btn ${mode === 'focus' ? 'active' : ''}`} onClick={() => switchMode('focus')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          Focus
        </button>
        <button className={`tab-btn ${mode === 'short' ? 'active' : ''}`} onClick={() => switchMode('short')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path></svg>
          Short break
        </button>
        <button className={`tab-btn ${mode === 'long' ? 'active' : ''}`} onClick={() => switchMode('long')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
          Long break
        </button>
      </div>

      {/* Session Type (only during focus) */}
      {mode === 'focus' && (
        <div className="session-type-row">
          {SESSION_TYPES.map(t => (
            <button
              key={t}
              className={`session-type-btn ${sessionType === t ? 'active' : ''}`}
              onClick={() => setSessionType(t)}
              disabled={running}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {/* Timer Card */}
      <div className="main-timer-card">
        {/* SVG Progress Ring */}
        <div className="timer-circle">
          <svg className="timer-svg" viewBox="0 0 300 300">
            {/* Background ring */}
            <circle cx="150" cy="150" r="140" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
            {/* Progress ring */}
            <circle
              cx="150" cy="150" r="140"
              fill="none"
              stroke={modeColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
            />
          </svg>
          <div className="timer-inner">
            <div className="time-display">{fmt(timeLeft)}</div>
            <div className="time-label">{MODE_LABELS[mode]}</div>
            {mode === 'focus' && <div className="session-type-label">{sessionType}</div>}
          </div>
        </div>

        {/* Controls */}
        <div className="timer-controls">
          {alarming ? (
            <button className="btn-stop-alarm" onClick={handleStopAlarm}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
              Stop alarm
            </button>
          ) : (
            <>
              <button className="control-btn" onClick={handleReset} title="Reset" disabled={running && timeLeft === DURATIONS[mode]}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><polyline points="3 3 3 8 8 8"></polyline></svg>
              </button>

              {running ? (
                <button className="btn-start-large pause" onClick={handlePause}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                  Pause
                </button>
              ) : (
                <button className="btn-start-large" onClick={handleStart}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                  {timeLeft < DURATIONS[mode] ? 'Resume' : 'Start'}
                </button>
              )}

              <button className="control-btn" onClick={handleSkip} title="Skip">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Footer stats */}
      <div className="pomodoro-footer">
        {saving ? 'Saving session...' : (
          <>
            <span className="footer-stat">🍅 {completedToday} sessions today</span>
            <span className="footer-dot">·</span>
            <span className="footer-stat">⏱ {totalMinutesToday}m total focus</span>
            <span className="footer-dot">·</span>
            <span className="footer-stat">{mode === 'focus' ? `${Math.round(DURATIONS.focus / 60)}m session` : 'On a break'}</span>
          </>
        )}
      </div>
    </div>
  );
}
