'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import './journal.css';

type JournalEntry = {
  id: string;
  title: string;
  content: string;
  mood: string | null;
  createdAt: string;
};

const MOODS = [
  { label: 'Calm', emoji: '✨' },
  { label: 'Energized', emoji: '🔥' },
  { label: 'Reflective', emoji: '🌧️' },
  { label: 'Tired', emoji: '☁️' },
  { label: 'Grateful', emoji: '🌸' },
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  }).toUpperCase();
}

function formatCardDate(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Editor state
  const [editingId, setEditingId] = useState<string | null>(null); // null = new entry
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'saving'>('idle');
  const [error, setError] = useState('');

  // Auto-save timer
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isEditing = useRef(false);

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch('/api/journals');
      if (!res.ok) throw new Error('Failed');
      setEntries(await res.json());
    } catch {
      setError('Gagal memuat jurnal.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  // Auto-save saat sedang edit existing entry
  const scheduleAutoSave = useCallback(() => {
    if (!isEditing.current || !editingId) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    setSaveStatus('saving');
    autoSaveTimer.current = setTimeout(async () => {
      try {
        await fetch(`/api/journals/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content, mood }),
        });
        setSaveStatus('saved');
        // Update local list
        setEntries(prev => prev.map(e => e.id === editingId ? { ...e, title, content, mood } : e));
      } catch {
        setSaveStatus('idle');
      }
    }, 1500);
  }, [editingId, title, content, mood]);

  // Open existing entry for editing
  const openEntry = (entry: JournalEntry) => {
    isEditing.current = true;
    setEditingId(entry.id);
    setTitle(entry.title);
    setContent(entry.content);
    setMood(entry.mood || '');
    setSaveStatus('idle');
    setError('');
  };

  // Start new entry
  const newEntry = () => {
    isEditing.current = false;
    setEditingId(null);
    setTitle('');
    setContent('');
    setMood('');
    setSaveStatus('idle');
    setError('');
  };

  // Save entry (new or update)
  const saveEntry = async () => {
    if (!title.trim()) { setError('Judul tidak boleh kosong'); return; }
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        // Update existing
        const res = await fetch(`/api/journals/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content, mood }),
        });
        if (!res.ok) throw new Error((await res.json()).error || 'Gagal');
        const updated = await res.json();
        setEntries(prev => prev.map(e => e.id === editingId ? updated : e));
        setSaveStatus('saved');
      } else {
        // Create new
        const res = await fetch('/api/journals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content, mood }),
        });
        if (!res.ok) throw new Error((await res.json()).error || 'Gagal');
        const created = await res.json();
        setEntries(prev => [created, ...prev]);
        // Reset editor ke kosong biar bisa langsung nulis lagi
        isEditing.current = false;
        setEditingId(null);
        setTitle('');
        setContent('');
        setMood('');
        setSaveStatus('idle');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  // Delete entry
  const deleteEntry = async (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
    if (editingId === id) newEntry();
    try {
      await fetch(`/api/journals/${id}`, { method: 'DELETE' });
    } catch { fetchEntries(); }
  };

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="journal-container">
      {/* Hero */}
      <div className="journal-hero">
        <span className="analytics-label">STUDY JOURNAL</span>
        <h1 className="hero-title">
          A page for <span className="text-gradient-italic">your thoughts.</span>
        </h1>
      </div>

      {error && <div className="journal-error">{error}</div>}

      {/* Editor Panel */}
      <div className="panel journal-editor">
        {/* Header */}
        <div className="editor-header">
          <div className="date-meta">
            <span className="date-text">
              {editingId
                ? formatDate(entries.find(e => e.id === editingId)?.createdAt || new Date().toISOString())
                : new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase()}
            </span>
            <span className="question">How are you feeling?</span>
          </div>
          <div className="mood-chips">
            {MOODS.map(m => (
              <button
                key={m.label}
                className={`mood-btn ${mood === m.label ? 'active' : ''}`}
                onClick={() => {
                  setMood(prev => prev === m.label ? '' : m.label);
                  scheduleAutoSave();
                }}
              >
                {m.emoji} {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Writing Area */}
        <div className="writing-area">
          <input
            type="text"
            className="entry-title-input"
            placeholder="Give this entry a title..."
            value={title}
            onChange={e => { setTitle(e.target.value); scheduleAutoSave(); }}
          />
          <textarea
            className="entry-textarea"
            placeholder="Start writing your thoughts..."
            value={content}
            onChange={e => { setContent(e.target.value); scheduleAutoSave(); }}
            rows={8}
          />
        </div>

        {/* Footer */}
        <div className="editor-footer">
          <span className="word-count">
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Auto-saved ·' : ''} {wordCount} words
          </span>
          <div className="editor-actions">
            {editingId && (
              <button className="btn-new-entry" onClick={newEntry}>+ New entry</button>
            )}
            <button className="btn-save" onClick={saveEntry} disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Update entry' : 'Save entry'}
            </button>
          </div>
        </div>
      </div>

      {/* Past Entries */}
      <div className="past-entries-section">
        <div className="past-entries-header">
          <h3 className="section-label">PAST ENTRIES</h3>
          <span className="entries-count">{entries.length} total</span>
        </div>

        {loading ? (
          <div className="entries-grid">
            {[...Array(3)].map((_, i) => <div key={i} className="entry-card skeleton" />)}
          </div>
        ) : entries.length === 0 ? (
          <div className="entries-empty">No entries yet. Write your first one above! ✍️</div>
        ) : (
          <div className="entries-grid">
            {entries.map(entry => (
              <div
                key={entry.id}
                className={`entry-card ${editingId === entry.id ? 'active' : ''}`}
                onClick={() => openEntry(entry)}
              >
                <div className="entry-card-top">
                  <span className="entry-date">{formatCardDate(entry.createdAt)}</span>
                  <div className="entry-card-right">
                    {entry.mood && <span className="entry-mood">{MOODS.find(m => m.label === entry.mood)?.emoji}</span>}
                    <button
                      className="entry-delete-btn"
                      onClick={e => { e.stopPropagation(); deleteEntry(entry.id); }}
                    >×</button>
                  </div>
                </div>
                <h4 className="entry-title">{entry.title}</h4>
                <p className="entry-preview">{entry.content?.slice(0, 100)}{entry.content?.length > 100 ? '...' : ''}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}