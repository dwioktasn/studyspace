import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

async function getSession() {
  cookies();
  return getServerSession(authOptions);
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;
    const today = new Date();
    const todayStr = today.toDateString();
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);

    // Focus today
    const allSessions = await prisma.focusSession.findMany({ where: { userId } });
    const todaySessions = allSessions.filter(s => new Date(s.createdAt).toDateString() === todayStr);
    const focusTodayMinutes = todaySessions.reduce((s, f) => s + f.duration, 0);

    // Yesterday focus
    const yesterdaySessions = allSessions.filter(s => new Date(s.createdAt).toDateString() === yesterday.toDateString());
    const focusYesterdayMinutes = yesterdaySessions.reduce((s, f) => s + f.duration, 0);

    // Weekly avg (last 7 days)
    const week = new Date(today); week.setDate(today.getDate() - 6);
    const weekSessions = allSessions.filter(s => new Date(s.createdAt) >= week);
    const weeklyAvgMinutes = Math.round(weekSessions.reduce((s, f) => s + f.duration, 0) / 7);

    // Habits
    const habits = await prisma.habit.findMany({ where: { userId }, take: 4, orderBy: { createdAt: 'desc' } });
    const completedHabits = habits.filter(h => h.completed).length;
    const bestStreak = habits.reduce((max, h) => Math.max(max, h.streak), 0);

    // Goals
    const goals = await prisma.goal.findMany({ where: { userId }, take: 4, orderBy: { createdAt: 'desc' } });
    const completedGoals = goals.filter(g => g.isCompleted).length;

    // Latest quote
    const quote = await prisma.quote.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // Latest journal entry
    const latestJournal = await prisma.journal.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, content: true, mood: true, createdAt: true },
    });

    // This week stats
    const weekStart7 = new Date(today); weekStart7.setDate(today.getDate() - 6); weekStart7.setHours(0,0,0,0);
    const weekFocusMins = allSessions.filter(s => new Date(s.createdAt) >= weekStart7).reduce((s, f) => s + f.duration, 0);
    const weekPomodoros = allSessions.filter(s => new Date(s.createdAt) >= weekStart7).length;
    const habitsHit = habits.filter(h => h.completed).length;
    const journalDaysThisWeek = await prisma.journal.findMany({
      where: { userId, createdAt: { gte: weekStart7 } },
      select: { createdAt: true },
    });
    const journalDays = new Set(journalDaysThisWeek.map(j => new Date(j.createdAt).toDateString())).size;

    // Weekly chart data — last 7 days
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const weeklyData = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today); d.setDate(today.getDate() - (6 - i));
      const mins = allSessions
        .filter(s => new Date(s.createdAt).toDateString() === d.toDateString())
        .reduce((sum, s) => sum + s.duration, 0);
      return { label: days[d.getDay()], minutes: mins };
    });

    // Monthly chart data — last 4 weeks (per week)
    const monthlyData = Array.from({ length: 4 }, (_, i) => {
      const weekEnd = new Date(today); weekEnd.setDate(today.getDate() - i * 7);
      const weekStart = new Date(weekEnd); weekStart.setDate(weekEnd.getDate() - 6);
      const mins = allSessions
        .filter(s => { const d = new Date(s.createdAt); return d >= weekStart && d <= weekEnd; })
        .reduce((sum, s) => sum + s.duration, 0);
      return { label: `W${4 - i}`, minutes: mins };
    }).reverse();

    return NextResponse.json({
      userName: session.user.name || session.user.id,
      focusTodayMinutes,
      focusYesterdayMinutes,
      weeklyAvgMinutes,
      todaySessionCount: todaySessions.length,
      bestStreak,
      habits: habits.map(h => ({ id: h.id, name: h.name, streak: h.streak, completed: h.completed })),
      completedHabits,
      goals: goals.map(g => ({ id: g.id, title: g.title, progress: g.progress, isCompleted: g.isCompleted })),
      completedGoals,
      totalGoals: goals.length,
      quote: quote ? { text: quote.text, author: quote.author, id: quote.id } : null,
      weeklyData,
      monthlyData,
      latestJournal: latestJournal ? {
        id: latestJournal.id,
        title: latestJournal.title,
        content: latestJournal.content?.slice(0, 120) || '',
        mood: latestJournal.mood,
        createdAt: latestJournal.createdAt,
      } : null,
      thisWeek: {
        focusMinutes: weekFocusMins,
        pomodoros: weekPomodoros,
        habitsHit,
        journalDays,
      },
    });
  } catch (err) {
    console.error("[dashboard GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
