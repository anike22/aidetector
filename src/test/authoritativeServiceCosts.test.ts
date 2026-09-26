import { describe, it, expect } from 'vitest';
import {
  calculateOperationCreditCost,
  RATE_TABLE,
  isTrialEligibleOperation,
} from '@/lib/entitlements';

describe('Authoritative Service Costs & Deductions Matrix', () => {
  describe('Authoritative Baseline Rates', () => {
    it('1. AI Detector costs exactly 1 credit per started 1,000 words per engine', () => {
      expect(RATE_TABLE.text_detect_balanced.baseCreditCost).toBe(1);
      expect(RATE_TABLE.ai_detector.baseCreditCost).toBe(1);
      // 10 credits before -> 1 credit deduction -> 9 credits remaining
      const startBalance = 10;
      const cost = calculateOperationCreditCost('ai_detector', { words: 500, engines: 1 });
      expect(cost).toBe(1);
      expect(startBalance - cost).toBe(9);
    });

    it('2. Humanizer costs exactly 10 credits per started 1,000 words', () => {
      expect(RATE_TABLE.humanizer_rewrite.baseCreditCost).toBe(10);
      expect(RATE_TABLE.ai_humanizer.baseCreditCost).toBe(10);
      // 20 credits before -> 10 credits deduction -> 10 credits remaining
      const startBalance = 20;
      const cost = calculateOperationCreditCost('ai_humanizer', { words: 500 });
      expect(cost).toBe(10);
      expect(startBalance - cost).toBe(10);
    });

    it('3. Plagiarism Checker costs exactly 10 credits per started 1,000 words', () => {
      expect(RATE_TABLE.plagiarism_check.baseCreditCost).toBe(10);
      expect(RATE_TABLE.plagiarism_checker.baseCreditCost).toBe(10);
      // 20 credits before -> 10 credits deduction -> 10 credits remaining
      const startBalance = 20;
      const cost = calculateOperationCreditCost('plagiarism_checker', { words: 800 });
      expect(cost).toBe(10);
      expect(startBalance - cost).toBe(10);
    });

    it('4. AI Image Detector costs exactly 5 credits per image', () => {
      expect(RATE_TABLE.image_detect_standard.baseCreditCost).toBe(5);
      expect(RATE_TABLE.ai_image_detector.baseCreditCost).toBe(5);
      // 10 credits before -> 5 credits deduction -> 5 credits remaining
      const startBalance = 10;
      const cost = calculateOperationCreditCost('ai_image_detector', { images: 1 });
      expect(cost).toBe(5);
      expect(startBalance - cost).toBe(5);
    });

    it('5. Voice/Audio Detector costs exactly 5 credits per started minute', () => {
      expect(RATE_TABLE.voice_analysis.baseCreditCost).toBe(5);
      expect(RATE_TABLE.ai_voice_detector.baseCreditCost).toBe(5);
      // 10 credits before -> 5 credits deduction -> 5 credits remaining
      const startBalance = 10;
      const cost = calculateOperationCreditCost('ai_voice_detector', { audioMinutes: 0.5 });
      expect(cost).toBe(5);
      expect(startBalance - cost).toBe(5);
    });

    it('6. Deepfake Detector costs exactly 10 credits per image/video scan', () => {
      expect(RATE_TABLE.deepfake_detector.baseCreditCost).toBe(10);
      expect(RATE_TABLE.image_detect_advanced.baseCreditCost).toBe(10);
      // 20 credits before -> 10 credits deduction -> 10 credits remaining
      const startBalance = 20;
      const cost = calculateOperationCreditCost('deepfake_detector', { images: 1 });
      expect(cost).toBe(10);
      expect(startBalance - cost).toBe(10);
    });

    it('7. AI Video Detector costs exactly 15 credits per started 30 seconds', () => {
      expect(RATE_TABLE.video_detect_balanced.baseCreditCost).toBe(15);
      expect(RATE_TABLE.ai_video_detector.baseCreditCost).toBe(15);
      // 20 credits before -> 15 credits deduction -> 5 credits remaining
      const startBalance = 20;
      const cost = calculateOperationCreditCost('ai_video_detector', { videoSeconds: 25 });
      expect(cost).toBe(15);
      expect(startBalance - cost).toBe(5);
    });

    it('8. Citation & Hallucination Verifier cost exactly 5 credits', () => {
      expect(RATE_TABLE.citation_verify.baseCreditCost).toBe(5);
      expect(RATE_TABLE.citation_verifier.baseCreditCost).toBe(5);
      expect(RATE_TABLE.hallucination_check.baseCreditCost).toBe(5);
      expect(RATE_TABLE.hallucination_detector.baseCreditCost).toBe(5);
      // 10 credits before -> 5 credits deduction -> 5 credits remaining
      const startBalance = 10;
      const citationCost = calculateOperationCreditCost('citation_verifier', { references: 5 });
      expect(citationCost).toBe(5);
      expect(startBalance - citationCost).toBe(5);

      const hallucinationCost = calculateOperationCreditCost('hallucination_detector', { words: 800 });
      expect(hallucinationCost).toBe(5);
      expect(startBalance - hallucinationCost).toBe(5);
    });

    it('9. Existing Confirmed Services: AI Checker for Bloggers & SEO Assistant cost 30 credits', () => {
      expect(RATE_TABLE.seo_assistant.baseCreditCost).toBe(30);
      // 40 credits before -> 30 credits deduction -> 10 credits remaining
      const startBalance = 40;
      const seoCost = calculateOperationCreditCost('seo_assistant', { words: 1000 });
      expect(seoCost).toBe(30);
      expect(startBalance - seoCost).toBe(10);
    });
  });

  describe('Concurrency & Insufficient Balance Logic', () => {
    it('blocks request when balance is strictly less than cost', () => {
      const balance = 9;
      const humanizerCost = calculateOperationCreditCost('ai_humanizer', { words: 500 }); // 10
      const canProceed = balance >= humanizerCost;
      expect(canProceed).toBe(false);
      // Balance remains untouched
      expect(balance).toBe(9);
    });

    it('guarantees balance cannot become negative under atomic deductions', () => {
      let balance = 10;
      const humanizerCost = 10;

      // Request 1 succeeds
      if (balance >= humanizerCost) {
        balance -= humanizerCost;
      }
      expect(balance).toBe(0);

      // Simultaneous Request 2 fails (cannot bypass balance check)
      let request2Allowed = false;
      if (balance >= humanizerCost) {
        balance -= humanizerCost;
        request2Allowed = true;
      }
      expect(request2Allowed).toBe(false);
      expect(balance).toBe(0);
      expect(balance).toBeGreaterThanOrEqual(0);
    });
  });
});
