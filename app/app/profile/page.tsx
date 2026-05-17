'use client';

import { useState, useEffect } from 'react';
import './profile.css';

type Achievement = { id: string; emoji: string; name: string; desc: string; earned: boolean };
type WeekData = { week: string; minutes: number };

type ProfileData = {
  username: string;
  joinedAt: string;
  totalMinutes: number;
  bestStreak: number;
  goalsCompleted: number;
  totalSessions: number;
  avgSession: number;
  bestDay: string;
  bestDayMinutes: number;
  favoriteType: string;
  weeklyHistory: WeekData[];
  achievements: Achievement[];
};

function fmtH(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function joinedDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export default function ProfilePage() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setData(d); })
      .catch(() => setError('Gagal memuat profil'))
      .finally(() => setLoading(false));
  }, []);

  const initial = data?.username?.[0]?.toUpperCase() || '?';
  const earnedCount = data?.achievements.filter(a => a.earned).length ?? 0;
  const maxWeek = data ? Math.max(...data.weeklyHistory.map(w => w.minutes), 1) : 1;

  if (error) return (
    <div className="profile-page">
      <div className="profile-error">{error}</div>
    </div>
  );

  return (
    <div className="profile-page">
      {/* Profile Card */}
      <div className="profile-card">
        <div className="avatar-wrap">
          <div className="avatar-ring">
            <div className="avatar-inner">{initial}</div>
          </div>
          <div className="avatar-badge">{data?.bestStreak ?? 0}</div>
        </div>

        <div className="profile-info">
          <h1 className="profile-name">
            {loading ? '...' : `@${data!.username}`}
          </h1>
          <p className="profile-meta">
            {loading ? 'Loading...' : `Joined ${joinedDate(data!.joinedAt)} · ${data!.totalSessions} focus sessions`}
          </p>
          <div className="profile-tags">
            {!loading && data && (
              <>
                {data.totalSessions >= 25 && <span className="profile-tag">💎 Deep worker</span>}
                {data.bestStreak >= 3 && <span className="profile-tag">🔥 {data.bestStreak}-day streak</span>}
                {earnedCount >= 5 && <span className="profile-tag">🏆 Top achiever</span>}
                {data.totalSessions === 0 && <span className="profile-tag">🌱 Just getting started</span>}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stat Grid */}
      <div className="profile-stats-grid">
        <div className="profile-stat-card">
          <div className="pstat-icon">⏱️</div>
          <div className="pstat-value">{loading ? '—' : fmtH(data!.totalMinutes)}</div>
          <div className="pstat-label">Total focus</div>
        </div>
        <div className="profile-stat-card">
          <div className="pstat-icon">🔥</div>
          <div className="pstat-value">{loading ? '—' : `${data!.bestStreak} days`}</div>
          <div className="pstat-label">Best streak</div>
        </div>
        <div className="profile-stat-card">
          <div className="pstat-icon">🎯</div>
          <div className="pstat-value">{loading ? '—' : data!.goalsCompleted}</div>
          <div className="pstat-label">Goals done</div>
        </div>
        <div className="profile-stat-card">
          <div className="pstat-icon">🍅</div>
          <div className="pstat-value">{loading ? '—' : data!.totalSessions}</div>
          <div className="pstat-label">Sessions</div>
        </div>
      </div>

      {/* Focus History */}
      <div className="panel profile-panel">
        <div className="panel-top">
          <div>
            <h3 className="panel-title-sm">Focus history</h3>
            <p className="panel-sub">Last 12 weeks</p>
          </div>
        </div>
        <div className="weekly-chart">
          <div className="weekly-bars">
            {(data?.weeklyHistory ?? Array(12).fill({ week: '', minutes: 0 })).map((w, i) => {
              const pct = maxWeek > 0 ? (w.minutes / maxWeek) * 100 : 0;
              return (
                <div key={i} className="weekly-bar-group" title={`${w.week}: ${fmtH(w.minutes)}`}>
                  <div className="weekly-bar-fill" style={{ height: `${Math.max(pct, w.minutes > 0 ? 4 : 0)}%` }} />
                </div>
              );
            })}
          </div>
          <div className="weekly-x">
            {(data?.weeklyHistory ?? Array(12).fill({ week: '' })).map((w, i) => (
              <span key={i}>{w.week}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Productivity Summary */}
      <div className="panel profile-panel">
        <h3 className="panel-title-sm" style={{ marginBottom: 20 }}>Productivity summary</h3>
        <div className="prod-grid">
          <div className="prod-card">
            <div className="prod-label">Avg session</div>
            <div className="prod-value">{loading ? '—' : `${data!.avgSession} min`}</div>
            <div className="prod-sub" style={{ color: '#4cc9f0' }}>Per focus session</div>
          </div>
          <div className="prod-card">
            <div className="prod-label">Best day</div>
            <div className="prod-value">{loading ? '—' : data!.bestDay}</div>
            <div className="prod-sub" style={{ color: '#4cc9f0' }}>{loading ? '' : fmtH(data!.bestDayMinutes) + ' focus'}</div>
          </div>
          <div className="prod-card">
            <div className="prod-label">Favorite type</div>
            <div className="prod-value" style={{ fontSize: 22 }}>{loading ? '—' : data!.favoriteType}</div>
            <div className="prod-sub" style={{ color: '#4cc9f0' }}>Most sessions</div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="panel profile-panel">
        <div className="panel-top">
          <h3 className="panel-title-sm">✦ Achievements</h3>
          <span className="achiev-count">{earnedCount} / {data?.achievements.length ?? 0} earned</span>
        </div>
        <div className="achiev-grid">
          {(loading ? Array(9).fill(null) : data!.achievements).map((a, i) => (
            <div key={i} className={`achiev-card ${a?.earned ? 'earned' : 'locked'} ${!a ? 'skeleton' : ''}`}>
              {a && (
                <>
                  <div className="achiev-emoji" style={{ opacity: a.earned ? 1 : 0.25 }}>{a.emoji}</div>
                  <div className="achiev-name" style={{ opacity: a.earned ? 1 : 0.4 }}>{a.name}</div>
                  {!a.earned && <div className="achiev-lock">🔒</div>}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
