import { useEffect, useMemo, useRef, useState } from 'react';
import { addDays, differenceInCalendarDays, format, parseISO, startOfDay } from 'date-fns';
import type { SleepSession, FeedingSession } from '../../types/api';
import { feedingApi } from '../../services/api';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SleepRasterChartProps {
  babyId: string;
  refreshTrigger?: number;
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
const FEED_FILL = '#d97706';
const MARGIN = { top: 8, right: 12, bottom: 38, left: 46 };

/** Keep a minute-of-day inside the plotted 24h even on 23/25-hour DST days. */
const clampMinute = (minute: number) => Math.min(Math.max(minute, 0), MINUTES_PER_DAY);

/**
 * Raster (actogram) view of every sleep session: one column per day, time of
 * day running up the y-axis, a blue block wherever she was asleep. Sessions
 * that cross midnight are split so each block stays inside its own column.
 */
export function SleepRasterChart({ babyId, refreshTrigger, sleeps, dateOfBirth, height = 420 }: SleepRasterChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const [range, setRange] = useState<0 | 28 | 7>(0);
  const [daysBack, setDaysBack] = useState(0);
  const [showFeeds, setShowFeeds] = useState(false);
  const [feeds, setFeeds] = useState<FeedingSession[]>([]);
  const [feedsLoading, setFeedsLoading] = useState(false);
  const [feedsError, setFeedsError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setFeeds([]);
    setFeedsError(false);
    setFeedsLoading(showFeeds);
    if (showFeeds) {
      const loadFeeds = async () => {
        try {
          const allFeeds: FeedingSession[] = [];
          const pageSize = 1000;
          while (!cancelled) {
            const page = await feedingApi.getAll({ baby_id: babyId, skip: allFeeds.length, limit: pageSize });
            if (cancelled) return;
            allFeeds.push(...page);
            if (page.length < pageSize) break;
          }
          if (!cancelled) setFeeds(allFeeds);
        } catch {
          if (!cancelled) setFeedsError(true);
        } finally {
          if (!cancelled) setFeedsLoading(false);
        }
      };
      loadFeeds();
    }
    return () => { cancelled = true; };
  }, [babyId, refreshTrigger, showFeeds]);

  useEffect(() => {
    setDaysBack(0);
    setHoveredDay(null);
  }, [sleeps, dateOfBirth]);

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

  const { feedSegments, feedCounts } = useMemo(() => {
    const built: Segment[] = [];
    const counts = new Map<number, number>();
    if (!days.length) return { feedSegments: built, feedCounts: counts };
    const origin = days[0].date;
    feeds.forEach((feed) => {
      const start = parseISO(feed.start_time);
      if (!Number.isFinite(start.getTime())) return;
      const dayIndex = differenceInCalendarDays(startOfDay(start), origin);
      counts.set(dayIndex, (counts.get(dayIndex) ?? 0) + 1);
      const duration = feed.duration_minutes ?? ((feed.left_breast_duration ?? 0) + (feed.right_breast_duration ?? 0));
      const end = feed.end_time ? parseISO(feed.end_time) : new Date(start.getTime() + duration * 60000);
      if (!Number.isFinite(end.getTime()) || end <= start) {
        // Feeds without a duration are markers at their recorded start time.
        const minute = clampMinute((start.getTime() - startOfDay(start).getTime()) / 60000);
        built.push({ dayIndex, startMinute: minute, endMinute: minute });
        return;
      }
      let cursor = start;
      while (cursor < end) {
        const dayStart = startOfDay(cursor);
        const midnight = startOfDay(addDays(dayStart, 1));
        const chunkEnd = end < midnight ? end : midnight;
        if (chunkEnd <= cursor) break;
        built.push({
          dayIndex: differenceInCalendarDays(dayStart, origin),
          startMinute: clampMinute((cursor.getTime() - dayStart.getTime()) / 60000),
          endMinute: clampMinute((chunkEnd.getTime() - dayStart.getTime()) / 60000),
        });
        cursor = chunkEnd;
      }
    });
    return { feedSegments: built, feedCounts: counts };
  }, [feeds, days]);

  if (dayCount === 0) {
    return (
      <div className="flex items-center justify-center text-muted-foreground" style={{ height }}>
        No completed sleep sessions to plot yet
      </div>
    );
  }

  const visibleCount = range === 0 ? dayCount : Math.min(range, dayCount);
  const maxDaysBack = dayCount - visibleCount;
  const offset = range === 0 ? 0 : Math.min(daysBack, maxDaysBack);
  const firstVisible = dayCount - offset - visibleCount;
  const endVisible = firstVisible + visibleCount;
  const visibleDays = days.slice(firstVisible, endVisible);
  const visibleSegments = segments.filter((s) => s.dayIndex >= firstVisible && s.dayIndex < endVisible);
  const browse = (direction: number) => {
    setDaysBack(Math.max(0, Math.min(maxDaysBack, offset + direction * range)));
    setHoveredDay(null);
  };

  const svgWidth = width > 0 ? width : 320;
  const plotWidth = Math.max(svgWidth - MARGIN.left - MARGIN.right, 10);
  const plotHeight = Math.max(height - MARGIN.top - MARGIN.bottom, 10);
  const colWidth = plotWidth / visibleCount;
  const barWidth = Math.max(colWidth * 0.9, 1);

  const xFor = (dayIndex: number) => MARGIN.left + (dayIndex - firstVisible) * colWidth;
  const yFor = (minute: number) => MARGIN.top + plotHeight * (1 - minute / MINUTES_PER_DAY);

  // Hourly labels get cramped on a phone — thin them out as the chart shrinks.
  const hourStep = plotHeight < 260 ? 6 : plotHeight < 400 ? 4 : 2;
  const hourTicks = Array.from({ length: Math.floor(24 / hourStep) + 1 }, (_, i) => i * hourStep);

  const dobDay = dateOfBirth ? startOfDay(parseISO(dateOfBirth)) : null;
  const ageDaysAt = (dayIndex: number) =>
    dobDay ? differenceInCalendarDays(days[dayIndex].date, dobDay) : null;

  // One label per fortnight, spaced further apart when there isn't room.
  const weekStep = plotWidth / Math.max(visibleCount / 7, 1) < 26 ? 4 : 2;
  const xTicks = visibleDays
    .filter((d) => {
      if (range === 7) return true;
      if (range === 28) return (d.dayIndex - firstVisible) % 7 === 0;
      const offset = ageDaysAt(d.dayIndex) ?? d.dayIndex;
      return offset >= 0 && offset % (weekStep * 7) === 0;
    })
    .map((d) => ({
      dayIndex: d.dayIndex,
      label: range !== 0 ? format(d.date, 'd MMM') : dobDay ? `${Math.round((ageDaysAt(d.dayIndex) ?? 0) / 7)}` : format(d.date, 'd MMM'),
    }));

  const hovered = hoveredDay !== null ? days[hoveredDay] : null;
  const hoveredAgeDays = hoveredDay !== null ? ageDaysAt(hoveredDay) : null;
  const tooltipLeft = hovered
    ? Math.min(Math.max(xFor(hovered.dayIndex) + barWidth / 2, 90), svgWidth - 90)
    : 0;

  return (
    <div className="space-y-3">
      <div className="flex gap-2" role="group" aria-label="Sleep chart range">
        {([{ value: 0, label: 'All time' }, { value: 28, label: '4 weeks' }, { value: 7, label: '1 week' }] as const).map((option) => (
          <Button
            key={option.value}
            type="button"
            size="sm"
            variant={range === option.value ? 'default' : 'outline'}
            aria-pressed={range === option.value}
            onClick={() => { setRange(option.value); setDaysBack(0); setHoveredDay(null); }}
          >
            {option.label}
          </Button>
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
          <input type="checkbox" checked={showFeeds} onChange={(event) => setShowFeeds(event.target.checked)} />
          Overlay feeds
        </label>
        <span className="text-xs text-muted-foreground" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span aria-hidden="true" style={{ width: 10, height: 10, background: SLEEP_FILL, display: 'inline-block' }} /> Sleep
        </span>
        {showFeeds && <span className="text-xs text-muted-foreground" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span aria-hidden="true" style={{ width: 10, height: 10, background: FEED_FILL, display: 'inline-block' }} /> Feeds
        </span>}
      </div>
      {showFeeds && <p className="text-xs text-muted-foreground" role="status">
        {feedsLoading ? 'Loading feeds…' : feedsError ? 'Could not load feeds. Turn the overlay off and on to retry.' : feeds.length === 0 ? 'No feeds recorded for this baby.' : 'Orange marks show feeds; feeds without a duration appear as a short mark.'}
      </p>}
      {range !== 0 && (
        <div className="flex items-center justify-between gap-2">
          <Button type="button" size="icon" variant="outline" aria-label="Previous period" disabled={offset >= maxDaysBack} onClick={() => browse(1)}>
            <ChevronLeft />
          </Button>
          <p className="text-center text-xs text-muted-foreground" style={{ display: 'flex', flexDirection: 'column', gap: 4, lineHeight: 1.5, minWidth: 0 }} aria-live="polite">
            <span>{format(visibleDays[0].date, 'd MMM yyyy')} – {format(visibleDays[visibleCount - 1].date, 'd MMM yyyy')}</span>
            {dobDay && (
              <span>
                {Math.floor(ageDaysAt(firstVisible)! / 7)}–{Math.floor(ageDaysAt(endVisible - 1)! / 7)} weeks old
              </span>
            )}
          </p>
          <Button type="button" size="icon" variant="outline" aria-label="Next period" disabled={offset === 0} onClick={() => browse(-1)}>
            <ChevronRight />
          </Button>
        </div>
      )}
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
        {visibleSegments.map((seg, i) => (
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

        {/* Draw feeds above sleep so overlapping events remain visible. */}
        {showFeeds && !feedsLoading && !feedsError && feedSegments
          .filter((seg) => seg.dayIndex >= firstVisible && seg.dayIndex < endVisible)
          .map((seg, i) => (
            <rect
              key={`feed-${i}`}
              x={xFor(seg.dayIndex)}
              y={Math.min(yFor(seg.endMinute), MARGIN.top + plotHeight - 3)}
              width={barWidth}
              height={Math.max(((seg.endMinute - seg.startMinute) / MINUTES_PER_DAY) * plotHeight, 3)}
              fill={FEED_FILL}
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
          {range === 0 && dobDay ? 'Age (weeks)' : 'Date'}
        </text>

        {/* Invisible hit targets, one per day */}
        {visibleDays.map((day) => (
          <rect
            key={day.dayIndex}
            x={xFor(day.dayIndex)}
            y={MARGIN.top}
            width={Math.max(colWidth, 1)}
            height={plotHeight}
            fill="transparent"
            onMouseEnter={() => setHoveredDay(day.dayIndex)}
            onClick={() => setHoveredDay(day.dayIndex)}
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
          {showFeeds && !feedsLoading && !feedsError && (
            <p style={{ color: FEED_FILL }}>{feedCounts.get(hovered.dayIndex) ?? 0} feeds</p>
          )}
        </div>
      )}
    </div>
    </div>
  );
}
