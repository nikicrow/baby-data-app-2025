// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, expect, it, vi } from 'vitest';
import type { GrowthMeasurement, SleepSession } from '../types/api';
import { ActivityFeed } from './ActivityFeed';

const mocks = vi.hoisted(() => ({
  getGrowth: vi.fn(), updateGrowth: vi.fn(), getSleep: vi.fn(), updateSleep: vi.fn(),
}));
vi.mock('../services/api', () => ({
  feedingApi: { getAll: async () => [] }, diaperApi: { getAll: async () => [] },
  growthApi: { getAll: mocks.getGrowth, update: mocks.updateGrowth },
  sleepApi: { getAll: mocks.getSleep, update: mocks.updateSleep },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const showModal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal');
const close = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close');
beforeAll(() => {
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true,
    value(this: HTMLDialogElement) { this.setAttribute('open', ''); } });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true,
    value(this: HTMLDialogElement) { this.removeAttribute('open'); this.dispatchEvent(new Event('close')); } });
});
afterAll(() => {
  for (const [name, descriptor] of [['showModal', showModal], ['close', close]] as const) {
    if (descriptor) Object.defineProperty(HTMLDialogElement.prototype, name, descriptor);
    else Reflect.deleteProperty(HTMLDialogElement.prototype, name);
  }
});
afterEach(() => { cleanup(); vi.clearAllMocks(); });

it('edits growth using a date-only payload', async () => {
  const measurement: GrowthMeasurement = {
    id: 'growth', baby_id: 'baby', created_at: '2026-10-15T12:00:00', updated_at: '2026-10-15T12:00:00',
    measurement_date: '2026-10-15', measurement_context: 'clinic', weight_kg: 5.25,
    length_cm: null, head_circumference_cm: null, notes: null, measured_by: null, percentiles: null,
  };
  mocks.getGrowth.mockResolvedValue([measurement]);
  mocks.getSleep.mockResolvedValue([]);
  mocks.updateGrowth.mockResolvedValue(measurement);
  render(<ActivityFeed babyId="baby" refreshTrigger={0} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Edit growth activity' }));
  fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-10-10' } });
  expect(screen.queryByLabelText('Time')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
  await waitFor(() => expect(mocks.updateGrowth).toHaveBeenCalledWith('growth', expect.objectContaining({
    measurement_date: '2026-10-10', weight_kg: 5.25,
  })));
});

it('keeps an imported sleep quality unrecorded when saving other fields', async () => {
  const session: SleepSession = {
    id: 'sleep', baby_id: 'baby', created_at: '2026-10-15T12:00:00', updated_at: '2026-10-15T12:00:00',
    start_time: '2026-10-15T12:00:00', end_time: '2026-10-15T13:00:00', duration_minutes: 60,
    sleep_type: 'nap', location: 'crib', sleep_quality: null, sleep_environment: null, wake_reason: null, notes: null,
  };
  mocks.getGrowth.mockResolvedValue([]);
  mocks.getSleep.mockResolvedValue([session]);
  mocks.updateSleep.mockResolvedValue(session);
  render(<ActivityFeed babyId="baby" refreshTrigger={0} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Edit sleep activity' }));
  fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
  await waitFor(() => expect(mocks.updateSleep).toHaveBeenCalledOnce());
  expect(mocks.updateSleep.mock.calls[0][1].sleep_quality).toBeUndefined();
});
