// components/dashboard/StressMeter.tsx

"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Info,
  Activity,
  Flame,
  Zap,
  Heart,
  BarChart3,
  Brain,
  Clock,
  Sun,
  Moon,
  Sunrise,
  Sunset,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const MOOD_CONFIG = [
  { emoji: "😄", label: "Great", weight: 0, color: "#10b981", gradient: "from-emerald-400 to-emerald-600" },
  { emoji: "🙂", label: "Good", weight: 1, color: "#34d399", gradient: "from-emerald-300 to-emerald-500" },
  { emoji: "😐", label: "Okay", weight: 2, color: "#fbbf24", gradient: "from-amber-300 to-amber-500" },
  { emoji: "😕", label: "Not great", weight: 3, color: "#f97316", gradient: "from-orange-400 to-orange-600" },
  { emoji: "😢", label: "Sad", weight: 4, color: "#ef4444", gradient: "from-red-400 to-red-600" },
  { emoji: "😭", label: "Terrible", weight: 5, color: "#dc2626", gradient: "from-red-500 to-red-700" },
];

const MAX_WEIGHT = 5;

const WEIGHT_MAP: Record<string, number> = Object.fromEntries(
  MOOD_CONFIG.map((m) => [m.emoji, m.weight])
);
const COLOR_MAP: Record<string, string> = Object.fromEntries(
  MOOD_CONFIG.map((m) => [m.emoji, m.color])
);
const LABEL_MAP: Record<string, string> = Object.fromEntries(
  MOOD_CONFIG.map((m) => [m.emoji, m.label])
);

