import { describe, it, expect } from 'vitest';
import {
  AI_DIRECTORY_PRODUCTS,
  getOpenWeightProducts,
  getOfflineHostingProducts,
  getAvailableLicenseTypes,
  getAvailableDeploymentModes,
  getDirectoryProductByIdOrSlug,
  parseVsPairSlug,
} from '@/data/aiDirectoryData';

describe('AI Tools Directory Phase 3: Open Weights, Licensing & Developer Submissions', () => {
  it('should verify open-weight model metadata and licensing architecture', () => {
    const openWeightTools = getOpenWeightProducts();
    expect(openWeightTools.length).toBeGreaterThanOrEqual(4);

    const ollama = getDirectoryProductByIdOrSlug('ollama');
    expect(ollama).toBeDefined();
    expect(ollama?.isOpenWeight).toBe(true);
    expect(ollama?.licenseType).toBe('MIT');
    expect(ollama?.supportsOfflineHosting).toBe(true);
    expect(ollama?.deploymentOptions).toContain('Local / Self-Hosted');
    expect(ollama?.deploymentOptions).toContain('Air-Gapped / On-Premise');

    const deepseek = getDirectoryProductByIdOrSlug('deepseek');
    expect(deepseek).toBeDefined();
    expect(deepseek?.isOpenWeight).toBe(true);
    expect(deepseek?.licenseType).toBe('DeepSeek Open License');
    expect(deepseek?.supportsOfflineHosting).toBe(true);

    const mistral = getDirectoryProductByIdOrSlug('mistral-ai');
    expect(mistral).toBeDefined();
    expect(mistral?.isOpenWeight).toBe(true);
    expect(mistral?.licenseType).toBe('Apache 2.0');
  });

  it('should verify offline and air-gapped deployment options across catalog', () => {
    const offlineTools = getOfflineHostingProducts();
    expect(offlineTools.length).toBeGreaterThanOrEqual(5);

    const whisper = getDirectoryProductByIdOrSlug('whisper');
    expect(whisper).toBeDefined();
    expect(whisper?.supportsOfflineHosting).toBe(true);
    expect(whisper?.licenseType).toBe('MIT');
    expect(whisper?.deploymentOptions).toContain('Local / Self-Hosted');

    const lmStudio = getDirectoryProductByIdOrSlug('lm-studio');
    expect(lmStudio).toBeDefined();
    expect(lmStudio?.supportsOfflineHosting).toBe(true);
    expect(lmStudio?.isOpenWeight).toBe(true);
  });

  it('should return available license types and deployment modes helper functions', () => {
    const licenses = getAvailableLicenseTypes();
    expect(licenses).toContain('MIT');
    expect(licenses).toContain('Apache 2.0');
    expect(licenses).toContain('Proprietary');
    expect(licenses).toContain('DeepSeek Open License');

    const modes = getAvailableDeploymentModes();
    expect(modes).toContain('Cloud SaaS');
    expect(modes).toContain('Local / Self-Hosted');
    expect(modes).toContain('Air-Gapped / On-Premise');
  });

  it('should support pairwise comparisons between open-weight tools', () => {
    const pair = parseVsPairSlug('ollama-vs-lm-studio');
    expect(pair.product1?.id).toBe('ollama');
    expect(pair.product2?.id).toBe('lm-studio');
    expect(pair.product1?.isOpenWeight).toBe(true);
    expect(pair.product2?.isOpenWeight).toBe(true);
  });

  it('should verify every product in catalog has non-empty deployment options or licensing', () => {
    AI_DIRECTORY_PRODUCTS.forEach(p => {
      expect(p.id).toBeDefined();
      expect(p.name).toBeDefined();
      expect(typeof p.isOpenWeight).toBe('boolean');
      expect(typeof p.supportsOfflineHosting).toBe('boolean');
      expect(p.licenseType).toBeDefined();
      expect(Array.isArray(p.deploymentOptions)).toBe(true);
      expect(p.deploymentOptions?.length).toBeGreaterThan(0);
    });
  });
});
