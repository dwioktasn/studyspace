'use client';

import { useState, useEffect, useCallback } from 'react';
import "./habits.css";

type Habit = {
  id: string;
  name: string;
  streak: number;
  completed: boolean;
  createdAt: string;
};

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  const fetchHabits = useCallback(async () => {
    try {
      const res = await fetch('/api/habits');
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.error('[Habits] API error:', res.status, body);
        setError(`Gagal memuat habits (${res.status}). Coba refresh halaman.`);
        return;
      }
      const data = await res.json();
      setHabits(data);
    } catch (err) {
      console.error('[Habits] Fetch error:', err);
      setError('Tidak bisa terhubung ke server. Coba refresh halaman.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  // Toggle completed
  const toggleHabit = async (id: string, currentStatus: boolean) => {
    // Optimistic update
    setHabits(prev =>
      prev.map(h =>
        h.id === id
          ? { ...h, completed: !currentStatus, streak: !currentStatus ? h.streak + 1 : Math.max(0, h.streak - 1) }
          : h
      )
    );

    try {
      await fetch(`/api/habits/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !currentStatus }),
      });
    } catch {
      // Revert on failure
      fetchHabits();
    }
  };

  // Delete habit
  const deleteHabit = async (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
    try {
      await fetch(`/api/habits/${id}`, { method: 'DELETE' });
    } catch {
      fetchHabits();
    }
  };

  // Add new habit
  const addHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;

    setAdding(true);
    setError('');
    try {
      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newHabitName.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Error ${res.status}`);
      }
      const newHabit = await res.json();
      setHabits(prev => [newHabit, ...prev]);
      setNewHabitName('');
      setShowModal(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menambah habit';
      setError(msg);
    } finally {
      setAdding(false);
    }
  };

  const completedToday = habits.filter(h => h.completed).length;

  return (
    <div>
      {/* Header */}
      <div className="habits-header">
        <div className="habits-title-area">
          <div className="habits-subtitle">DAILY RITUALS</div>
          <h1 className="habits-title">
            <span>Tiny habits,</span>{' '}
            <span
              className="text-gradient"
              style={{ fontFamily: 'Times New Roman, serif', fontStyle: 'italic', fontWeight: 'normal' }}
            >
              big momentum.
            </span>
          </h1>
          {!loading && (
            <p className="habits-count">
              {completedToday} of {habits.length} done today
            </p>
          )}
        </div>
        <button className="btn-new-habit" onClick={() => setShowModal(true)}>
          <span>+</span> New habit
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="habits-error">{error}</div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="habits-loading">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="habit-card skeleton"></div>
          ))}
        </div>
      ) : (
        <div className="habits-grid">
          {habits.map((habit) => (
            <div
              key={habit.id}
              className={`habit-card ${habit.completed ? 'completed-card' : ''}`}
            >
              <div className="habit-card-header">
                <div className="habit-card-title">
                  <button
                    className={`habit-icon ${habit.completed ? 'done' : ''}`}
                    onClick={() => toggleHabit(habit.id, habit.completed)}
                    aria-label="Toggle habit"
                  ></button>
                  <span>{habit.name}</span>
                </div>
                <div className="habit-card-right">
                  <div className="habit-streak">🔥 {habit.streak}</div>
                  <button
                    className="habit-delete-btn"
                    onClick={() => deleteHabit(habit.id)}
                    aria-label="Delete habit"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="habit-week-stats">
                <span>STREAK</span>
                <span>{habit.streak} days</span>
              </div>

              <div className="habit-status-bar">
                <div
                  className="habit-status-fill"
                  style={{ width: habit.completed ? '100%' : '0%' }}
                ></div>
              </div>

              <div className="habit-footer-text">
                {habit.completed ? '✓ Done today!' : 'Tap to complete'}
              </div>
            </div>
          ))}

          {/* Add New Card */}
          <div className="habit-card add-new" onClick={() => setShowModal(true)}>
            + Add new habit
          </div>
        </div>
      )}

      {/* Add Habit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>New Habit</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <p className="modal-subtitle">What habit do you want to build?</p>
            <form onSubmit={addHabit}>
              <input
                className="modal-input"
                type="text"
                placeholder="e.g. Morning meditation, Read 20 pages..."
                value={newHabitName}
                onChange={e => setNewHabitName(e.target.value)}
                autoFocus
                maxLength={80}
              />
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-confirm" disabled={adding || !newHabitName.trim()}>
                  {adding ? 'Adding...' : 'Add Habit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
