import { useEffect, useMemo, useRef, useState } from 'react';
import {
  addDays,
  differenceInCalendarDays,
  format,
  startOfDay,
} from 'date-fns';
import { Minus, Plus } from 'lucide-react';

import type { SleepSession } from '../../types/api';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

const AXIS_WIDTH = 52;
const CHART_HEIGHT = 492;
const TOP_PADDING = 16;
const BOTTOM_PADDING = 52;
const PLOT_HEIGHT = CHART_HEIGHT - TOP_PADDING - BOTTOM_PADDING;
const MIN_DAY_WIDTH = 24;
const MAX_DAY_WIDTH = 84;
const ZOOM_STEP = 6;
const DEFAULT_DAY_WIDTH = 42;

export interface SleepTimelineDay {
  key: string;
  date: Date;
}

export interface SleepTimelineSegment {
  id: string;
  dayKey: string;
  startHour: number;
  endHour: number;
  label: string;
}

export interface SleepTimelineData {
  days: SleepTimelineDay[];
  segments: SleepTimelineSegment[];
}

function hourOfDay(date: Date): number {
  return date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
}

function resolvedEnd(session: SleepSession): Date | null {
  if (session.end_time) {
    const end = new Date(session.end_time);
    return Number.isNaN(end.getTime()) ? null : end;
  }
  if (session.duration_minutes && session.duration_minutes > 0) {
    return new Date(new Date(session.start_time).getTime() + session.duration_minutes * 60_000);
  }
  return null;
}

/** Convert sessions into per-day vertical segments, splitting at midnight. */
export function buildSleepTimeline(
  sleeps: SleepSession[],
  referenceDate: Date = new Date(),
): SleepTimelineData {
  const referenceDay = startOfDay(referenceDate);
  const validSessions = sleeps
    .map((session) => ({ session, start: new Date(session.start_time), end: resolvedEnd(session) }))
    .filter(
      (item): item is { session: SleepSession; start: Date; end: Date } =>
        !Number.isNaN(item.start.getTime()) && item.end !== null && item.end > item.start,
    )
    .filter((item) => startOfDay(item.start) <= referenceDay);

  const firstDay = validSessions.length > 0
    ? startOfDay(
        validSessions.reduce(
          (earliest, item) => (item.start < earliest ? item.start : earliest),
          validSessions[0].start,
        ),
      )
    : referenceDay;
  const dayCount = Math.max(differenceInCalendarDays(referenceDay, firstDay) + 1, 1);
  const days = Array.from({ length: dayCount }, (_, index) => {
    const date = addDays(firstDay, index);
    return { date, key: format(date, 'yyyy-MM-dd') };
  });
  const lastVisibleMoment = addDays(referenceDay, 1);

  const segments = validSessions.flatMap(({ session, start, end }) => {
    const clippedEnd = end > lastVisibleMoment ? lastVisibleMoment : end;
    const pieces: SleepTimelineSegment[] = [];
    let cursor = start;
    let part = 0;

    while (cursor < clippedEnd) {
      const dayStart = startOfDay(cursor);
      const nextDay = addDays(dayStart, 1);
      const pieceEnd = clippedEnd < nextDay ? clippedEnd : nextDay;
      const startHour = hourOfDay(cursor);
      const endHour = pieceEnd.getTime() === nextDay.getTime() ? 24 : hourOfDay(pieceEnd);

      if (endHour > startHour) {
        pieces.push({
          id: `${session.id}-${part}`,
          dayKey: format(dayStart, 'yyyy-MM-dd'),
          startHour,
          endHour,
          label: `${format(cursor, 'EEE d MMM, h:mm a')}–${format(pieceEnd, 'h:mm a')}`,
        });
      }
      cursor = pieceEnd;
      part += 1;
    }

    return pieces;
  });

  return { days, segments };
}

interface SleepTimelineProps {
  sleeps: SleepSession[];
  referenceDate?: Date;
}

function axisLabel(hour: number): string {
  if (hour === 0 || hour === 24) return '12 am';
  if (hour === 12) return '12 pm';
  return hour < 12 ? `${hour} am` : `${hour - 12} pm`;
}

