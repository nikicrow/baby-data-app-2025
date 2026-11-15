import { AxiosError } from 'axios';
import { expect, it } from 'vitest';
import { getApiErrorMessage } from './errors';

it('formats FastAPI validation errors as readable messages', () => {
  const error = new AxiosError('Request failed');
  Object.assign(error, { response: { data: { detail: [
    { loc: ['body', 'weight_kg'], msg: 'Input should be greater than 0' },
    { loc: ['body', 'measurement_date'], msg: 'Input should be a valid date' },
  ] } } });
  expect(getApiErrorMessage(error)).toBe('Input should be greater than 0; Input should be a valid date');
});

it('handles network errors and non-error thrown values', () => {
  expect(getApiErrorMessage(new Error('Network Error'))).toBe('Network Error');
  expect(getApiErrorMessage(null)).toBe('An unexpected error occurred');
});