const TIME_PERIODS = [
  { key: "morning", label: "Morning", range: "6 AM – 12 PM", icon: Sunrise, color: "#f59e0b", bg: "from-amber-400/10 to-orange-400/10" },
  { key: "afternoon", label: "Afternoon", range: "12 PM – 6 PM", icon: Sun, color: "#ef4444", bg: "from-red-400/10 to-orange-400/10" },
  { key: "evening", label: "Evening", range: "6 PM – 10 PM", icon: Sunset, color: "#8b5cf6", bg: "from-violet-400/10 to-purple-400/10" },
  { key: "night", label: "Night", range: "10 PM – 6 AM", icon: Moon, color: "#3b82f6", bg: "from-blue-400/10 to-indigo-400/10" },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface HistoryEntry {
  emoji: string;
  source: "manual" | "ai";
  timestamp: string;
}

interface DayData {
  date: string;
  label: string;
  dominantEmoji: string;
  stressWeight: number;
  stressIndex: number;
  emojiCounts: Record<string, number>;
  totalEvents: number;
  wellbeingScore: number;
}

interface StressMeterProps {
  uid: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function toDayLabel(dateKey: string): string {
  const d = new Date(dateKey + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", day: "numeric" });
}

function getLast30Days(): string[] {
  const days: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(toDateKey(d));
  }
  return days;
}

function getLast12Weeks(): string[] {
  const days: string[] = [];
  for (let i = 83; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(toDateKey(d));
  }
  return days;
}

function findDominantEmoji(counts: Record<string, number>): string {
  let best = "😐";
  let bestScore = -1;
  for (const [emoji, count] of Object.entries(counts)) {
    if (count === 0) continue;
    const weight = WEIGHT_MAP[emoji] ?? 2;
    const score = count * weight + weight * 0.01;
    if (score > bestScore) {
      bestScore = score;
      best = emoji;
    }
  }
  return best;
}

function calcStressIndex(counts: Record<string, number>): number {
  let weightedSum = 0;
  let total = 0;
  for (const [emoji, count] of Object.entries(counts)) {
    const w = WEIGHT_MAP[emoji] ?? 2;
    weightedSum += w * count;
    total += count;
  }
  if (total === 0) return 0;
  return Math.round((weightedSum / total / MAX_WEIGHT) * 100);
}

function calcWellbeingScore(counts: Record<string, number>): number {
  let score = 0;
  for (const [emoji, count] of Object.entries(counts)) {
    const w = WEIGHT_MAP[emoji] ?? 2;
    score += (MAX_WEIGHT - w) * count;
  }
  return score;
}

function stressLevelLabel(index: number): string {
  if (index <= 20) return "Feeling Great";
  if (index <= 40) return "Doing Well";
  if (index <= 60) return "Moderate Stress";
  if (index <= 80) return "High Stress";
  return "Critical Stress";
}

function getStressColor(index: number): string {
  if (index <= 20) return "#10b981";
  if (index <= 40) return "#34d399";
  if (index <= 60) return "#fbbf24";
  if (index <= 80) return "#f97316";
  return "#ef4444";
}

function getHeatmapColor(stressIndex: number, hasData: boolean): string {
  if (!hasData) return "bg-zinc-100 dark:bg-zinc-800/50";
  if (stressIndex <= 20) return "bg-emerald-500";
  if (stressIndex <= 40) return "bg-emerald-300";
  if (stressIndex <= 60) return "bg-amber-400";
  if (stressIndex <= 80) return "bg-orange-500";
  return "bg-red-500";
}

function getTimePeriod(timestamp: string): string {
  const hour = new Date(timestamp).getHours();
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  if (hour >= 18 && hour < 22) return "evening";
  return "night";
}

// ─── Animated Number ──────────────────────────────────────────────────────────

function AnimatedNumber({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef<number>(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const start = startRef.current;
    const diff = value - start;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + diff * eased);
      setDisplay(current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        startRef.current = value;
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [value, duration]);

  return <>{display}</>;
}

// ─── Stress Ring ──────────────────────────────────────────────────────────────

function StressRing({ index, emoji, label }: { index: number; emoji: string; label: string }) {
  const [animated, setAnimated] = useState(false);
  const color = getStressColor(index);
  const radius = 90;
  const stroke = 10;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const progress = index / 100;
  const offset = circumference - progress * circumference;

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: radius * 2, height: radius * 2 }}>
        <div className="absolute inset-0 rounded-full blur-xl opacity-30 transition-all duration-1000" style={{ backgroundColor: color }} />
        <svg width={radius * 2} height={radius * 2} className="rotate-[-90deg] drop-shadow-lg">
          <circle cx={radius} cy={radius} r={normalizedRadius} fill="none" strokeWidth={stroke} className="stroke-zinc-200/50 dark:stroke-zinc-800/50" />
          <circle
            cx={radius} cy={radius} r={normalizedRadius} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={animated ? offset : circumference}
            className="transition-all duration-[1.5s] ease-out"
            style={{ filter: `drop-shadow(0 0 8px ${color}40)` }}
          />
          {[0, 25, 50, 75, 100].map((tick) => {
            const angle = (tick / 100) * 360 - 90;
            const rad = (angle * Math.PI) / 180;
            const outerR = normalizedRadius + stroke / 2 + 4;
            const innerR = normalizedRadius + stroke / 2 + 1;
            return (
              <line key={tick}
                x1={radius + Math.cos(rad) * innerR} y1={radius + Math.sin(rad) * innerR}
                x2={radius + Math.cos(rad) * outerR} y2={radius + Math.sin(rad) * outerR}
                strokeWidth={1.5} strokeLinecap="round" className="stroke-zinc-300 dark:stroke-zinc-700"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl mb-1 animate-[bounceIn_0.6s_ease_0.5s_both]">{emoji}</span>
          <div className="flex items-baseline gap-0.5">
            <span className="text-3xl font-black tabular-nums" style={{ color }}>
              <AnimatedNumber value={index} duration={1500} />
            </span>
            <span className="text-sm font-medium text-zinc-400">/100</span>
          </div>
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{label}</p>
        <div className="flex items-center justify-center gap-4 mt-2">
          {[
            { label: "Calm", color: "#10b981", pos: "0" },
            { label: "Moderate", color: "#fbbf24", pos: "50" },
            { label: "Critical", color: "#ef4444", pos: "100" },
          ].map((item) => (
            <span key={item.label} className="flex items-center gap-1 text-[10px] font-medium" style={{ color: item.color }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
              {item.pos} {item.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

function SparklineTrend({ data, color, height = 48, width = 140 }: { data: number[]; color: string; height?: number; width?: number }) {
  const [animate, setAnimate] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimate(true), 200); return () => clearTimeout(t); }, []);

  if (data.length < 2) return null;
  const max = Math.max(...data, 100);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const padding = 4;

  const points = data.map((val, i) => ({
    x: padding + (i / (data.length - 1)) * (width - padding * 2),
    y: padding + (1 - (val - min) / range) * (height - padding * 2),
  }));

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;
  const lastPoint = points[points.length - 1];

  return (
    <div className="relative" style={{ width, height }}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id={`sg-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill={`url(#sg-${color.replace("#", "")})`} className={`transition-opacity duration-700 ${animate ? "opacity-100" : "opacity-0"}`} />
        <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-all duration-1000 ${animate ? "opacity-100" : "opacity-0"}`} />
        <circle cx={lastPoint.x} cy={lastPoint.y} r="4" fill={color} className={`transition-all duration-500 delay-500 ${animate ? "opacity-100" : "opacity-0"}`} />
        <circle cx={lastPoint.x} cy={lastPoint.y} r="8" fill={color} opacity="0.2" className={`transition-all duration-500 delay-500 ${animate ? "opacity-100 animate-ping" : "opacity-0"}`} />
      </svg>
    </div>
  );
}

// ─── Modern Day Bar ───────────────────────────────────────────────────────────

function ModernDayBar({ day, maxWellbeing, isSelected, isToday, onClick, index }: {
  day: DayData; maxWellbeing: number; isSelected: boolean; isToday: boolean; onClick: () => void; index: number;
}) {
  const [animate, setAnimate] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimate(true), 50 + index * 30); return () => clearTimeout(t); }, [index]);

  const barHeightPct = maxWellbeing > 0 ? (day.wellbeingScore / maxWellbeing) * 100 : 0;
  const hasData = day.totalEvents > 0;
  const barColor = hasData ? COLOR_MAP[day.dominantEmoji] : "transparent";

  return (
    <button onClick={onClick} title={`${day.label} — ${day.dominantEmoji} ${LABEL_MAP[day.dominantEmoji] ?? "No data"}\nStress: ${day.stressIndex}/100`}
      className={`flex flex-col items-center gap-1 flex-1 group transition-all duration-300 ${isSelected ? "scale-110 z-10" : "hover:scale-105"}`}
    >
      <div className="w-full flex flex-col justify-end h-28 md:h-36 relative">
        {isSelected && hasData && (
          <div className="absolute inset-x-0 bottom-0 rounded-lg blur-md opacity-40 transition-all duration-500"
            style={{ height: `${Math.max(barHeightPct, 8)}%`, backgroundColor: barColor }}
          />
        )}
        <div className={`w-full rounded-lg relative overflow-hidden transition-all duration-700 ease-out ${isSelected ? "ring-2 ring-offset-1 ring-offset-white dark:ring-offset-zinc-900" : ""}`}
          style={{
            height: animate ? (hasData ? `${Math.max(barHeightPct, 8)}%` : "4%") : "0%",
            backgroundColor: hasData ? barColor : "transparent",
            
          }}
        >
          {hasData && <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: "linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%)" }} />}
          {hasData && <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-white/10 rounded-lg" />}
          {!hasData && <div className="absolute inset-x-0 bottom-0 h-[2px] bg-zinc-200 dark:bg-zinc-800 rounded-full" />}
        </div>
      </div>
      <span className={`text-xs md:text-sm leading-none transition-all duration-300 ${isSelected ? "scale-125" : "group-hover:scale-110"}`}>
        {hasData ? day.dominantEmoji : "·"}
      </span>
      <span className={`text-[9px] md:text-[10px] leading-none font-medium transition-colors duration-300 ${isToday ? "text-[#B21563] font-bold" : isSelected ? "text-zinc-700 dark:text-zinc-300 font-bold" : "text-zinc-400"}`}>
        {day.label.split(" ")[1]}
      </span>
      {isToday && <span className="w-1 h-1 rounded-full bg-[#B21563] mt-[-2px]" />}
    </button>
  );
}

// ─── Glass Card ───────────────────────────────────────────────────────────────

function GlassCard({ children, className = "", glow }: { children: React.ReactNode; className?: string; glow?: string }) {
  return (
    <div className={`relative group ${className}`}>
      {glow && <div className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-700" style={{ background: glow }} />}
      <div className="relative bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-sm hover:shadow-md transition-shadow duration-300">
        {children}
      </div>
    </div>
  );
}

// ─── Emoji Breakdown ──────────────────────────────────────────────────────────

function EmojiBreakdown({ day }: { day: DayData }) {
  const total = day.totalEvents;
  const [animate, setAnimate] = useState(false);
  useEffect(() => { setAnimate(false); const t = setTimeout(() => setAnimate(true), 200); return () => clearTimeout(t); }, [day.date]);

  return (
    <div className="space-y-3">
      {MOOD_CONFIG.map(({ emoji, label, color }, i) => {
        const count = day.emojiCounts[emoji] ?? 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={emoji} className="flex items-center gap-3 group/row">
            <span className="text-lg w-7 text-center group-hover/row:scale-125 transition-transform duration-200">{emoji}</span>
            <span className="text-xs text-zinc-500 w-16 shrink-0 font-medium">{label}</span>
            <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full h-2.5 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                style={{ width: animate ? `${pct}%` : "0%", backgroundColor: color, transitionDelay: `${i * 80}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </div>
            </div>
            <span className="text-xs text-zinc-500 w-10 text-right tabular-nums font-medium">{count > 0 ? `${pct}%` : "—"}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Mood Heatmap ─────────────────────────────────────────────────────────────

function MoodHeatmap({
  allHistory,
  selectedDateKey,
  onSelectDate,
}: {
  allHistory: HistoryEntry[];
  selectedDateKey: string;
  onSelectDate: (dateKey: string) => void;
}) {
  const [animate, setAnimate] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimate(true), 300); return () => clearTimeout(t); }, []);

  const last12Weeks = getLast12Weeks();
  const todayKey = toDateKey(new Date());

  const grouped: Record<string, HistoryEntry[]> = {};
  for (const entry of allHistory) {
    const dk = toDateKey(new Date(entry.timestamp));
    grouped[dk] = grouped[dk] ?? [];
    grouped[dk].push(entry);
  }

  const dayDataMap: Record<string, { stressIndex: number; totalEvents: number; dominantEmoji: string }> = {};
  for (const dk of last12Weeks) {
    const entries = grouped[dk] ?? [];
    if (entries.length === 0) {
      dayDataMap[dk] = { stressIndex: 0, totalEvents: 0, dominantEmoji: "😐" };
      continue;
    }
    const emojiCounts: Record<string, number> = {};
    for (const e of entries) emojiCounts[e.emoji] = (emojiCounts[e.emoji] ?? 0) + 1;
    dayDataMap[dk] = {
      stressIndex: calcStressIndex(emojiCounts),
      totalEvents: entries.length,
      dominantEmoji: findDominantEmoji(emojiCounts),
    };
  }

  const weeks: string[][] = [];
  let currentWeek: string[] = [];

  for (let i = 0; i < last12Weeks.length; i++) {
    const d = new Date(last12Weeks[i] + "T12:00:00");
    const dayOfWeek = d.getDay();

    if (dayOfWeek === 1 && currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push("");
      weeks.push(currentWeek);
      currentWeek = [];
    }

    if (weeks.length === 0 && currentWeek.length === 0) {
      const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      for (let j = 0; j < mondayOffset; j++) currentWeek.push("");
    }

    currentWeek.push(last12Weeks[i]);
  }

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push("");
    weeks.push(currentWeek);
  }

  const monthLabels: { month: string; weekIndex: number }[] = [];
  let lastMonth = "";
  weeks.forEach((week, wi) => {
    for (const dk of week) {
      if (!dk) continue;
      const d = new Date(dk + "T12:00:00");
      const month = d.toLocaleDateString("en-US", { month: "short" });
      if (month !== lastMonth) {
        monthLabels.push({ month, weekIndex: wi });
        lastMonth = month;
      }
      break;
    }
  });

  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

 const daysWithData = Object.values(dayDataMap).filter((d) => d.totalEvents > 0);

const dayOfWeekStress: number[] = [0, 0, 0, 0, 0, 0, 0];
const dayOfWeekCounts: number[] = [0, 0, 0, 0, 0, 0, 0];
for (const dk of last12Weeks) {
  const data = dayDataMap[dk];
  if (!data || data.totalEvents === 0) continue;
  const d = new Date(dk + "T12:00:00");
  const dow = d.getDay() === 0 ? 6 : d.getDay() - 1;
  dayOfWeekStress[dow] += data.stressIndex;
  dayOfWeekCounts[dow]++;
}
const dayOfWeekAvg = dayOfWeekStress.map((s, i) => dayOfWeekCounts[i] > 0 ? Math.round(s / dayOfWeekCounts[i]) : 0);
const nonZeroAvg = dayOfWeekAvg.filter((v) => v > 0);
const mostStressedDay = dayOfWeekAvg.indexOf(Math.max(...dayOfWeekAvg));
const leastStressedDay = nonZeroAvg.length > 0
  ? dayOfWeekAvg.indexOf(Math.min(...nonZeroAvg))
  : 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-4 h-4 text-[#B21563]" />
        <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">12-Week Heatmap</h3>
      </div>

      {/* Month labels */}
      <div className="flex mb-1 pl-10">
        {monthLabels.map((ml, i) => (
          <div
            key={i}
            className="text-[9px] text-zinc-400 font-medium"
            style={{
              position: "relative",
              left: `${(ml.weekIndex / weeks.length) * 100}%`,
              marginRight: "auto",
            }}
          >
            {ml.month}
          </div>
        ))}
      </div>

      {/* Heatmap grid */}
      <div className="flex gap-[2px] flex-1">
        {/* Day labels — ALL 7 DAYS */}
<div className="flex flex-col gap-[2.4rem] pr-2 justify-center">
  {dayLabels.map((label) => (
    <div key={label} className="h-[14px] flex items-center">
      <span className="text-[10px] text-zinc-400 font-medium w-8 text-right leading-[14px]">
        {label}
      </span>
    </div>
  ))}
</div>

        {/* Grid */}
        <div className="flex gap-[2px] flex-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[2px] flex-1">
              {week.map((dk, di) => {
                if (!dk) return <div key={di} className="aspect-square rounded-[3px]" />;
                const data = dayDataMap[dk];
                const hasData = data && data.totalEvents > 0;
                const isSelected = dk === selectedDateKey;
                const isToday = dk === todayKey;
                const isFuture = dk > todayKey;

                return (
                  <button
                    key={di}
                    onClick={() => !isFuture && onSelectDate(dk)}
                    disabled={isFuture}
                    title={hasData
                      ? `${toDayLabel(dk)}: ${data.dominantEmoji} Stress: ${data.stressIndex}/100 (${data.totalEvents} events)`
                      : `${toDayLabel(dk)}: No data`
                    }
                    className={`
                      aspect-square rounded-[3px] transition-all duration-300
                      ${animate ? "opacity-100 scale-100" : "opacity-0 scale-50"}
                      ${isFuture ? "opacity-20 cursor-default" : "cursor-pointer hover:scale-150 hover:z-10"}
                      ${isSelected ? "ring-2 ring-[#B21563] ring-offset-1 ring-offset-white dark:ring-offset-zinc-900 scale-125 z-10" : ""}
                      ${isToday && !isSelected ? "ring-1 ring-zinc-400" : ""}
                      ${getHeatmapColor(data?.stressIndex ?? 0, !!hasData)}
                    `}
                    style={{
                      transitionDelay: `${(wi * 7 + di) * 5}ms`,
                      opacity: animate ? (hasData ? 1 : 0.4) : 0,
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Heatmap legend */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-zinc-400">Less stress</span>
          <div className="flex gap-[2px]">
            {["bg-emerald-500", "bg-emerald-300", "bg-amber-400", "bg-orange-500", "bg-red-500"].map((c, i) => (
              <div key={i} className={`w-3 h-3 rounded-[2px] ${c}`} />
            ))}
          </div>
          <span className="text-[9px] text-zinc-400">More stress</span>
        </div>
      </div>

      {/* Day pattern insight */}
      {daysWithData.length > 0 && (
        <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-zinc-400">
            <span>
              📈 Most stressed: <span className="font-bold text-zinc-600 dark:text-zinc-300">{dayLabels[mostStressedDay]}s</span>
            </span>
            <span>
              📉 Best day: <span className="font-bold text-zinc-600 dark:text-zinc-300">{dayLabels[leastStressedDay]}s</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Time of Day Analysis ─────────────────────────────────────────────────────

function TimeOfDayAnalysis({
  history,
  dateKey,
}: {
  history: HistoryEntry[];
  dateKey: string;
}) {
  const [animate, setAnimate] = useState(false);
  useEffect(() => { setAnimate(false); const t = setTimeout(() => setAnimate(true), 200); return () => clearTimeout(t); }, [dateKey]);

  const dayEntries = history.filter((e) => toDateKey(new Date(e.timestamp)) === dateKey);

  if (dayEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3">
        <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
          <Clock className="w-6 h-6 text-zinc-300 dark:text-zinc-600" />
        </div>
        <p className="text-sm text-zinc-400">No time data for this day</p>
        <p className="text-xs text-zinc-400/60">Mood events will show time patterns</p>
      </div>
    );
  }

  const periodData: Record<string, { entries: HistoryEntry[]; emojiCounts: Record<string, number> }> = {
    morning: { entries: [], emojiCounts: {} },
    afternoon: { entries: [], emojiCounts: {} },
    evening: { entries: [], emojiCounts: {} },
    night: { entries: [], emojiCounts: {} },
  };

  for (const entry of dayEntries) {
    const period = getTimePeriod(entry.timestamp);
    periodData[period].entries.push(entry);
    periodData[period].emojiCounts[entry.emoji] = (periodData[period].emojiCounts[entry.emoji] ?? 0) + 1;
  }

  const maxEvents = Math.max(...Object.values(periodData).map((p) => p.entries.length), 1);

  let peakPeriod = "";
  let peakStress = -1;
  for (const [key, data] of Object.entries(periodData)) {
    if (data.entries.length === 0) continue;
    const stress = calcStressIndex(data.emojiCounts);
    if (stress > peakStress) {
      peakStress = stress;
      peakPeriod = key;
    }
  }

  return (
    <div>
      <div className="space-y-3">
        {TIME_PERIODS.map(({ key, label, range, icon: Icon, color, bg }, i) => {
          const data = periodData[key];
          const events = data.entries.length;
          const stress = events > 0 ? calcStressIndex(data.emojiCounts) : 0;
          const dominant = events > 0 ? findDominantEmoji(data.emojiCounts) : null;
          const barWidth = maxEvents > 0 ? (events / maxEvents) * 100 : 0;

          return (
            <div
              key={key}
              className={`relative rounded-xl p-3 border transition-all duration-500 overflow-hidden
                border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700
              `}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-500"
                  style={{
                    backgroundColor: events > 0 ? `${color}15` : "transparent",
                    border: `1px solid ${events > 0 ? `${color}30` : "transparent"}`,
                  }}
                >
                  <Icon className="w-5 h-5" style={{ color: events > 0 ? color : "#a1a1aa" }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{label}</span>
                      <span className="text-[10px] text-zinc-400 ml-1.5">{range}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {dominant && <span className="text-lg">{dominant}</span>}
                      {events > 0 && (
                        <span className="text-xs font-bold tabular-nums" style={{ color: getStressColor(stress) }}>
                          {stress}%
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                      style={{
                        width: animate ? `${Math.max(barWidth, events > 0 ? 8 : 0)}%` : "0%",
                        backgroundColor: events > 0 ? color : "transparent",
                        transitionDelay: `${i * 120}ms`,
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-zinc-400">
                      {events > 0 ? `${events} event${events !== 1 ? "s" : ""}` : "No events"}
                    </span>
                    {events > 0 && (
                      <span className="text-[10px] text-zinc-400">
                        {stressLevelLabel(stress)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {peakPeriod && dayEntries.length > 0 && (
        <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <p className="text-[11px] text-zinc-500">
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">Peak stress</span> was during
            <span className="font-semibold text-zinc-700 dark:text-zinc-300"> {TIME_PERIODS.find((t) => t.key === peakPeriod)?.label?.toLowerCase()}</span> with a score of
            <span className="font-bold" style={{ color: getStressColor(peakStress) }}> {peakStress}%</span>
          </p>
        </div>
      )}
    </div>
  );
}

// ─── AI Weekly Insight ────────────────────────────────────────────────────────

function AIWeeklyInsight({
  summaryMap,
  dominantEmotion,
  avgStress,
  riskTrend,
  days,
}: {
  summaryMap: Record<string, string>;
  dominantEmotion: string;
  avgStress: number;
  riskTrend: string;
  days: DayData[];
}) {
  const [expanded, setExpanded] = useState(false);

  const last7Days = days.slice(-7);
  const recentSummaries = last7Days
    .filter((d) => summaryMap[d.date])
    .map((d) => ({ date: d.date, label: d.label, summary: summaryMap[d.date] }))
    .reverse();

  const weekDays = last7Days.filter((d) => d.totalEvents > 0);
  const totalEvents = weekDays.reduce((a, d) => a + d.totalEvents, 0);
  const avgWeekStress = weekDays.length > 0
    ? Math.round(weekDays.reduce((a, d) => a + d.stressIndex, 0) / weekDays.length)
    : 0;

  const bestDay = weekDays.length > 0
    ? weekDays.reduce((a, b) => (a.stressIndex < b.stressIndex ? a : b))
    : null;
  const worstDay = weekDays.length > 0
    ? weekDays.reduce((a, b) => (a.stressIndex > b.stressIndex ? a : b))
    : null;

  const weekEmojis: Record<string, number> = {};
  for (const d of weekDays) {
    for (const [emoji, count] of Object.entries(d.emojiCounts)) {
      weekEmojis[emoji] = (weekEmojis[emoji] ?? 0) + count;
    }
  }
  const topEmojis = Object.entries(weekEmojis)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  let insightText = "";
  if (weekDays.length === 0) {
    insightText = "No mood data recorded this week. Start chatting with the AI to track your emotional wellness and get personalized insights.";
  } else {
    const parts: string[] = [];

    if (riskTrend === "increasing") {
      parts.push("⚠️ Your stress levels have been trending upward this week. Consider reaching out for support or taking breaks during high-stress periods.");
    } else if (riskTrend === "decreasing") {
      parts.push("✨ Great news — your stress levels are trending downward! Whatever you're doing is working. Keep it up.");
    } else {
      parts.push("Your stress levels have been relatively stable this week.");
    }

    if (bestDay && worstDay && bestDay.date !== worstDay.date) {
      parts.push(`Your best day was ${bestDay.label} (stress: ${bestDay.stressIndex}%) and most challenging was ${worstDay.label} (stress: ${worstDay.stressIndex}%).`);
    }

    if (dominantEmotion) {
      parts.push(`Your dominant emotion has been "${dominantEmotion}".`);
    }

    if (weekDays.length >= 5) {
      parts.push("You've been consistent with logging — this helps build a clearer picture of your emotional patterns.");
    } else if (weekDays.length >= 3) {
      parts.push("Try to log your mood more consistently for better pattern detection.");
    }

    insightText = parts.join(" ");
  }

  return (
    <GlassCard glow="#B2156310">
      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#B21563] to-[#E91E8C] flex items-center justify-center shadow-lg shadow-[#B21563]/20">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">AI Weekly Insight</h3>
              <p className="text-[10px] text-zinc-400">Based on {totalEvents} events this week</p>
            </div>
          </div>

          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
            avgWeekStress <= 40
              ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
              : avgWeekStress <= 70
              ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
              : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
          }`}>
            {riskTrend === "increasing" && <TrendingUp className="w-3 h-3" />}
            {riskTrend === "decreasing" && <TrendingDown className="w-3 h-3" />}
            {(!riskTrend || riskTrend === "stable") && <Minus className="w-3 h-3" />}
            {avgWeekStress <= 40 ? "Healthy" : avgWeekStress <= 70 ? "Moderate" : "Elevated"}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3 text-center">
            <p className="text-2xl font-black tabular-nums" style={{ color: getStressColor(avgWeekStress) }}>
              {avgWeekStress}
            </p>
            <p className="text-[9px] text-zinc-400 font-semibold uppercase mt-1">Avg Stress</p>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-zinc-700 dark:text-zinc-300">{weekDays.length}<span className="text-sm text-zinc-400">/7</span></p>
            <p className="text-[9px] text-zinc-400 font-semibold uppercase mt-1">Days Tracked</p>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1">
              {topEmojis.length > 0
                ? topEmojis.map(([emoji]) => <span key={emoji} className="text-lg">{emoji}</span>)
                : <span className="text-2xl text-zinc-300">—</span>
              }
            </div>
            <p className="text-[9px] text-zinc-400 font-semibold uppercase mt-1">Top Moods</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#B21563]/5 to-transparent dark:from-[#B21563]/10 rounded-xl p-4 mb-4 border border-[#B21563]/10">
          <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
            {insightText}
          </p>
        </div>

        {recentSummaries.length > 0 && (
          <div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center justify-between w-full py-2 text-xs font-semibold text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
            >
              <span>📋 Daily AI Summaries ({recentSummaries.length})</span>
              <span className={`transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}>▼</span>
            </button>

            {expanded && (
              <div className="space-y-3 mt-2 animate-[slideDown_0.3s_ease-out]">
                {recentSummaries.map((s) => (
                  <div key={s.date} className="pl-4 border-l-2 border-[#B21563]/20 hover:border-[#B21563]/60 transition-colors">
                    <p className="text-[10px] font-semibold text-zinc-400 mb-1">
                      {new Date(s.date + "T12:00:00").toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      {s.summary}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {riskTrend === "increasing" && avgWeekStress > 60 && (
          <div className="mt-4 flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30">
            <Activity className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-[11px] text-red-600 dark:text-red-400 font-medium">
              Your stress is trending up. Consider using the emergency features if you need immediate support.
            </p>
          </div>
        )}
      </div>
    </GlassCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const StressMeter = ({ uid }: StressMeterProps) => {
  const [days, setDays] = useState<DayData[]>([]);
  const [allHistory, setAllHistory] = useState<HistoryEntry[]>([]);
  const [selectedDateKey, setSelectedDateKey] = useState<string>(toDateKey(new Date()));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [summaryMap, setSummaryMap] = useState<Record<string, string>>({});
  const [dominantEmotion, setDominantEmotion] = useState("");
  const [userAvgStress, setUserAvgStress] = useState(0);
  const [riskTrend, setRiskTrend] = useState("");

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const fetchMoodData = useCallback(async (isRefresh = false) => {
    if (!uid) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const moodRes = await fetch(`/api/mood?uid=${uid}`);
      if (!moodRes.ok) throw new Error(`Failed to fetch mood data (${moodRes.status})`);

      const moodData: { counts: Record<string, number>; history: HistoryEntry[] } =
        await moodRes.json();

      setAllHistory(moodData.history ?? []);

      const userRes = await fetch("/api/auth/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid }),
      });

      if (userRes.ok) {
        const userData = await userRes.json();
        if (userData.user) {
          setSummaryMap(userData.user.summaryMap ? (typeof userData.user.summaryMap === "object" ? userData.user.summaryMap : {}) : {});
          setDominantEmotion(userData.user.dominantEmotion || "");
          setUserAvgStress(userData.user.avgStress || 0);
          setRiskTrend(userData.user.riskTrend || "");
        }
      }

      const last30 = getLast30Days();
      const grouped: Record<string, HistoryEntry[]> = {};
      for (const entry of moodData.history ?? []) {
        const dk = toDateKey(new Date(entry.timestamp));
        if (last30.includes(dk)) {
          grouped[dk] = grouped[dk] ?? [];
          grouped[dk].push(entry);
        }
      }

      const dayList: DayData[] = last30.map((dk) => {
        const entries = grouped[dk] ?? [];
        const emojiCounts: Record<string, number> = {};
        for (const e of entries) emojiCounts[e.emoji] = (emojiCounts[e.emoji] ?? 0) + 1;

        const dominant = entries.length > 0 ? findDominantEmoji(emojiCounts) : "😐";
        return {
          date: dk,
          label: toDayLabel(dk),
          dominantEmoji: dominant,
          stressWeight: WEIGHT_MAP[dominant] ?? 2,
          stressIndex: calcStressIndex(emojiCounts),
          emojiCounts,
          totalEvents: entries.length,
          wellbeingScore: calcWellbeingScore(emojiCounts),
        };
      });

      setDays(dayList);
      setLastFetched(new Date());
    } catch (err: any) {
      setError(err.message ?? "Unknown error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [uid]);

  useEffect(() => {
    fetchMoodData();
  }, [fetchMoodData]);

  // Derived
  const selectedDay = days.find((d) => d.date === selectedDateKey) ?? null;
  const todayKey = toDateKey(new Date());
  const maxWellbeing = Math.max(...days.map((d) => d.wellbeingScore), 1);
  const visibleDays = isMobile ? days.slice(-7) : days;
  const timeframeLabel = isMobile ? "Last 7 Days" : "Last 30 Days";

  const last7 = days.slice(-7).filter((d) => d.totalEvents > 0);
  const avg7StressIndex = last7.length > 0
    ? Math.round(last7.reduce((a, d) => a + d.stressIndex, 0) / last7.length)
    : 0;

  const prev7 = days.slice(-14, -7).filter((d) => d.totalEvents > 0);
  const avg7Prev = prev7.length > 0
    ? Math.round(prev7.reduce((a, d) => a + d.stressIndex, 0) / prev7.length)
    : null;
  const trendDiff = avg7Prev !== null ? avg7StressIndex - avg7Prev : null;

  const reversed = [...days].reverse();
  let streak = 0;
  for (const d of reversed) {
    if (d.totalEvents === 0) break;
    if (d.stressIndex <= 40) streak++;
    else break;
  }

  const totalEvents = days.reduce((a, d) => a + d.totalEvents, 0);

  // Loading
  if (loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-zinc-200 dark:border-zinc-800" />
          <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-[#B21563] animate-spin" />
        </div>
        <div className="text-center">
          <p className="text-zinc-600 dark:text-zinc-400 text-sm font-medium">Analyzing your wellness data</p>
          <p className="text-zinc-400 dark:text-zinc-600 text-xs mt-1">Crunching the numbers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <GlassCard className="min-h-[200px]">
        <div className="p-8 flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <Activity className="w-6 h-6 text-red-500" />
          </div>
          <p className="text-red-500 text-sm font-medium">{error}</p>
          <button onClick={() => fetchMoodData()} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm">
            <RefreshCw className="w-3.5 h-3.5" /> Try Again
          </button>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-5">
      <style>{`
        @keyframes bounceIn {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideDown {
          from { max-height: 0; opacity: 0; }
          to { max-height: 1000px; opacity: 1; }
        }
        .animate-slide-up { animation: slideUp 0.5s ease-out both; }
      `}</style>

      {/* ── Header ── */}
      <div className="flex items-center justify-between animate-slide-up">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#B21563] to-[#E91E8C] shadow-lg shadow-[#B21563]/20">
              <Activity className="w-5 h-5 text-white" />
            </div>
            Stress Detection
          </h2>
          <p className="text-sm text-zinc-500 mt-1 ml-12">
            {timeframeLabel} · {totalEvents} total events tracked
          </p>
        </div>
        <button
          onClick={() => fetchMoodData(true)}
          disabled={refreshing}
          className={`p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-300 group ${refreshing ? "opacity-50" : "hover:scale-105 active:scale-95"}`}
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 text-zinc-500 group-hover:text-[#B21563] transition-colors ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 7-Day Average */}
        <GlassCard glow={`${getStressColor(avg7StressIndex)}15`}>
          <div className="p-5 flex items-center justify-between animate-slide-up" style={{ animationDelay: "100ms" }}>
            <div>
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">7-Day Average</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black tabular-nums" style={{ color: getStressColor(avg7StressIndex) }}>
                  <AnimatedNumber value={avg7StressIndex} />
                </span>
                <span className="text-sm font-medium text-zinc-400">/100</span>
              </div>
              {trendDiff !== null && (
                <div className="flex items-center gap-1.5 mt-2">
                  <div className={`flex items-center justify-center w-5 h-5 rounded-full ${
                    trendDiff < 0 ? "bg-emerald-100 dark:bg-emerald-900/30" :
                    trendDiff > 0 ? "bg-red-100 dark:bg-red-900/30" :
                    "bg-zinc-100 dark:bg-zinc-800"
                  }`}>
                    {trendDiff < 0 ? <TrendingDown className="w-3 h-3 text-emerald-500" /> :
                     trendDiff > 0 ? <TrendingUp className="w-3 h-3 text-red-500" /> :
                     <Minus className="w-3 h-3 text-zinc-400" />}
                  </div>
                  <span className={`text-xs font-semibold ${trendDiff < 0 ? "text-emerald-500" : trendDiff > 0 ? "text-red-500" : "text-zinc-400"}`}>
                    {trendDiff > 0 ? "+" : ""}{trendDiff} vs prev week
                  </span>
                </div>
              )}
            </div>
            <SparklineTrend data={days.slice(-7).map((d) => d.stressIndex)} color={getStressColor(avg7StressIndex)} />
          </div>
        </GlassCard>

        {/* Today's Mood */}
        <GlassCard>
          <div className="p-5 animate-slide-up" style={{ animationDelay: "200ms" }}>
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Today&apos;s Mood</p>
            {(() => {
              const today = days.find((d) => d.date === todayKey);
              return today && today.totalEvents > 0 ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{today.dominantEmoji}</span>
                    <div>
                      <p className="text-base font-bold text-zinc-800 dark:text-zinc-200">{LABEL_MAP[today.dominantEmoji]}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">{today.totalEvents} event{today.totalEvents !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="text-2xl font-black tabular-nums" style={{ color: getStressColor(today.stressIndex) }}>
                      {Math.round((100 - today.stressIndex) / 10)}
                    </div>
                    <span className="text-[9px] text-zinc-400 font-bold uppercase">/10</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 py-2">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                    <Heart className="w-5 h-5 text-zinc-300 dark:text-zinc-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-400">No data yet</p>
                    <p className="text-xs text-zinc-400/60">Chat to log mood</p>
                  </div>
                </div>
              );
            })()}
          </div>
        </GlassCard>

        {/* Streak */}
        <GlassCard glow={streak > 0 ? "#10b98115" : undefined}>
          <div className="p-5 animate-slide-up" style={{ animationDelay: "300ms" }}>
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Good Days Streak</p>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-emerald-500"><AnimatedNumber value={streak} duration={800} /></span>
                  <span className="text-sm text-zinc-500 font-medium">day{streak !== 1 ? "s" : ""}</span>
                </div>
                <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-orange-400" />
                  Keep it going!
                </p>
              </div>
              <div className="relative">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                  streak > 0 ? "bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/20" : "bg-zinc-100 dark:bg-zinc-800"
                }`}>
                  <Zap className={`w-7 h-7 ${streak > 0 ? "text-white" : "text-zinc-400"}`} />
                </div>
                {streak >= 7 && <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center text-[10px]">🔥</span>}
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* ── Bar Chart (Full Width) ── */}
      <GlassCard>
        <div className="p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#B21563]" />
              {timeframeLabel} Wellbeing
            </h3>
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1.5 rounded-full">
              <Info className="w-3 h-3" />
              Taller = happier
            </div>
          </div>

          <div className="flex gap-[3px] md:gap-[2px] items-end w-full">
            {visibleDays.map((day, i) => (
              <ModernDayBar
                key={day.date} day={day} maxWellbeing={maxWellbeing}
                isSelected={day.date === selectedDateKey} isToday={day.date === todayKey}
                onClick={() => setSelectedDateKey(day.date)} index={i}
              />
            ))}
          </div>

          <div className="flex mt-2 text-[10px] text-zinc-400 font-medium">
            {isMobile
              ? visibleDays.map((day) => (
                  <div key={day.date} className="flex-1 text-center">{day.label.split(" ")[0]}</div>
                ))
              : [0, 7, 14, 21, 29].map((i) => (
                  <div key={i} className="flex-1 text-left pl-1 border-l border-zinc-100 dark:border-zinc-800">
                    {days[i]?.label.split(" ")[0]}
                  </div>
                ))
            }
          </div>
        </div>
      </GlassCard>

      {/* ── Heatmap + Time of Day (Side by Side) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* 12-Week Heatmap */}
        <GlassCard>
          <div className="p-5 h-full">
            <MoodHeatmap
              allHistory={allHistory}
              selectedDateKey={selectedDateKey}
              onSelectDate={setSelectedDateKey}
            />
          </div>
        </GlassCard>

        {/* Time of Day Analysis */}
        <GlassCard>
          <div className="p-5 h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#B21563]" />
                <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Time of Day</h3>
              </div>
              <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${
                selectedDateKey === todayKey
                  ? "bg-[#B21563]/10 text-[#B21563]"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
              }`}>
                {selectedDateKey === todayKey ? "Today" : selectedDay?.label || ""}
              </span>
            </div>
            <TimeOfDayAnalysis history={allHistory} dateKey={selectedDateKey} />
          </div>
        </GlassCard>
      </div>

      {/* ── Selected Day Detail (Stress Ring + Emoji Breakdown) ── */}
      {selectedDay && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Stress Ring */}
          <GlassCard glow={`${getStressColor(selectedDay.stressIndex)}10`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Stress Level</h3>
                <span className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all ${
                  selectedDay.date === todayKey ? "bg-[#B21563]/10 text-[#B21563]" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                }`}>
                  {selectedDay.date === todayKey ? "Today" : selectedDay.label}
                </span>
              </div>
              {selectedDay.totalEvents > 0 ? (
                <StressRing index={selectedDay.stressIndex} emoji={selectedDay.dominantEmoji} label={stressLevelLabel(selectedDay.stressIndex)} />
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 py-12">
                  <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                    <Calendar className="w-8 h-8 text-zinc-300 dark:text-zinc-600" />
                  </div>
                  <p className="text-sm text-zinc-400 font-medium">No mood data for this day</p>
                  <p className="text-xs text-zinc-400/60">Open the chatbot to log your mood</p>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Emoji Breakdown */}
          <GlassCard>
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Mood Breakdown</h3>
                <span className="text-xs text-zinc-400 font-medium">
                  {selectedDay.totalEvents} event{selectedDay.totalEvents !== 1 ? "s" : ""}
                </span>
              </div>
              {selectedDay.totalEvents > 0 ? (
                <>
                  <EmojiBreakdown day={selectedDay} />
                  <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex gap-5 text-xs text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#B21563] inline-block" /> Manual
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-zinc-400 inline-block" /> AI detected
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 py-12">
                  <p className="text-sm text-zinc-400">No events recorded</p>
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      )}

      {/* ── AI Weekly Insight ── */}
      <AIWeeklyInsight
        summaryMap={summaryMap}
        dominantEmotion={dominantEmotion}
        avgStress={userAvgStress}
        riskTrend={riskTrend}
        days={days}
      />

      {/* ── Legend ── */}
      <GlassCard>
        <div className="p-4">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-3">Mood Scale</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {MOOD_CONFIG.map(({ emoji, label, color }) => (
              <div key={emoji} className="flex items-center gap-1.5 group/legend">
                <span className="text-base group-hover/legend:scale-125 transition-transform duration-200">{emoji}</span>
                <span className="text-xs text-zinc-500 font-medium">{label}</span>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              </div>
            ))}
          </div>
        </div>
      </GlassCard>

      {lastFetched && (
        <p className="text-center text-[10px] text-zinc-400">
          Last updated {lastFetched.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      )}
    </div>
  );
};

export default StressMeter;