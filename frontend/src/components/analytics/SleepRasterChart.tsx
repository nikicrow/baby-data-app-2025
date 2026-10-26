import { useEffect, useMemo, useRef, useState } from 'react';
import { addDays, differenceInCalendarDays, format, parseISO, startOfDay } from 'date-fns';
import type { SleepSession } from '../../types/api';

interface SleepRasterChartProps {
  sleeps: SleepSession[];
  /** Baby's DOB — drives the "age in weeks" x-axis. Falls back to dates when absent. */
  dateOfBirth?: string;
  /** Height of the chart in px, axes included. */
  height?: number;
}

/** One asleep block, already clipped to a single calendar day. */
interface Segment {
  dayIndex: number;
  startMinute: number;
  endMinute: number;
}

interface DaySummary {
  dayIndex: number;
  date: Date;
  totalMinutes: number;
  sessions: number;
}

const MINUTES_PER_DAY = 24 * 60;
const SLEEP_FILL = '#4c72b0';
const MARGIN = { top: 8, right: 12, bottom: 38, left: 46 };

/** Keep a minute-of-day inside the plotted 24h even on 23/25-hour DST days. */
const clampMinute = (minute: number) => Math.min(Math.max(minute, 0), MINUTES_PER_DAY);

/**
 * Raster (actogram) view of every sleep session: one column per day, time of
 * day running up the y-axis, a blue block wherever she was asleep. Sessions
 * that cross midnight are split so each block stays inside its own column.
 */
