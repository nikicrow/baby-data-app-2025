// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import App from './App';

const mocks = vi.hoisted(() => ({
  mounted: vi.fn(),
  getBabies: vi.fn(),
}));
vi.mock('./services/api', () => ({ babyApi: { getAll: mocks.getBabies } }));
vi.mock('sonner@2.0.3', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('./router', async () => {
  const { useEffect } = await import('react');
  return { AppRoutes: () => {
    useEffect(() => { mocks.mounted(); }, []);
    return <input aria-label="Activity draft" />;
  } };
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

it.each([390, 1440])('mounts one page at width %s and preserves its draft across resizing', async width => {
  const originalWidth = window.innerWidth;
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
  mocks.getBabies.mockResolvedValue([{
    id: 'baby', name: 'Test baby', date_of_birth: '2026-10-01', is_active: true,
  }]);
  try {
    render(<MemoryRouter initialEntries={['/logactivity']}><App /></MemoryRouter>);
    const draft = await screen.findByRole('textbox', { name: 'Activity draft' });
    expect(screen.getAllByRole('textbox', { name: 'Activity draft' })).toHaveLength(1);
    expect(mocks.mounted).toHaveBeenCalledTimes(1);
    expect(mocks.getBabies).toHaveBeenCalledTimes(1);
    fireEvent.change(draft, { target: { value: 'A draft activity' } });
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: width === 390 ? 1440 : 390 });
    fireEvent(window, new Event('resize'));
    expect(screen.getByRole('textbox', { name: 'Activity draft' })).toHaveValue('A draft activity');
    expect(mocks.mounted).toHaveBeenCalledTimes(1);
  } finally {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalWidth });
  }
});
