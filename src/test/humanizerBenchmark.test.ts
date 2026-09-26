import { describe, it, expect } from 'vitest';
import {
  extractProtectedEntities,
  validateRewriteIntegrity,
  calculateSubstantiveSummary,
  computeSha256
} from '@/lib/humanizerPipeline';

describe('Humanizer Engine Phase 4 Comprehensive Benchmark Evaluation', () => {
  const BENCHMARK_SAMPLES = [
    {
      genre: 'Academic',
      language: 'English',
      source: 'Recent advancements in deep learning models (Vaswani et al., 2017) have yielded a 34.5% improvement in translation benchmark accuracy across 12 languages. However, the computational complexity remains O(N^2), limiting scalability on edge devices.',
      rewrite: 'As shown by Vaswani et al. (2017), deep learning advancements boosted multilingual translation accuracy by 34.5% across 12 languages. Nonetheless, the O(N^2) computational overhead still presents substantial deployment hurdles on edge hardware.',
      lockedTerms: ['O(N^2)', 'Vaswani et al., 2017']
    },
    {
      genre: 'Technical / Code',
      language: 'English',
      source: 'To deploy the Edge Function, run `supabase functions deploy humanizer-pipeline --no-verify-jwt`. Ensure that port 54321 is accessible and the API key is stored in `.env.local`.',
      rewrite: 'Deploy your Edge Function with `supabase functions deploy humanizer-pipeline --no-verify-jwt`. Double-check that port 54321 is open and keep the API key safely inside `.env.local`.',
      lockedTerms: ['`supabase functions deploy humanizer-pipeline --no-verify-jwt`', '.env.local']
    },
    {
      genre: 'Multilingual / Spanish',
      language: 'Spanish',
      source: 'El sistema procesó más de 10,000 transacciones el 15 de marzo de 2024 con una latencia de 120ms sin registrar ninguna falla.',
      rewrite: 'Durante el 15 de marzo de 2024, la plataforma gestionó más de 10,000 transacciones con 120ms de latencia promedio, manteniendo una disponibilidad absoluta.',
      lockedTerms: ['15 de marzo de 2024', '10,000 transacciones']
    },
    {
      genre: 'Multilingual / French',
      language: 'French',
      source: 'Selon le rapport annuel de 2023, le chiffre d\'affaires a progressé de 18.5% pour atteindre 4.2 millions d\'euros.',
      rewrite: 'D\'après le bilan annuel de 2023, les revenus ont enregistré une hausse de 18.5%, totalisant 4.2 millions d\'euros.',
      lockedTerms: ['2023', '18.5%', '4.2 millions d\'euros']
    },
    {
      genre: 'Multilingual / German',
      language: 'German',
      source: 'Die neue API-Version 2.4 reduziert die Latenzzeit um 40% und unterstützt bis zu 500 gleichzeitige Anfragen pro Sekunde.',
      rewrite: 'Mit der neuen API-Version 2.4 sinkt die Latenz um 40%, während das System problemlos bis zu 500 simultane Anfragen pro Sekunde verarbeitet.',
      lockedTerms: ['API-Version 2.4', '40%', '500']
    },
    {
      genre: 'Long-Document Markdown',
      language: 'English',
      source: `## Section 1: Introduction\nAI writing often displays uniform burstiness and repetitive syntax.\n\n### Key Metrics\n- Metric A: 95.2%\n- Metric B: 120ms\n\nContact: dev@aidetector.cx`,
      rewrite: `## Section 1: Introduction\nMachine-generated copy frequently suffers from flat sentence rhythm and mechanical phrasing.\n\n### Key Metrics\n- Metric A: 95.2%\n- Metric B: 120ms\n\nContact: dev@aidetector.cx`,
      lockedTerms: ['dev@aidetector.cx']
    }
  ];

  it('passes preservation, factual integrity, and formatting checks across all benchmark samples', async () => {
    for (const sample of BENCHMARK_SAMPLES) {
      const entities = extractProtectedEntities(sample.source, sample.lockedTerms);
      const report = validateRewriteIntegrity(sample.source, sample.rewrite, entities);

      expect(report.isValid).toBe(true);
      expect(report.omissionsCount).toBe(0);
      expect(report.formattingPreserved).toBe(true);
      expect(report.negationIntegrity).toBe(true);

      const summary = calculateSubstantiveSummary(sample.source, sample.rewrite, entities);
      expect(summary.sentences_modified).toBeGreaterThan(0);
      expect(summary.protected_entities_preserved).toBe(entities.length);

      const hash = await computeSha256(sample.rewrite);
      expect(hash.length).toBe(64);
    }
  });

  it('detects and flags truncated or broken rewrites in benchmark tests', () => {
    const longSource = 'First paragraph explaining context.\n\nSecond paragraph explaining implementation.\n\nThird paragraph summarizing results.';
    const truncatedRewrite = 'First paragraph explaining context.';

    const report = validateRewriteIntegrity(longSource, truncatedRewrite, []);
    expect(report.isValid).toBe(false);
    expect(report.issues.some(i => i.toLowerCase().includes('truncat') || i.toLowerCase().includes('paragraph'))).toBe(true);
  });
});