export function SleepRasterChart({ sleeps, dateOfBirth, height = 420 }: SleepRasterChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      setWidth(entries[0].contentRect.width);
    });
    observer.observe(el);
    setWidth(el.clientWidth);
    return () => observer.disconnect();
  }, []);

  const { segments, days, dayCount } = useMemo(() => {
    const empty = { segments: [] as Segment[], days: [] as DaySummary[], dayCount: 0 };
    const intervals = sleeps
      .filter((s) => s.end_time || s.duration_minutes)
      .map((s) => {
        const start = parseISO(s.start_time);
        const end = s.end_time
          ? parseISO(s.end_time)
          : new Date(start.getTime() + (s.duration_minutes ?? 0) * 60_000);
        return { start, end };
      })
      .filter(({ start, end }) => end > start)
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    if (intervals.length === 0) return empty;

    // The x-axis starts at birth when we know it, so week 0 lines up with her
    // actual age rather than with whenever tracking happened to begin.
    const firstSleepDay = startOfDay(intervals[0].start);
    const dobDay = dateOfBirth ? startOfDay(parseISO(dateOfBirth)) : null;
    const origin = dobDay && dobDay < firstSleepDay ? dobDay : firstSleepDay;
    const lastDay = intervals.reduce(
      (latest, { end }) => (end > latest ? end : latest),
      intervals[0].end,
    );
    const totalDays = differenceInCalendarDays(startOfDay(lastDay), origin) + 1;
    if (totalDays <= 0) return empty;

    const summaries: DaySummary[] = Array.from({ length: totalDays }, (_, i) => ({
      dayIndex: i,
      date: new Date(origin.getFullYear(), origin.getMonth(), origin.getDate() + i),
      totalMinutes: 0,
      sessions: 0,
    }));

    const built: Segment[] = [];
    intervals.forEach(({ start, end }) => {
      let cursor = start;
      let firstChunk = true;
      while (cursor < end) {
        const dayStart = startOfDay(cursor);
        // Calendar-based, not +24h: on a DST day the local day is 23 or 25
        // hours long, and a fixed offset would land before `cursor` and spin.
        const nextMidnight = startOfDay(addDays(dayStart, 1));
        const chunkEnd = end < nextMidnight ? end : nextMidnight;
        if (chunkEnd <= cursor) break;
        const dayIndex = differenceInCalendarDays(dayStart, origin);
        const startMinute = clampMinute((cursor.getTime() - dayStart.getTime()) / 60_000);
        const endMinute = clampMinute((chunkEnd.getTime() - dayStart.getTime()) / 60_000);

        if (dayIndex >= 0 && dayIndex < totalDays && endMinute > startMinute) {
          built.push({ dayIndex, startMinute, endMinute });
          summaries[dayIndex].totalMinutes += endMinute - startMinute;
          if (firstChunk) summaries[dayIndex].sessions += 1;
        }
        cursor = chunkEnd;
        firstChunk = false;
      }
    });

    return { segments: built, days: summaries, dayCount: totalDays };
  }, [sleeps, dateOfBirth]);

  if (dayCount === 0) {
    return (
      <div className="flex items-center justify-center text-muted-foreground" style={{ height }}>
        No completed sleep sessions to plot yet
      </div>
    );
  }

  const svgWidth = Math.max(width, 320);
  const plotWidth = Math.max(svgWidth - MARGIN.left - MARGIN.right, 10);
  const plotHeight = Math.max(height - MARGIN.top - MARGIN.bottom, 10);
  const colWidth = plotWidth / dayCount;
  const barWidth = Math.max(colWidth * 0.9, 1);

  const xFor = (dayIndex: number) => MARGIN.left + dayIndex * colWidth;
  const yFor = (minute: number) => MARGIN.top + plotHeight * (1 - minute / MINUTES_PER_DAY);

  // Hourly labels get cramped on a phone — thin them out as the chart shrinks.
  const hourStep = plotHeight < 260 ? 6 : plotHeight < 400 ? 4 : 2;
  const hourTicks = Array.from({ length: Math.floor(24 / hourStep) + 1 }, (_, i) => i * hourStep);

  const dobDay = dateOfBirth ? startOfDay(parseISO(dateOfBirth)) : null;
  const ageDaysAt = (dayIndex: number) =>
    dobDay ? differenceInCalendarDays(days[dayIndex].date, dobDay) : null;

  // One label per fortnight, spaced further apart when there isn't room.
  const weekStep = plotWidth / Math.max(dayCount / 7, 1) < 26 ? 4 : 2;
  const xTicks = days
    .filter((d) => {
      const offset = ageDaysAt(d.dayIndex) ?? d.dayIndex;
      return offset >= 0 && offset % (weekStep * 7) === 0;
    })
    .map((d) => ({
      dayIndex: d.dayIndex,
      label: dobDay ? `${Math.round((ageDaysAt(d.dayIndex) ?? 0) / 7)}` : format(d.date, 'd MMM'),
    }));

  const hovered = hoveredDay !== null ? days[hoveredDay] : null;
  const hoveredAgeDays = hoveredDay !== null ? ageDaysAt(hoveredDay) : null;
  const tooltipLeft = hovered
    ? Math.min(Math.max(xFor(hovered.dayIndex) + barWidth / 2, 90), svgWidth - 90)
    : 0;

  return (
    <div ref={containerRef} className="relative w-full">
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${svgWidth} ${height}`}
        className="text-muted-foreground"
        onMouseLeave={() => setHoveredDay(null)}
      >
        {/* Plot background */}
        <rect
          x={MARGIN.left}
          y={MARGIN.top}
          width={plotWidth}
          height={plotHeight}
          fill="currentColor"
          opacity={0.08}
        />

        {/* Hour gridlines and labels */}
        {hourTicks.map((hour) => (
          <g key={hour}>
            <line
              x1={MARGIN.left}
              x2={MARGIN.left + plotWidth}
              y1={yFor(hour * 60)}
              y2={yFor(hour * 60)}
              stroke="currentColor"
              strokeOpacity={0.18}
            />
            <text
              x={MARGIN.left - 8}
              y={yFor(hour * 60)}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={11}
              fill="currentColor"
            >
              {`${hour.toString().padStart(2, '0')}:00`}
            </text>
          </g>
        ))}

        {/* Asleep blocks */}
        {segments.map((seg, i) => (
          <rect
            key={i}
            x={xFor(seg.dayIndex)}
            y={yFor(seg.endMinute)}
            width={barWidth}
            height={Math.max(
              ((seg.endMinute - seg.startMinute) / MINUTES_PER_DAY) * plotHeight,
              0.75,
            )}
            fill={SLEEP_FILL}
            opacity={hoveredDay === null || hoveredDay === seg.dayIndex ? 1 : 0.4}
          />
        ))}

        {/* Week ticks */}
        {xTicks.map((tick) => (
          <g key={tick.dayIndex}>
            <line
              x1={xFor(tick.dayIndex)}
              x2={xFor(tick.dayIndex)}
              y1={MARGIN.top + plotHeight}
              y2={MARGIN.top + plotHeight + 5}
              stroke="currentColor"
              strokeOpacity={0.4}
            />
            <text
              x={xFor(tick.dayIndex)}
              y={MARGIN.top + plotHeight + 17}
              textAnchor="middle"
              fontSize={11}
              fill="currentColor"
            >
              {tick.label}
            </text>
          </g>
        ))}
        <text
          x={MARGIN.left + plotWidth / 2}
          y={height - 4}
          textAnchor="middle"
          fontSize={11}
          fill="currentColor"
        >
          {dobDay ? 'Age (weeks)' : 'Date'}
        </text>

        {/* Invisible hit targets, one per day */}
        {days.map((day) => (
          <rect
            key={day.dayIndex}
            x={xFor(day.dayIndex)}
            y={MARGIN.top}
            width={Math.max(colWidth, 1)}
            height={plotHeight}
            fill="transparent"
            onMouseEnter={() => setHoveredDay(day.dayIndex)}
          />
        ))}
      </svg>

      {hovered && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-md border bg-popover px-3 py-2 text-xs shadow-md"
          style={{ left: tooltipLeft, top: 4 }}
        >
          <p className="font-medium">{format(hovered.date, 'EEE d MMM yyyy')}</p>
          {hoveredAgeDays !== null && (
            <p className="text-muted-foreground">
              {Math.floor(hoveredAgeDays / 7)}w {hoveredAgeDays % 7}d old
            </p>
          )}
          <p className="text-muted-foreground">
            {(hovered.totalMinutes / 60).toFixed(1)}h asleep · {hovered.sessions}{' '}
            {hovered.sessions === 1 ? 'session' : 'sessions'}
          </p>
        </div>
      )}
    </div>
  );
}
