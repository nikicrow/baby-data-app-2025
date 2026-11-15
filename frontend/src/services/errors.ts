import { isAxiosError } from 'axios';

export function getApiErrorMessage(error: unknown): string {
  if (isAxiosError<{ detail?: unknown }>(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      const messages = detail.flatMap((entry: unknown) =>
        typeof entry === 'object' && entry !== null && 'msg' in entry && typeof entry.msg === 'string'
          ? [entry.msg] : []);
      if (messages.length) return messages.join('; ');
    }
  }
  return error instanceof Error ? error.message : 'An unexpected error occurred';
}
