// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import AffiliateHubPage from '@/pages/affiliate/AffiliateHubPage';

const auth = vi.hoisted(() => ({ user: null as null | { id: string } }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => auth }));

function Destination() {
  const location = useLocation();
  return <div data-testid="destination">{location.pathname}{location.search}|{location.state?.signupEmail}</div>;
}

afterEach(() => { cleanup(); auth.user = null; });

describe('Affiliate Hub signup navigation', () => {
  it('takes guests to signup with their email and affiliate return destination', () => {
    render(<MemoryRouter initialEntries={['/affiliate-hub']}><Routes>
      <Route path="/affiliate-hub" element={<AffiliateHubPage />} />
      <Route path="/signup" element={<Destination />} />
    </Routes></MemoryRouter>);
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'partner@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Join Now' }));
    expect(screen.getByTestId('destination').textContent).toBe('/signup?returnTo=%2Faffiliates%2Fdashboard|partner@example.com');
  });

  it('takes existing signed-in users directly to their affiliate application', () => {
    auth.user = { id: 'existing-user' };
    render(<MemoryRouter initialEntries={['/affiliate-hub']}><Routes>
      <Route path="/affiliate-hub" element={<AffiliateHubPage />} />
      <Route path="/affiliates/dashboard" element={<Destination />} />
    </Routes></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: 'Join Now' }));
    expect(screen.getByTestId('destination').textContent).toBe('/affiliates/dashboard|');
  });
});
