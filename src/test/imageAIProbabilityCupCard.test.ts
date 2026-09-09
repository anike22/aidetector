import { describe, it, expect } from 'vitest';
import {
  normalizeAIProbability,
  getProbabilityColorDetails,
} from '@/components/detector/ImageAIProbabilityCupCard';

describe('Image AI Probability Water Cup Component & Utils', () => {
  describe('normalizeAIProbability', () => {
    it('normalizes 0-100 scale accurately', () => {
      expect(normalizeAIProbability(0)).toBe(0);
      expect(normalizeAIProbability(25)).toBe(25);
      expect(normalizeAIProbability(50)).toBe(50);
      expect(normalizeAIProbability(75)).toBe(75);
      expect(normalizeAIProbability(78)).toBe(78);
      expect(normalizeAIProbability(100)).toBe(100);
    });

    it('normalizes 0.0-1.0 float scale to 0-100 percentage', () => {
      expect(normalizeAIProbability(0.25)).toBe(25);
      expect(normalizeAIProbability(0.5)).toBe(50);
      expect(normalizeAIProbability(0.75)).toBe(75);
      expect(normalizeAIProbability(0.784)).toBe(78);
      expect(normalizeAIProbability(1.0)).toBe(100);
    });

    it('treats valid zero as 0, not missing data', () => {
      expect(normalizeAIProbability(0)).toBe(0);
    });

    it('returns null for missing, undefined, null or NaN', () => {
      expect(normalizeAIProbability(null)).toBeNull();
      expect(normalizeAIProbability(undefined)).toBeNull();
      expect(normalizeAIProbability(NaN)).toBeNull();
    });

    it('clamps values beyond 0 and 100', () => {
      expect(normalizeAIProbability(150)).toBe(100);
      expect(normalizeAIProbability(-10)).toBe(0);
    });
  });

  describe('getProbabilityColorDetails', () => {
    it('assigns high AI probability colors for score >= 70', () => {
      const high = getProbabilityColorDetails(78);
      expect(high.badgeText).toBe('High AI Probability');
      expect(high.badgeVariant).toBe('destructive');
      expect(high.waterGradientStart).toBe('#ef4444');
    });

    it('assigns moderate AI probability colors for 40 <= score < 70', () => {
      const mid = getProbabilityColorDetails(50);
      expect(mid.badgeText).toBe('Moderate AI Probability');
      expect(mid.badgeVariant).toBe('secondary');
      expect(mid.waterGradientStart).toBe('#f59e0b');
    });

    it('assigns low AI probability colors for score < 40', () => {
      const low = getProbabilityColorDetails(15);
      expect(low.badgeText).toBe('Low AI Probability');
      expect(low.badgeVariant).toBe('outline');
      expect(low.waterGradientStart).toBe('#10b981');
    });
  });
});
