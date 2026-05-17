'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import './dashboard-page.css';

type ChartPoint = { label: string; minutes: number };

type DashboardData = {
  userName: string;
  focusTodayMinutes: number;
  focusYesterdayMinutes: number;
  weeklyAvgMinutes: number;
  todaySessionCount: number;
  bestStreak: number;
  habits: { id: string; name: string; streak: number; completed: boolean }[];
  completedHabits: number;
  goals: { id: string; title: string; progress: number; isCompleted: boolean }[];
  completedGoals: number;
  totalGoals: number;
  quote: { text: string; author: string; id: string } | null;
  weeklyData: ChartPoint[];
  monthlyData: ChartPoint[];
  latestJournal: { id: string; title: string; content: string; mood: string | null; createdAt: string } | null;
  thisWeek: { focusMinutes: number; pomodoros: number; habitsHit: number; journalDays: number };
};

function fmtMin(m: number) {
  if (m === 0) return '0m';
  const h = Math.floor(m / 60), s = m % 60;
  return h > 0 ? (s > 0 ? `${h}h ${s}m` : `${h}h`) : `${m}m`;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardOverview() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartView, setChartView] = useState<'week' | 'month'>('week');

  // Quote modal state
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [newQuoteText, setNewQuoteText] = useState('');
  const [newQuoteAuthor, setNewQuoteAuthor] = useState('');
  const [savingQuote, setSavingQuote] = useState(false);

  const [error, setError] = useState('');

  const firstName = data?.userName?.split(' ')[0] || 'there';

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard');
      const json = await res.json();
      console.log('[Dashboard] API response:', res.status, json);
      if (res.ok) {
        setData(json);
      } else {
        setError(`API Error ${res.status}: ${json.error}`);
      }
    } catch (err) {
      console.error('[Dashboard] Fetch error:', err);
      setError('Tidak bisa terhubung ke server');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  // Re-fetch saat user balik ke dashboard (dari halaman lain atau tab lain)
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchDashboard();
    };
    const onFocus = () => fetchDashboard();

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onFocus);
    };
  }, [fetchDashboard]);

  const saveQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuoteText.trim()) return;
    setSavingQuote(true);
    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newQuoteText.trim(), author: newQuoteAuthor.trim() || 'Unknown' }),
      });
      if (res.ok) {
        const q = await res.json();
        setData(prev => prev ? { ...prev, quote: { text: q.text, author: q.author, id: q.id } } : prev);
        setNewQuoteText('');
        setNewQuoteAuthor('');
        setShowQuoteModal(false);
      }
    } finally { setSavingQuote(false); }
  };

  const deleteQuote = async () => {
    if (!data?.quote) return;
    await fetch(`/api/quotes/${data.quote.id}`, { method: 'DELETE' });
    setData(prev => prev ? { ...prev, quote: null } : prev);
  };

  const toggleHabit = async (id: string, completed: boolean) => {
    // Optimistic update
    setData(prev => {
      if (!prev) return prev;
      const updatedHabits = prev.habits.map(h =>
        h.id === id ? { ...h, completed: !completed } : h
      );
      const completedHabits = updatedHabits.filter(h => h.completed).length;
      return { ...prev, habits: updatedHabits, completedHabits };
    });
    try {
      await fetch(`/api/habits/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !completed }),
      });
    } catch {
      // Revert jika gagal
      fetchDashboard();
    }
  };

  const diffVsYesterday = data ? data.focusTodayMinutes - data.focusYesterdayMinutes : 0;

  return (
    <>
      {/* Header */}
      <div className="dashboard-header">
        <div className="greeting">{greeting()}, {firstName} ✨</div>
        <h1 className="dashboard-title">
          Stay <span className="text-gradient" style={{ fontFamily: 'Times New Roman, serif', fontStyle: 'italic', fontWeight: 'normal' }}>focused</span> today.
        </h1>
        <p className="dashboard-subtitle">
          {loading ? 'Loading your progress...' :
            !data || data.todaySessionCount === 0
              ? "No sessions yet today — let's get started! 🚀"
              : `${data.todaySessionCount} session${data.todaySessionCount > 1 ? 's' : ''} done today · ${fmtMin(data.focusTodayMinutes)} focused so far. Keep it up!`
          }
        </p>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', padding: '12px 20px', borderRadius: 12, marginBottom: 24, fontSize: 14 }}>
          {error}
        </div>
      )}

      {/* Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon icon-purple">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            </div>
            <div className="stat-label">FOCUS TODAY</div>
          </div>
          <div className="stat-value">{loading ? '—' : fmtMin(data?.focusTodayMinutes || 0)}</div>
          <div className="stat-trend">
            {loading ? '' : diffVsYesterday === 0 ? 'Same as yesterday' : diffVsYesterday > 0 ? `+${fmtMin(diffVsYesterday)} vs yesterday` : `${fmtMin(Math.abs(diffVsYesterday))} less than yesterday`}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon icon-blue">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg>
            </div>
            <div className="stat-label">BEST STREAK</div>
          </div>
          <div className="stat-value">{loading ? '—' : `${data?.bestStreak || 0} `}<span>days</span></div>
          <div className="stat-trend">Personal best</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon icon-purple">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>
            </div>
            <div className="stat-label">GOALS</div>
          </div>
          <div className="stat-value">{loading ? '—' : `${data?.completedGoals || 0} / ${data?.totalGoals || 0}`}</div>
          <div className="stat-trend">{loading ? '' : `${data?.totalGoals ? data.totalGoals - data.completedGoals : 0} left to crush`}</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon icon-cyan">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
            </div>
            <div className="stat-label">DAILY AVG</div>
          </div>
          <div className="stat-value">{loading ? '—' : fmtMin(data?.weeklyAvgMinutes || 0)}</div>
          <div className="stat-trend">This week average</div>
        </div>
      </div>

      {/* Middle Grid */}
      <div className="middle-grid">
        <div className="left-column">
          {/* Weekly Productivity Chart */}
          <div className="panel productivity-chart-panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Weekly productivity</h2>
                <div className="panel-subtitle">
                  {chartView === 'week' ? 'Focus minutes, last 7 days' : 'Focus minutes, last 4 weeks'}
                </div>
              </div>
              <div className="chart-toggle">
                <button
                  className={`chart-toggle-btn ${chartView === 'week' ? 'active' : ''}`}
                  onClick={() => setChartView('week')}
                >Week</button>
                <button
                  className={`chart-toggle-btn ${chartView === 'month' ? 'active' : ''}`}
                  onClick={() => setChartView('month')}
                >Month</button>
              </div>
            </div>
            {/* Bar chart */}
            {(() => {
              const points = chartView === 'week'
                ? (data?.weeklyData ?? Array(7).fill({ label: '', minutes: 0 }))
                : (data?.monthlyData ?? Array(4).fill({ label: '', minutes: 0 }));
              const maxMins = Math.max(...points.map((p: ChartPoint) => p.minutes), 1);
              return (
                <div className="prod-chart-wrap">
                  <div className="prod-bars">
                    {points.map((p: ChartPoint, i: number) => {
                      const pct = (p.minutes / maxMins) * 100;
                      return (
                        <div key={i} className="prod-bar-col" title={`${p.label}: ${fmtMin(p.minutes)}`}>
                          <div className="prod-bar-fill" style={{ height: `${Math.max(pct, p.minutes > 0 ? 6 : 0)}%` }} />
                        </div>
                      );
                    })}
                  </div>
                  <div className="prod-x-axis">
                    {points.map((p: ChartPoint, i: number) => <span key={i}>{p.label}</span>)}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Habits */}
          <div className="panel" style={{ marginBottom: '20px' }}>
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Today's habits</h2>
                <div className="panel-subtitle">
                  {loading ? 'Loading...' : `${data?.completedHabits || 0} of ${data?.habits.length || 0} completed`}
                </div>
              </div>
              <Link href="/app/habits" className="panel-action">View all</Link>
            </div>
            <div className="habits-list">
              {loading ? (
                [...Array(3)].map((_, i) => <div key={i} className="habit-item skeleton" style={{ height: 40, borderRadius: 10, marginBottom: 8 }} />)
              ) : (data?.habits ?? []).length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: 13, padding: '12px 0' }}>No habits yet. <Link href="/app/habits" style={{ color: '#9d80ff' }}>Add one →</Link></p>
              ) : (
                (data?.habits ?? []).map(h => (
                  <div
                    key={h.id}
                    className={`habit-item ${h.completed ? 'completed' : ''}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => toggleHabit(h.id, h.completed)}
                  >
                    <div className="habit-info">
                      <div className={`checkbox ${h.completed ? 'checked' : ''}`}>
                        {h.completed && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        )}
                      </div>
                      <span className="habit-name">{h.name}</span>
                    </div>
                    <div className="habit-streak">🔥 {h.streak}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Goals */}
          <div className="panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Daily goals</h2>
                <div className="panel-subtitle">
                  {loading ? 'Loading...' : `${data?.completedGoals || 0} of ${data?.totalGoals || 0} completed`}
                </div>
              </div>
              <Link href="/app/goals" className="panel-action">View all</Link>
            </div>
            <div className="goals-list">
              {loading ? (
                [...Array(3)].map((_, i) => <div key={i} className="goal-item skeleton" style={{ height: 44, borderRadius: 10, marginBottom: 10 }} />)
              ) : (data?.goals ?? []).length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: 13, padding: '12px 0' }}>No goals yet. <Link href="/app/goals" style={{ color: '#9d80ff' }}>Add one →</Link></p>
              ) : (
                (data?.goals ?? []).map(g => (
                  <div key={g.id} className="goal-item">
                    <div className="goal-header">
                      <span style={{ color: g.isCompleted ? 'var(--text-muted)' : 'inherit' }}>{g.title}</span>
                      <span className="goal-percent">{g.progress}%</span>
                    </div>
                    <div className="progress-bar-bg">
                      <div className="progress-bar-fill" style={{ width: `${g.progress}%` }}></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="right-column">
          {/* Quote Widget */}
          <div className="quote-widget" style={{ position: 'relative' }}>
            <div className="quote-widget-actions">
              <button className="quote-edit-btn" onClick={() => setShowQuoteModal(true)} title="Add / change quote">✏️</button>
              {data?.quote && (
                <button className="quote-delete-btn" onClick={deleteQuote} title="Remove quote">×</button>
              )}
            </div>
            <div className="quote-icon">"</div>
            {loading ? (
              <p className="quote-text" style={{ color: 'var(--text-muted)' }}>Loading...</p>
            ) : data?.quote ? (
              <>
                <p className="quote-text">{data.quote.text}</p>
                <p className="quote-author">— {data.quote.author}</p>
              </>
            ) : (
              <>
                <p className="quote-text" style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Add your own motivational quote...</p>
                <button className="quote-add-btn" onClick={() => setShowQuoteModal(true)}>+ Add quote</button>
              </>
            )}
          </div>

          {/* Journal Widget */}
          <div className="panel journal-widget">
            <div className="journal-widget-header">
              <span className="stat-label">JOURNAL</span>
              <Link href="/app/journal" style={{ color: 'var(--text-muted)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17l9.2-9.2M17 17V7H7"/></svg>
              </Link>
            </div>
            {loading ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading...</p>
            ) : data?.latestJournal ? (
              <Link href="/app/journal" className="journal-widget-link">
                <p className="journal-widget-text">{data.latestJournal.content || 'No content yet.'}</p>
                <div className="journal-widget-meta">
                  {data.latestJournal.mood && <span>Mood: {data.latestJournal.mood}</span>}
                  <span>{new Date(data.latestJournal.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
              </Link>
            ) : (
              <Link href="/app/journal" className="journal-widget-link" style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 13 }}>
                No journal entries yet. Write one →
              </Link>
            )}
          </div>

          {/* This Week Stats */}
          <div className="panel this-week-widget">
            <div className="stat-label" style={{ marginBottom: 16 }}>✦ THIS WEEK</div>
            <div className="this-week-grid">
              <div className="tw-stat">
                <div className="tw-value">{loading ? '—' : fmtMin(data?.thisWeek?.focusMinutes ?? 0)}</div>
                <div className="tw-label">Total focus</div>
              </div>
              <div className="tw-stat">
                <div className="tw-value">{loading ? '—' : data?.thisWeek?.pomodoros ?? 0}</div>
                <div className="tw-label">Pomodoros</div>
              </div>
              <div className="tw-stat">
                <div className="tw-value">{loading ? '—' : data?.thisWeek?.habitsHit ?? 0}</div>
                <div className="tw-label">Habits hit</div>
              </div>
              <div className="tw-stat">
                <div className="tw-value">{loading ? '—' : data?.thisWeek?.journalDays ?? 0}</div>
                <div className="tw-label">Journal days</div>
              </div>
            </div>
          </div>

          {/* Pomodoro Widget */}
          <div className="panel pomodoro-widget">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
              <div className="stat-label">POMODORO</div>
              <Link href="/app/pomodoro" style={{ color: 'var(--text-muted)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17l9.2-9.2M17 17V7H7"/></svg>
              </Link>
            </div>
            <div className="mini-timer">
              <div className="mini-time">25:00</div>
              <div className="mini-label">FOCUS</div>
            </div>
            <Link href="/app/pomodoro">
              <button className="btn-start">▶ Start session</button>
            </Link>
            {!loading && data && (
              <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: 10 }}>
                {data.todaySessionCount} sessions today
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Quote Modal */}
      {showQuoteModal && (
        <div className="modal-overlay" onClick={() => setShowQuoteModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Your Motivational Quote</h2>
              <button className="modal-close" onClick={() => setShowQuoteModal(false)}>×</button>
            </div>
            <p className="modal-subtitle">This will show on your dashboard every day.</p>
            <form onSubmit={saveQuote}>
              <textarea
                className="modal-input"
                placeholder="The secret of your future is hidden in your daily routine."
                value={newQuoteText}
                onChange={e => setNewQuoteText(e.target.value)}
                rows={3}
                autoFocus
                style={{ resize: 'vertical', lineHeight: 1.6 }}
              />
              <input
                className="modal-input"
                type="text"
                placeholder="— Author name"
                value={newQuoteAuthor}
                onChange={e => setNewQuoteAuthor(e.target.value)}
                style={{ marginTop: -8 }}
              />
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowQuoteModal(false)}>Cancel</button>
                <button type="submit" className="btn-confirm" disabled={savingQuote || !newQuoteText.trim()}>
                  {savingQuote ? 'Saving...' : 'Save quote'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
