import Link from 'next/link';
import './StudyRoomPreview.css';

export default function StudyRoomPreview() {
  return (
    <section className="preview-section container section" id="rooms">
      <div className="preview-layout">
        <div className="preview-content">
          <p className="preview-subtitle">Dashboard overview</p>
          <h2 className="preview-title">Semua dalam satu tempat.</h2>
          <p className="preview-description">
            Dashboard yang terintegrasi — pantau habit, goals, jadwal kuliah, dan sesi fokus kamu dalam satu tampilan yang rapi dan real-time.
          </p>
          <Link href="/login" className="btn btn-primary btn-large preview-btn">
            Mulai sekarang <span>→</span>
          </Link>
        </div>

        <div className="preview-visual">
          <div className="room-card glass-card">
            <div className="room-header">
              <div className="room-name">
                <span className="live-dot"></span>
                Dashboard
              </div>
              <div className="room-online">Real-time</div>
            </div>

            {/* Mini dashboard preview */}
            <div style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Habit mini */}
              <div style={{ background: 'rgba(139,92,246,0.1)', borderRadius: '10px', padding: '10px 14px' }}>
                <div style={{ fontSize: '11px', color: '#a78bfa', fontWeight: 600, marginBottom: '6px' }}>🔥 TODAY'S HABITS</div>
                {['Baca buku', 'Coding', 'Olahraga'].map((h, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <div style={{ width: '14px', height: '14px', borderRadius: '4px', background: i < 2 ? '#9d80ff' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {i < 2 && <span style={{ fontSize: '9px', color: 'white' }}>✓</span>}
                    </div>
                    <span style={{ fontSize: '12px', color: i < 2 ? 'white' : 'rgba(255,255,255,0.4)', textDecoration: i < 2 ? 'none' : 'none' }}>{h}</span>
                  </div>
                ))}
              </div>

              {/* Pomodoro mini */}
              <div style={{ background: 'rgba(76,201,240,0.08)', borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="pomodoro-timer animate-pulse-glow" style={{ transform: 'scale(0.55)', transformOrigin: 'left center', flexShrink: 0 }}>
                  <svg className="timer-ring" viewBox="0 0 100 100">
                    <circle className="timer-ring-bg" cx="50" cy="50" r="45"></circle>
                    <circle className="timer-ring-progress" cx="50" cy="50" r="45"></circle>
                  </svg>
                  <div className="timer-content">
                    <div className="timer-time">18:42</div>
                    <div className="timer-label">Focus</div>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: 'white', fontWeight: 600 }}>Focus session</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>3 sessions today</div>
                </div>
              </div>
            </div>

            <div className="room-footer">
              <div className="users-list">
                <span className="user-name">Habit ✓</span>
                <span className="user-name">Goals</span>
                <span className="user-name">Journal</span>
                <span className="user-more">+more</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
