// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { LogActivity } from './LogActivity';

const mocks = vi.hoisted(() => ({ createGrowth: vi.fn(), getSleep: vi.fn() }));
vi.mock('../services/api', () => ({
  growthApi: { create: mocks.createGrowth },
  sleepApi: { getAll: mocks.getSleep }, feedingApi: {}, diaperApi: {},
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

afterEach(() => { cleanup(); vi.clearAllMocks(); });

it.each([undefined, '2026-10-10'])('submits a date-only growth measurement (custom date: %s)', async customDate => {
  mocks.getSleep.mockResolvedValue([]);
  mocks.createGrowth.mockResolvedValue({});
  const onAdded = vi.fn();
  render(<LogActivity babyId="baby" onActivityAdded={onAdded} />);
  fireEvent.click(screen.getByRole('button', { name: 'Growth' }));
  fireEvent.change(screen.getByLabelText('Weight (kg)'), { target: { value: '5.25' } });
  if (customDate) {
    fireEvent.click(screen.getByRole('button', { name: 'Log for different date?' }));
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: customDate } });
    expect(screen.queryByLabelText('Time')).not.toBeInTheDocument();
  }
  fireEvent.click(screen.getByRole('button', { name: 'Log Growth' }));
  await waitFor(() => expect(mocks.createGrowth).toHaveBeenCalledOnce());
  expect(mocks.createGrowth).toHaveBeenCalledWith(expect.objectContaining({
    baby_id: 'baby', weight_kg: 5.25, measurement_context: 'home',
    measurement_date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
  }));
  expect(onAdded).toHaveBeenCalledOnce();
  if (customDate) expect(mocks.createGrowth.mock.calls[0][0].measurement_date).toBe(customDate);
});
