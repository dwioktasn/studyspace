'use client';

import { useState, useEffect } from 'react';
import './statistics.css';

type StatsData = {
  totalMonthMinutes: number;
  weeklyAvgMinutes: number;
  goalsHitPercent: number;
  completedGoals: number;
  totalGoals: number;
  bestStreak: number;
  completedHabitsToday: number;
  totalHabits: number;
  weeklyData: { day: string; minutes: number }[];
  distribution: { type: string; minutes: number; percent: number }[];
  consistency: { date: string; minutes: number }[];
};

function fmtMinutes(mins: number) {
  if (mins === 0) return '0m';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function consistencyLevel(mins: number): number {
  if (mins === 0) return 0;
  if (mins < 25) return 1;
  if (mins < 60) return 2;
  return 3;
}

const TYPE_COLORS: Record<string, string> = {
  'Deep Work': '#9d80ff',
  'Study': '#4cc9f0',
  'Creative': '#34d399',
};

export default function StatisticsPage() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/statistics')
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); return; }
        setData(d);
      })
      .catch(() => setError('Gagal memuat statistik'))
      .finally(() => setLoading(false));
  }, []);

  const maxWeekMinutes = data ? Math.max(...data.weeklyData.map(d => d.minutes), 1) : 1;

  // Donut chart conic-gradient
  const donutGradient = data?.distribution.length
    ? (() => {
        let angle = 0;
        const stops = data.distribution.map(d => {
          const color = TYPE_COLORS[d.type] || '#6366f1';
          const deg = (d.percent / 100) * 360;
          const stop = `${color} ${angle}deg ${angle + deg}deg`;
          angle += deg;
          return stop;
        });
        // remainder = dark
        if (angle < 360) stops.push(`rgba(255,255,255,0.04) ${angle}deg 360deg`);
        return `conic-gradient(${stops.join(', ')})`;
      })()
    : 'conic-gradient(rgba(255,255,255,0.04) 0deg 360deg)';

  const topType = data?.distribution[0];

  if (loading) return (
    <div className="statistics-container">
      <div className="stats-hero">
        <span className="analytics-label">ANALYTICS</span>
        <h1 className="hero-title">Your <span className="text-gradient-italic">focus story.</span></h1>
      </div>
      <div className="stats-summary-grid">
        {[...Array(4)].map((_, i) => <div key={i} className="summary-card skeleton" />)}
      </div>
    </div>
  );

  if (error) return (
    <div className="statistics-container">
      <div className="stats-error">{error}</div>
    </div>
  );

  return (
    <div className="statistics-container">
      {/* Hero */}
      <div className="stats-hero">
        <span className="analytics-label">ANALYTICS</span>
        <h1 className="hero-title">
          Your <span className="text-gradient-italic">focus story.</span>
        </h1>
      </div>

      {/* Summary Cards */}
      <div className="stats-summary-grid">
        <div className="summary-card">
          <div className="summary-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          </div>
          <div className="summary-value">{fmtMinutes(data!.totalMonthMinutes)}</div>
          <div className="summary-label">Total focus • this month</div>
        </div>
        <div className="summary-card">
          <div className="summary-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
          </div>
          <div className="summary-value">{fmtMinutes(data!.weeklyAvgMinutes)}</div>
          <div className="summary-label">Daily avg • this week</div>
        </div>
        <div className="summary-card">
          <div className="summary-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="2"></circle></svg>
          </div>
          <div className="summary-value">{data!.goalsHitPercent}%</div>
          <div className="summary-label">Goals hit • {data!.completedGoals} of {data!.totalGoals}</div>
        </div>
        <div className="summary-card">
          <div className="summary-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg>
          </div>
          <div className="summary-value">{data!.bestStreak} days</div>
          <div className="summary-label">Best habit streak</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        {/* Bar Chart */}
        <div className="panel chart-main">
          <div className="panel-header-simple">
            <h3 className="panel-title-small">Weekly focus</h3>
            <div className="chart-legend">
              <span className="legend-item"><span className="dot purple"></span> Focus (min)</span>
            </div>
          </div>
          <div className="chart-placeholder-bars">
            <div className="bars-container">
              {data!.weeklyData.map((d, i) => {
                const heightPct = maxWeekMinutes > 0 ? (d.minutes / maxWeekMinutes) * 100 : 0;
                return (
                  <div key={i} className="bar-group" title={`${d.day}: ${fmtMinutes(d.minutes)}`}>
                    <div className="bar-focus" style={{ height: `${Math.max(heightPct, d.minutes > 0 ? 4 : 0)}%` }}></div>
                  </div>
                );
              })}
            </div>
            <div className="x-axis">
              {data!.weeklyData.map(d => <span key={d.day}>{d.day}</span>)}
            </div>
          </div>
        </div>

        {/* Donut Chart */}
        <div className="panel chart-donut-container">
          <h3 className="panel-title-small">Focus distribution</h3>
          <p className="panel-subtitle-tiny">By session type</p>
          {data!.distribution.length === 0 ? (
            <div className="no-data-msg">No sessions yet</div>
          ) : (
            <>
              <div className="donut-wrapper">
                <div className="donut-chart" style={{ background: donutGradient }}>
                  <div className="donut-center">
                    <span className="donut-val">{topType?.percent ?? 0}%</span>
                    <span className="donut-label">{topType?.type?.toUpperCase() ?? ''}</span>
                  </div>
                </div>
              </div>
              <div className="dist-stats">
                {data!.distribution.map(d => (
                  <div key={d.type} className="dist-item">
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="dist-dot" style={{ background: TYPE_COLORS[d.type] || '#6366f1' }}></span>
                      {d.type}
                    </span>
                    <span>{d.percent}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 30-day Consistency */}
      <div className="panel consistency-panel">
        <div className="consistency-header">
          <h3 className="panel-title-small">Last 30 days • consistency</h3>
          <span className="const-legend">Each box = 1 day</span>
        </div>
        <div className="consistency-grid">
          {data!.consistency.map((c, i) => (
            <div
              key={i}
              className={`const-box level-${consistencyLevel(c.minutes)}`}
              title={`${c.date}: ${fmtMinutes(c.minutes)}`}
            />
          ))}
        </div>
        <div className="const-footer-row">
          <span className="const-footer">Less</span>
          <div className="const-scale">
            {[0, 1, 2, 3].map(l => <div key={l} className={`const-box level-${l}`} style={{ width: 14, height: 14 }} />)}
          </div>
          <span className="const-footer">More</span>
        </div>
      </div>
    </div>
  );
}