export function SleepTimeline({ sleeps, referenceDate = new Date() }: SleepTimelineProps) {
  const [dayWidth, setDayWidth] = useState(DEFAULT_DAY_WIDTH);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timeline = useMemo(
    () => buildSleepTimeline(sleeps, referenceDate),
    [sleeps, referenceDate],
  );
  const dayIndex = useMemo(
    () => new Map(timeline.days.map((day, index) => [day.key, index])),
    [timeline.days],
  );
  const chartWidth = timeline.days.length * dayWidth;
  const gridHours = Array.from({ length: 9 }, (_, index) => index * 3);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ left: scrollRef.current.scrollWidth });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [babyTimelineKey(timeline.days)]);

  const changeZoom = (delta: number) => {
    const element = scrollRef.current;
    const wasAtRight = element
      ? element.scrollWidth - element.scrollLeft - element.clientWidth < 8
      : true;
    setDayWidth((current) => Math.min(MAX_DAY_WIDTH, Math.max(MIN_DAY_WIDTH, current + delta)));
    if (wasAtRight) {
      window.requestAnimationFrame(() => {
        element?.scrollTo({ left: element.scrollWidth });
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <CardTitle>Sleep Timeline</CardTitle>
            <CardDescription>
              Each green block is sleep. Swipe sideways for earlier days; zoom for wider days.
            </CardDescription>
          </div>
          <div
            aria-label="Chart zoom controls"
            style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
          >
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Zoom out"
              onClick={() => changeZoom(-ZOOM_STEP)}
              disabled={dayWidth === MIN_DAY_WIDTH}
            >
              <Minus aria-hidden="true" />
            </Button>
            <span aria-live="polite" style={{ minWidth: 54, textAlign: 'center', fontSize: 12 }}>
              Zoom
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Zoom in"
              onClick={() => changeZoom(ZOOM_STEP)}
              disabled={dayWidth === MAX_DAY_WIDTH}
            >
              <Plus aria-hidden="true" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {timeline.segments.length === 0 ? (
          <div style={{ minHeight: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p className="text-muted-foreground">No completed sleep sessions to show.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', minWidth: 0 }}>
            <svg
              width={AXIS_WIDTH}
              height={CHART_HEIGHT}
              aria-hidden="true"
              style={{ flex: `0 0 ${AXIS_WIDTH}px`, overflow: 'visible' }}
            >
              {gridHours.map((hour) => {
                const y = TOP_PADDING + (hour / 24) * PLOT_HEIGHT;
                return (
                  <text
                    key={hour}
                    x={AXIS_WIDTH - 8}
                    y={y}
                    dy={hour === 0 ? 10 : hour === 24 ? 0 : 4}
                    textAnchor="end"
                    fill="var(--muted-foreground)"
                    fontSize="11"
                    data-axis-end={hour === 24 ? 'true' : undefined}
                  >
                    {axisLabel(hour)}
                  </text>
                );
              })}
            </svg>
            <div
              ref={scrollRef}
              data-testid="sleep-timeline-scroll"
              data-pan-axis="x"
              style={{
                minWidth: 0,
                flex: 1,
                overflowX: 'auto',
                overscrollBehaviorX: 'contain',
                touchAction: 'pan-x',
                WebkitOverflowScrolling: 'touch',
                borderLeft: '1px solid var(--border)',
                borderRight: '1px solid var(--border)',
              }}
            >
              <svg
                role="img"
                aria-label={`Sleep timeline from ${format(timeline.days[0].date, 'd MMM yyyy')} to ${format(timeline.days[timeline.days.length - 1].date, 'd MMM yyyy')}`}
                data-testid="sleep-timeline-chart"
                data-day-width={dayWidth}
                width={chartWidth}
                height={CHART_HEIGHT}
              >
                <title>Sleep timeline. Older days are on the left and recent days are on the right.</title>
                {timeline.days.map((day, index) => (
                  <g key={day.key}>
                    <rect
                      x={index * dayWidth}
                      y={TOP_PADDING}
                      width={dayWidth}
                      height={PLOT_HEIGHT}
                      fill={index % 2 === 0 ? 'var(--background)' : 'var(--muted)'}
                      opacity={index % 2 === 0 ? 1 : 0.38}
                    />
                    <line
                      x1={index * dayWidth}
                      x2={index * dayWidth}
                      y1={TOP_PADDING}
                      y2={TOP_PADDING + PLOT_HEIGHT}
                      stroke="var(--border)"
                    />
                    <text
                      x={index * dayWidth + dayWidth / 2}
                      y={TOP_PADDING + PLOT_HEIGHT + 20}
                      textAnchor="middle"
                      fill="var(--foreground)"
                      fontSize="11"
                      fontWeight={index === timeline.days.length - 1 ? 700 : 500}
                    >
                      {format(day.date, 'd')}
                    </text>
                    <text
                      x={index * dayWidth + dayWidth / 2}
                      y={TOP_PADDING + PLOT_HEIGHT + 36}
                      textAnchor="middle"
                      fill="var(--muted-foreground)"
                      fontSize="10"
                    >
                      {format(day.date, 'MMM')}
                    </text>
                  </g>
                ))}
                {gridHours.map((hour) => {
                  const y = TOP_PADDING + (hour / 24) * PLOT_HEIGHT;
                  return (
                    <line
                      key={hour}
                      x1={0}
                      x2={chartWidth}
                      y1={y}
                      y2={y}
                      stroke="var(--border)"
                      strokeWidth={hour === 0 || hour === 24 ? 1.4 : 1}
                    />
                  );
                })}
                {timeline.segments.map((segment) => {
                  const index = dayIndex.get(segment.dayKey);
                  if (index === undefined) return null;
                  const y = TOP_PADDING + (segment.startHour / 24) * PLOT_HEIGHT;
                  const height = Math.max(((segment.endHour - segment.startHour) / 24) * PLOT_HEIGHT, 2);
                  return (
                    <rect
                      key={segment.id}
                      x={index * dayWidth + 3}
                      y={y}
                      width={Math.max(dayWidth - 6, 2)}
                      height={height}
                      rx={Math.min(4, dayWidth / 8)}
                      fill="#36a269"
                      stroke="#24784d"
                      strokeWidth="1"
                    >
                      <title>{segment.label}</title>
                    </rect>
                  );
                })}
                <line
                  data-testid="latest-day-marker"
                  x1={chartWidth - dayWidth}
                  x2={chartWidth - dayWidth}
                  y1={TOP_PADDING}
                  y2={TOP_PADDING + PLOT_HEIGHT}
                  stroke="#2563eb"
                  strokeWidth="2"
                  opacity="0.7"
                />
              </svg>
            </div>
          </div>
        )}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            marginTop: 10,
            color: 'var(--muted-foreground)',
            fontSize: 12,
          }}
        >
          <span>← Older days</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: '#36a269' }} />
            Asleep
          </span>
          <span>Most recent →</span>
        </div>
      </CardContent>
    </Card>
  );
}

function babyTimelineKey(days: SleepTimelineDay[]): string {
  return `${days.length}:${days[0]?.key ?? ''}:${days[days.length - 1]?.key ?? ''}`;
}
