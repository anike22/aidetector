import { describe, it, expect } from 'vitest';
import {
  normalizeVideoAIProbability,
  getVideoProbabilityColorDetails
} from '@/components/detector/VideoAIProbabilityCupCard';

describe('Video AI Probability Cup Card normalization and color logic', () => {
  it('correctly normalizes 0-100 scale integers', () => {
    expect(normalizeVideoAIProbability(0)).toBe(0);
    expect(normalizeVideoAIProbability(25)).toBe(25);
    expect(normalizeVideoAIProbability(50)).toBe(50);
    expect(normalizeVideoAIProbability(75)).toBe(75);
    expect(normalizeVideoAIProbability(78)).toBe(78);
    expect(normalizeVideoAIProbability(100)).toBe(100);
  });

  it('correctly normalizes 0.0 - 1.0 floating point scale', () => {
    expect(normalizeVideoAIProbability(0.25)).toBe(25);
    expect(normalizeVideoAIProbability(0.5)).toBe(50);
    expect(normalizeVideoAIProbability(0.78)).toBe(78);
    expect(normalizeVideoAIProbability(1.0)).toBe(100);
  });

  it('preserves valid 0 as 0% rather than missing data', () => {
    expect(normalizeVideoAIProbability(0)).toBe(0);
    expect(normalizeVideoAIProbability(0.0)).toBe(0);
  });

  it('returns null for missing, null, undefined or NaN values', () => {
    expect(normalizeVideoAIProbability(undefined)).toBeNull();
    expect(normalizeVideoAIProbability(null)).toBeNull();
    expect(normalizeVideoAIProbability(NaN)).toBeNull();
  });

  it('clamps values outside 0-100 to boundaries', () => {
    expect(normalizeVideoAIProbability(-5)).toBe(0);
    expect(normalizeVideoAIProbability(125)).toBe(100);
  });

  it('assigns high probability color scheme for scores >= 70%', () => {
    const details = getVideoProbabilityColorDetails(78);
    expect(details.badgeVariant).toBe('destructive');
    expect(details.badgeText).toBe('High AI Probability');
  });

  it('assigns moderate probability color scheme for scores between 40% and 69%', () => {
    const details = getVideoProbabilityColorDetails(55);
    expect(details.badgeVariant).toBe('secondary');
    expect(details.badgeText).toBe('Moderate AI Probability');
  });

  it('assigns low probability color scheme for scores < 40%', () => {
    const details = getVideoProbabilityColorDetails(15);
    expect(details.badgeVariant).toBe('outline');
    expect(details.badgeText).toBe('Low AI Probability');
  });
});
