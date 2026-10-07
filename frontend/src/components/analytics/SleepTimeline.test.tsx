// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { SleepSession } from '../../types/api';
import { buildSleepTimeline, SleepTimeline } from './SleepTimeline';

const originalScrollTo = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollTo');
const originalScrollWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollWidth');

function restoreHTMLElementProperty(
  property: 'scrollTo' | 'scrollWidth',
  descriptor: PropertyDescriptor | undefined,
) {
  if (descriptor) {
    Object.defineProperty(HTMLElement.prototype, property, descriptor);
  } else {
    delete HTMLElement.prototype[property];
  }
}

afterEach(() => {
  cleanup();
  restoreHTMLElementProperty('scrollTo', originalScrollTo);
  restoreHTMLElementProperty('scrollWidth', originalScrollWidth);
});

const sleep = (
  id: string,
  start_time: string,
  end_time: string,
): SleepSession => ({
  id,
  baby_id: 'baby-1',
  start_time,
  end_time,
  sleep_type: 'nighttime',
  location: 'crib',
  sleep_quality: 'good',
  created_at: start_time,
  updated_at: end_time,
  duration_minutes: Math.round(
    (new Date(end_time).getTime() - new Date(start_time).getTime()) / 60_000,
  ),
});

describe('buildSleepTimeline', () => {
  it('orders days from oldest to newest and splits sleep across midnight', () => {
    const timeline = buildSleepTimeline(
      [sleep('overnight', '2026-10-03T23:00:00', '2026-10-04T01:30:00')],
      new Date('2026-10-05T12:00:00'),
    );

    expect(timeline.days.map((day) => day.key)).toEqual([
      '2026-10-03',
      '2026-10-04',
      '2026-10-05',
    ]);
    expect(timeline.segments).toEqual([
      expect.objectContaining({ dayKey: '2026-10-03', startHour: 23, endHour: 24 }),
      expect.objectContaining({ dayKey: '2026-10-04', startHour: 0, endHour: 1.5 }),
    ]);
  });

  it('uses duration when a completed session has no end timestamp', () => {
    const session = {
      ...sleep('duration-only', '2026-10-05T09:15:00', '2026-10-05T10:45:00'),
      end_time: undefined,
      duration_minutes: 90,
    };

    const timeline = buildSleepTimeline([session], new Date('2026-10-05T12:00:00'));

    expect(timeline.segments).toEqual([
      expect.objectContaining({ startHour: 9.25, endHour: 10.75 }),
    ]);
  });
});

describe('SleepTimeline', () => {
  const sessions = [
    sleep('day-one', '2026-09-28T13:00:00', '2026-09-28T14:00:00'),
    sleep('today', '2026-10-05T08:00:00', '2026-10-05T09:30:00'),
  ];

  it('renders a horizontally scrollable, midnight-based sleep chart', () => {
    render(<SleepTimeline sleeps={sessions} referenceDate={new Date('2026-10-05T12:00:00')} />);

    expect(screen.getByRole('img', { name: /sleep timeline/i })).toBeInTheDocument();
    expect(screen.getByTestId('sleep-timeline-scroll')).toHaveStyle({ overflowX: 'auto' });
    expect(screen.getAllByText('12 am')).toHaveLength(2);
    expect(screen.getByText('12 pm')).toBeInTheDocument();
    expect(screen.getByText('12 am', { selector: '[data-axis-end="true"]' })).toBeInTheDocument();
  });

  it('changes the rendered chart and sleep-block widths on every enabled zoom click', () => {
    const oneDay = [sleep('today', '2026-10-05T08:00:00', '2026-10-05T09:30:00')];
    render(<SleepTimeline sleeps={oneDay} referenceDate={new Date('2026-10-05T12:00:00')} />);

    const chart = screen.getByTestId('sleep-timeline-chart');
    const sleepBlock = chart.querySelector('rect[fill="#36a269"]');
    const zoomIn = screen.getByRole('button', { name: 'Zoom in' });
    const zoomOut = screen.getByRole('button', { name: 'Zoom out' });
    expect(sleepBlock).not.toBeNull();

    let previousChartWidth = Number(chart.getAttribute('width'));
    let previousBlockWidth = Number(sleepBlock?.getAttribute('width'));
    while (!zoomIn.hasAttribute('disabled')) {
      fireEvent.click(zoomIn);
      const nextChartWidth = Number(chart.getAttribute('width'));
      const nextBlockWidth = Number(sleepBlock?.getAttribute('width'));
      expect(nextChartWidth).toBeGreaterThan(previousChartWidth);
      expect(nextBlockWidth).toBeGreaterThan(previousBlockWidth);
      previousChartWidth = nextChartWidth;
      previousBlockWidth = nextBlockWidth;
    }

    while (!zoomOut.hasAttribute('disabled')) {
      fireEvent.click(zoomOut);
      const nextChartWidth = Number(chart.getAttribute('width'));
      const nextBlockWidth = Number(sleepBlock?.getAttribute('width'));
      expect(nextChartWidth).toBeLessThan(previousChartWidth);
      expect(nextBlockWidth).toBeLessThan(previousBlockWidth);
      previousChartWidth = nextChartWidth;
      previousBlockWidth = nextBlockWidth;
    }
  });

  it('keeps a short timeline aligned with the newest-day marker without filling unused space', () => {
    const oneDay = [sleep('today', '2026-10-05T08:00:00', '2026-10-05T09:30:00')];

    render(<SleepTimeline sleeps={oneDay} referenceDate={new Date('2026-10-05T12:00:00')} />);

    expect(screen.getByTestId('sleep-timeline-chart')).toHaveAttribute('width', '42');
    expect(screen.getByTestId('latest-day-marker')).toHaveAttribute('x1', '0');
  });

  it('starts at the most recent days while allowing native horizontal panning', async () => {
    const scrollTo = vi.fn();
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
      configurable: true,
      value: scrollTo,
    });
    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
      configurable: true,
      get: () => 2_000,
    });

    render(<SleepTimeline sleeps={sessions} referenceDate={new Date('2026-10-05T12:00:00')} />);

    await waitFor(() => expect(scrollTo).toHaveBeenCalledWith({ left: 2_000 }));
    expect(screen.getByTestId('sleep-timeline-scroll')).toHaveAttribute('data-pan-axis', 'x');
  });
});
