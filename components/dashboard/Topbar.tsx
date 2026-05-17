'use client';

import { signOut } from 'next-auth/react';
import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Notif = {
  id: string;
  type: 'habit' | 'goal';
  message: string;
  time: string;
};

export default function Topbar({ userName }: { userName: string }) {
  const initial = userName ? userName.charAt(0).toUpperCase() : 'U';
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [dismissed, setDismissed] = useState(false);

  // Search state
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    habits: { id: string; name: string; completed: boolean; streak: number }[];
    goals: { id: string; title: string; progress: number; isCompleted: boolean }[];
    journals: { id: string; title: string; content: string; createdAt: string }[];
  } | null>(null);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const checkReminders = useCallback(async () => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();

    // Cek hanya jam 14:00 ke atas
    if (hour < 14) return;

    // Jangan cek lagi kalau sudah di-dismiss hari ini
    const dismissKey = `notif-dismissed-${now.toDateString()}`;
    if (localStorage.getItem(dismissKey)) return;

    try {
      const [habitsRes, goalsRes] = await Promise.all([
        fetch('/api/habits'),
        fetch('/api/goals'),
      ]);

      const habits = habitsRes.ok ? await habitsRes.json() : [];
      const goals = goalsRes.ok ? await goalsRes.json() : [];

      const newNotifs: Notif[] = [];
      const timeStr = `${hour}:${minute.toString().padStart(2, '0')}`;

      const undonHabits = habits.filter((h: any) => !h.completed);
      const undoneGoals = goals.filter((g: any) => !g.isCompleted && g.progress < 100);

      if (undonHabits.length > 0) {
        newNotifs.push({
          id: 'habit-reminder',
          type: 'habit',
          message: `${undonHabits.length} habit belum diselesaikan hari ini`,
          time: timeStr,
        });
      }

      if (undoneGoals.length > 0) {
        newNotifs.push({
          id: 'goal-reminder',
          type: 'goal',
          message: `${undoneGoals.length} goal masih dalam progress`,
          time: timeStr,
        });
      }

      if (newNotifs.length > 0) {
        setNotifs(newNotifs);

        // Browser notification (sekali saja)
        const browserKey = `browser-notif-${now.toDateString()}`;
        if (!localStorage.getItem(browserKey) && 'Notification' in window) {
          if (Notification.permission === 'granted') {
            new Notification('StudySpace Reminder 🔔', {
              body: `Sudah jam ${timeStr}! ${newNotifs.map(n => n.message).join(' · ')}`,
              icon: '/favicon.ico',
            });
            localStorage.setItem(browserKey, '1');
          } else if (Notification.permission === 'default') {
            Notification.requestPermission().then(perm => {
              if (perm === 'granted') {
                new Notification('StudySpace Reminder 🔔', {
                  body: `Sudah jam ${timeStr}! ${newNotifs.map(n => n.message).join(' · ')}`,
                  icon: '/favicon.ico',
                });
                localStorage.setItem(browserKey, '1');
              }
            });
          }
        }
      } else {
        setNotifs([]);
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    checkReminders();
    // Cek setiap 5 menit
    const interval = setInterval(checkReminders, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkReminders]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setShowSearch(true);

    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    if (!val.trim()) { setSearchResults(null); return; }

    searchDebounce.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(val.trim())}`);
        const data = await res.json();
        setSearchResults({
          habits: data.habits ?? [],
          goals: data.goals ?? [],
          journals: data.journals ?? [],
        });
      } catch { /* silent */ }
      setSearching(false);
    }, 300);
  };

  const clearSearch = () => {
    setQuery('');
    setSearchResults(null);
    setShowSearch(false);
  };

  const totalResults = searchResults
    ? (searchResults.habits?.length ?? 0) + (searchResults.goals?.length ?? 0) + (searchResults.journals?.length ?? 0)
    : 0;

  const dismissAll = () => {
    const now = new Date();
    localStorage.setItem(`notif-dismissed-${now.toDateString()}`, '1');
    setNotifs([]);
    setShowNotifs(false);
    setDismissed(true);
  };

  const hasNotifs = notifs.length > 0 && !dismissed;

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="toggle-sidebar-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
        {/* Search */}
        <div className="search-bar-wrap" ref={searchRef}>
          <div className="search-bar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input
              type="text"
              placeholder="Search habits, goals, journal..."
              value={query}
              onChange={handleSearchChange}
              onFocus={() => query && setShowSearch(true)}
              onKeyDown={e => { if (e.key === 'Escape') clearSearch(); }}
              autoComplete="off"
            />
            {query && (
              <button className="search-clear-btn" onClick={clearSearch}>×</button>
            )}
          </div>

          {/* Search Dropdown */}
          {showSearch && query.trim() && (
            <div className="search-dropdown">
              {searching ? (
                <div className="search-status">Searching...</div>
              ) : totalResults === 0 ? (
                <div className="search-status">No results for "{query}"</div>
              ) : (
                <>
                  {searchResults!.habits.length > 0 && (
                    <div className="search-section">
                      <div className="search-section-label">🔥 Habits</div>
                      {searchResults!.habits.map(h => (
                        <Link key={h.id} href="/app/habits" className="search-item" onClick={clearSearch}>
                          <span className={`search-item-icon ${h.completed ? 'done' : ''}`}>
                            {h.completed ? '✓' : '○'}
                          </span>
                          <span className="search-item-text">{h.name}</span>
                          <span className="search-item-meta">{h.streak} day streak</span>
                        </Link>
                      ))}
                    </div>
                  )}
                  {searchResults!.goals.length > 0 && (
                    <div className="search-section">
                      <div className="search-section-label">🎯 Goals</div>
                      {searchResults!.goals.map(g => (
                        <Link key={g.id} href="/app/goals" className="search-item" onClick={clearSearch}>
                          <span className={`search-item-icon ${g.isCompleted ? 'done' : ''}`}>
                            {g.isCompleted ? '✓' : '○'}
                          </span>
                          <span className="search-item-text">{g.title}</span>
                          <span className="search-item-meta">{g.progress}%</span>
                        </Link>
                      ))}
                    </div>
                  )}
                  {searchResults!.journals.length > 0 && (
                    <div className="search-section">
                      <div className="search-section-label">📓 Journal</div>
                      {searchResults!.journals.map(j => (
                        <Link key={j.id} href="/app/journal" className="search-item" onClick={clearSearch}>
                          <span className="search-item-icon">✍️</span>
                          <span className="search-item-text">{j.title || 'Untitled'}</span>
                          <span className="search-item-meta">
                            {new Date(j.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="topbar-right">
        <button className="btn-new-focus">
          <span>+</span> New focus
        </button>

        {/* Notification Bell */}
        <div style={{ position: 'relative' }}>
          <button
            className="notification-btn"
            onClick={() => setShowNotifs(prev => !prev)}
            title="Notifikasi"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            {hasNotifs && <span className="notification-dot notif-pulse" />}
          </button>

          {/* Dropdown */}
          {showNotifs && (
            <div className="notif-dropdown" onClick={e => e.stopPropagation()}>
              <div className="notif-dropdown-header">
                <span>Reminders</span>
                {hasNotifs && (
                  <button className="notif-dismiss-all" onClick={dismissAll}>Dismiss all</button>
                )}
              </div>

              {hasNotifs ? (
                <>
                  {notifs.map(n => (
                    <div key={n.id} className="notif-item">
                      <div className="notif-icon">
                        {n.type === 'habit' ? '🔥' : '🎯'}
                      </div>
                      <div className="notif-content">
                        <p className="notif-msg">{n.message}</p>
                        <p className="notif-time">Sudah jam {n.time}</p>
                      </div>
                      <Link
                        href={n.type === 'habit' ? '/app/habits' : '/app/goals'}
                        className="notif-action-btn"
                        onClick={() => setShowNotifs(false)}
                      >
                        Lihat →
                      </Link>
                    </div>
                  ))}
                  <button className="notif-dismiss-btn" onClick={dismissAll}>
                    ✓ Tandai selesai untuk hari ini
                  </button>
                </>
              ) : (
                <div className="notif-empty">
                  <span>🎉</span>
                  <p>Semua clear! Tidak ada reminder.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Avatar dengan dropdown logout */}
        <div className="avatar-wrapper" style={{ position: 'relative' }}>
          <div
            className="user-avatar"
            style={{ cursor: 'pointer' }}
            onClick={() => setShowMenu(prev => !prev)}
            title={userName}
          >
            {initial}
          </div>

          {showMenu && (
            <div className="avatar-dropdown">
              <div className="avatar-dropdown-name">{userName}</div>
              <button
                className="avatar-logout-btn"
                onClick={() => signOut({ callbackUrl: '/' })}
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Close dropdowns on outside click */}
      {(showNotifs || showMenu) && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 98 }}
          onClick={() => { setShowNotifs(false); setShowMenu(false); }}
        />
      )}
    </header>
  );
}
