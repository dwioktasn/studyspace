'use client';

import { useState, useEffect, useCallback } from 'react';
import './goals.css';

type Goal = {
  id: string;
  title: string;
  progress: number;
  isCompleted: boolean;
  createdAt: string;
};

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchGoals = useCallback(async () => {
    try {
      const res = await fetch('/api/goals');
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `Error ${res.status}`);
      setGoals(await res.json());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memuat goals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  // Update progress slider
  const updateProgress = async (id: string, progress: number) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, progress, isCompleted: progress === 100 } : g));
    try {
      await fetch(`/api/goals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress }),
      });
    } catch { fetchGoals(); }
  };

  // Delete
  const deleteGoal = async (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
    try {
      await fetch(`/api/goals/${id}`, { method: 'DELETE' });
    } catch { fetchGoals(); }
  };

  // Add
  const addGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setAdding(true);
    setError('');
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim() }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Gagal');
      const goal = await res.json();
      setGoals(prev => [goal, ...prev]);
      setNewTitle('');
      setShowModal(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menambah goal');
    } finally {
      setAdding(false);
    }
  };

  const completed = goals.filter(g => g.isCompleted).length;
  const avgProgress = goals.length ? Math.round(goals.reduce((s, g) => s + g.progress, 0) / goals.length) : 0;

  return (
    <div className="goals-page">
      {/* Header */}
      <div className="goals-header">
        <div>
          <div className="goals-label">DAILY GOALS</div>
          <h1 className="goals-title">
            Set your <span className="text-gradient" style={{ fontFamily: 'Times New Roman, serif', fontStyle: 'italic', fontWeight: 'normal' }}>intentions.</span>
          </h1>
          {!loading && (
            <p className="goals-meta">{completed} of {goals.length} completed · {avgProgress}% average progress</p>
          )}
        </div>
        <button className="btn-new-goal" onClick={() => setShowModal(true)}>
          <span>+</span> New goal
        </button>
      </div>

      {error && <div className="goals-error">{error}</div>}

      {/* Content */}
      {loading ? (
        <div className="goals-list">
          {[...Array(3)].map((_, i) => <div key={i} className="goal-card skeleton" />)}
        </div>
      ) : goals.length === 0 ? (
        <div className="goals-empty" onClick={() => setShowModal(true)}>
          <div className="goals-empty-icon">🎯</div>
          <p>No goals yet. Set your first intention!</p>
        </div>
      ) : (
        <div className="goals-list">
          {goals.map(goal => (
            <div key={goal.id} className={`goal-card ${goal.isCompleted ? 'completed' : ''}`}>
              <div className="goal-card-header">
                <div className="goal-title-row">
                  <div className={`goal-check ${goal.isCompleted ? 'done' : ''}`}>
                    {goal.isCompleted && '✓'}
                  </div>
                  <span className="goal-title-text">{goal.title}</span>
                </div>
                <div className="goal-card-right">
                  <span className="goal-percent">{goal.progress}%</span>
                  <button className="goal-delete-btn" onClick={() => deleteGoal(goal.id)}>×</button>
                </div>
              </div>

              {/* Progress Slider */}
              <div className="goal-slider-row">
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={goal.progress}
                  className="goal-slider"
                  onChange={e => updateProgress(goal.id, Number(e.target.value))}
                />
              </div>

              {/* Progress Bar Visual */}
              <div className="goal-bar-bg">
                <div
                  className="goal-bar-fill"
                  style={{ width: `${goal.progress}%` }}
                />
              </div>

              <div className="goal-footer">
                {goal.isCompleted
                  ? '🎉 Completed!'
                  : goal.progress === 0
                  ? 'Drag slider to update progress'
                  : `${100 - goal.progress}% to go`}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>New Goal</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <p className="modal-subtitle">What do you want to achieve?</p>
            <form onSubmit={addGoal}>
              <input
                className="modal-input"
                type="text"
                placeholder="e.g. Finish landing page hero, Read 30 pages..."
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                autoFocus
                maxLength={100}
              />
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-confirm" disabled={adding || !newTitle.trim()}>
                  {adding ? 'Adding...' : 'Add Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
