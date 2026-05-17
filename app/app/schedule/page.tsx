'use client';

import { useState, useEffect } from 'react';
import './schedule.css';

const DAYS = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
const DAY_COLORS: Record<string, string> = {
  SENIN: '#9d80ff', SELASA: '#4cc9f0', RABU: '#34d399',
  KAMIS: '#f59e0b', JUMAT: '#ec4899', SABTU: '#a78bfa',
};

type Schedule = {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  room: string;
  courseCode: string;
  courseName: string;
  lecturerCode: string | null;
  classCode: string | null;
};

const emptyForm = {
  day: 'SENIN', startTime: '', endTime: '', room: '',
  courseCode: '', courseName: '', lecturerCode: '', classCode: '',
};

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [activeDay, setActiveDay] = useState<string>('ALL');

  useEffect(() => {
    const todayIdx = new Date().getDay(); // 0=Sun
    const todayName = ['AHAD','SENIN','SELASA','RABU','KAMIS','JUMAT','SABTU'][todayIdx] || 'SENIN';
    setActiveDay(DAYS.includes(todayName) ? todayName : 'ALL');
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/schedule');
      if (res.ok) setSchedules(await res.json());
    } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const s = await res.json();
        setSchedules(prev => [...prev, s].sort((a, b) => {
          if (a.day !== b.day) return DAYS.indexOf(a.day) - DAYS.indexOf(b.day);
          return a.startTime.localeCompare(b.startTime);
        }));
        setForm(emptyForm);
        setShowForm(false);
      }
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/schedule/${id}`, { method: 'DELETE' });
    setSchedules(prev => prev.filter(s => s.id !== id));
  };

  const filtered = activeDay === 'ALL'
    ? schedules
    : schedules.filter(s => s.day === activeDay);

  const grouped = DAYS.reduce((acc, d) => {
    acc[d] = filtered.filter(s => s.day === d);
    return acc;
  }, {} as Record<string, Schedule[]>);

  return (
    <div className="schedule-page">
      {/* Header */}
      <div className="schedule-header">
        <div>
          <div className="schedule-eyebrow">JADWAL KULIAH</div>
          <h1 className="schedule-title">Your Class <span className="schedule-title-italic">Schedule.</span></h1>
          <p className="schedule-subtitle">{schedules.length} mata kuliah terdaftar</p>
        </div>
        <button className="btn-add-schedule" onClick={() => setShowForm(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Tambah jadwal
        </button>
      </div>

      {/* Day Filter Tabs */}
      <div className="day-tabs">
        <button
          className={`day-tab ${activeDay === 'ALL' ? 'active' : ''}`}
          onClick={() => setActiveDay('ALL')}
        >Semua</button>
        {DAYS.map(d => (
          <button
            key={d}
            className={`day-tab ${activeDay === d ? 'active' : ''}`}
            style={activeDay === d ? { borderColor: DAY_COLORS[d], color: DAY_COLORS[d], background: `${DAY_COLORS[d]}18` } : {}}
            onClick={() => setActiveDay(d)}
          >
            {d}
            {schedules.filter(s => s.day === d).length > 0 && (
              <span className="day-count">{schedules.filter(s => s.day === d).length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Schedule List */}
      {loading ? (
        <div className="schedule-loading">Loading...</div>
      ) : schedules.length === 0 ? (
        <div className="schedule-empty">
          <div className="schedule-empty-icon">📅</div>
          <h3>Jadwal masih kosong</h3>
          <p>Klik "Tambah jadwal" untuk mulai memasukkan jadwal kuliah kamu.</p>
        </div>
      ) : (
        <div className="schedule-groups">
          {DAYS.map(day => {
            const items = grouped[day];
            if (!items || items.length === 0) return null;
            return (
              <div key={day} className="schedule-group">
                <div className="schedule-day-label" style={{ color: DAY_COLORS[day] }}>
                  <span className="day-dot" style={{ background: DAY_COLORS[day] }} />
                  {day}
                </div>
                <div className="schedule-cards">
                  {items.map(s => (
                    <div key={s.id} className="schedule-card" style={{ borderLeftColor: DAY_COLORS[s.day] }}>
                      <div className="sc-time">
                        <span className="sc-time-main">{s.startTime}</span>
                        <span className="sc-time-sep">—</span>
                        <span>{s.endTime}</span>
                      </div>
                      <div className="sc-main">
                        <div className="sc-name">{s.courseName}</div>
                        <div className="sc-meta">
                          <span className="sc-badge code">{s.courseCode}</span>
                          <span className="sc-badge room">📍 {s.room}</span>
                          {s.lecturerCode && <span className="sc-badge lecturer">👤 {s.lecturerCode}</span>}
                          {s.classCode && <span className="sc-badge class">{s.classCode}</span>}
                        </div>
                      </div>
                      <button className="sc-delete" onClick={() => handleDelete(s.id)} title="Hapus">×</button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="schedule-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Tambah Jadwal</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="schedule-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Hari *</label>
                  <select value={form.day} onChange={e => setForm(f => ({ ...f, day: e.target.value }))}>
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Jam Mulai *</label>
                  <input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label>Jam Selesai *</label>
                  <input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Kode Matkul *</label>
                  <input type="text" placeholder="CAK2HAB3" value={form.courseCode} onChange={e => setForm(f => ({ ...f, courseCode: e.target.value }))} required />
                </div>
                <div className="form-group" style={{ flex: 2 }}>
                  <label>Nama Mata Kuliah *</label>
                  <input type="text" placeholder="Dasar Kecerdasan Artifisial" value={form.courseName} onChange={e => setForm(f => ({ ...f, courseName: e.target.value }))} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Ruangan *</label>
                  <input type="text" placeholder="REK-304" value={form.room} onChange={e => setForm(f => ({ ...f, room: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label>Kode Dosen</label>
                  <input type="text" placeholder="YDR" value={form.lecturerCode} onChange={e => setForm(f => ({ ...f, lecturerCode: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Kelas</label>
                  <input type="text" placeholder="PS1IF-12-REG01" value={form.classCode} onChange={e => setForm(f => ({ ...f, classCode: e.target.value }))} />
                </div>
              </div>
              <button type="submit" className="btn-save-schedule" disabled={saving}>
                {saving ? 'Menyimpan...' : '+ Simpan Jadwal'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
