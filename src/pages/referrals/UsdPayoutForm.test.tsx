// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
const api = vi.hoisted(() => ({ getPayoutSetup: vi.fn(), requestPayout: vi.fn() }));
vi.mock('@/lib/referralApi', () => api);
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
import UsdPayoutForm from './UsdPayoutForm';
afterEach(() => { cleanup(); vi.clearAllMocks(); });
const setup = { available: 50, minimum: 50, hold_days: 30, eligible: true };
describe('USD affiliate payout submission', () => {
  it('does not collect bank details below the payable threshold', () => {
    render(<UsdPayoutForm setup={{ ...setup, available: 49, eligible: false }} onRequested={vi.fn()} />);
    expect(screen.queryByLabelText('Account holder name')).toBeNull();
    expect(screen.getByText(/Pending commissions and testing credits/)).toBeTruthy();
  });
  it('requires confirmation of a USD account', () => {
    render(<UsdPayoutForm setup={setup} onRequested={vi.fn()} />);
    expect((screen.getByRole('button') as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('checkbox'));
    expect((screen.getByRole('button') as HTMLButtonElement).disabled).toBe(false);
  });
  it('submits bank details and refreshes balances without retaining account fields', async () => {
    api.getPayoutSetup.mockResolvedValue(setup); api.requestPayout.mockResolvedValue({ id: 'test' });
    const refresh = vi.fn().mockResolvedValue(undefined);
    const { container } = render(<UsdPayoutForm setup={setup} onRequested={refresh} />);
    fireEvent.change(screen.getByLabelText('Account holder name'), { target: { value: 'Test Holder' } });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.submit(container.querySelector('form')!);
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
    expect(api.requestPayout).toHaveBeenCalledWith(expect.objectContaining({ account_holder: 'Test Holder', currency: 'USD', usd_confirmed: true }));
    expect((screen.getByLabelText('Account holder name') as HTMLInputElement).value).toBe('');
  });
  it('blocks submission when eligibility changes after the form was opened', async () => {
    api.getPayoutSetup.mockResolvedValue({ ...setup, eligible: false });
    const { container } = render(<UsdPayoutForm setup={setup} onRequested={vi.fn()} />);
    fireEvent.submit(container.querySelector('form')!);
    await waitFor(() => expect(screen.getByRole('status').textContent).toContain('at least $50.00'));
    expect(api.requestPayout).not.toHaveBeenCalled();
  });
});
