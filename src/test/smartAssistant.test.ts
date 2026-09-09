import { describe, it, expect } from 'vitest';
import {
  resolveAssistantContext,
  buildAssistantGreeting,
  answerAssistantQuery,
} from '@/components/personalization/SmartAssistant';
import { routes } from '@/routes';

describe('AI Assistant & Floating Widget Accuracy Tests', () => {
  describe('1. Context Resolution Accuracy', () => {
    it('accurately classifies root and detector paths', () => {
      expect(resolveAssistantContext('/')).toBe('detector_text');
      expect(resolveAssistantContext('/detector')).toBe('detector_text');
    });

    it('accurately classifies AI Image and Video Detector paths', () => {
      expect(resolveAssistantContext('/ai-image-detector')).toBe('detector_image');
      expect(resolveAssistantContext('/image-detector')).toBe('detector_image');
      expect(resolveAssistantContext('/ai-video-detector')).toBe('detector_video');
      expect(resolveAssistantContext('/video-detector')).toBe('detector_video');
      expect(resolveAssistantContext('/studies/authentic-video-false-positives')).toBe('detector_video');
    });

    it('accurately classifies Humanizer, Summarizer, SEO, and Word Counter', () => {
      expect(resolveAssistantContext('/humanizer')).toBe('humanizer');
      expect(resolveAssistantContext('/humanizer/history')).toBe('humanizer');
      expect(resolveAssistantContext('/ai-summarizer')).toBe('summarizer');
      expect(resolveAssistantContext('/seo-assistant')).toBe('seo');
      expect(resolveAssistantContext('/seo-dashboard')).toBe('seo');
      expect(resolveAssistantContext('/plagiarism-checker')).toBe('plagiarism');
      expect(resolveAssistantContext('/word-counter')).toBe('word_counter');
    });

    it('accurately classifies Verified Authorship, Pricing, API, and Security', () => {
      expect(resolveAssistantContext('/verified-authorship/register')).toBe('authorship');
      expect(resolveAssistantContext('/verify/ABC-123')).toBe('authorship');
      expect(resolveAssistantContext('/pricing')).toBe('pricing');
      expect(resolveAssistantContext('/api/docs')).toBe('api');
      expect(resolveAssistantContext('/security')).toBe('security');
    });
  });

  describe('2. Contextual Greeting Accuracy', () => {
    it('produces relevant greeting text and chips for Text Detector', () => {
      const greeting = buildAssistantGreeting('detector_text', undefined, undefined, null);
      expect(greeting.text).toContain('98.7% accurate');
      expect(greeting.text).toContain('perplexity and burstiness');
      expect(greeting.actions.some((a) => a.to === '/humanizer')).toBe(true);
      expect(greeting.quickChips.length).toBeGreaterThanOrEqual(3);
    });

    it('produces relevant greeting text and chips for Video & Live Call', () => {
      const greeting = buildAssistantGreeting('detector_video', undefined, undefined, null);
      expect(greeting.text).toContain('Live-Call Deepfake Protection');
      expect(greeting.quickChips).toContain('How does live call monitoring work?');
    });

    it('produces relevant greeting text for AI Summarizer', () => {
      const greeting = buildAssistantGreeting('summarizer', undefined, undefined, null);
      expect(greeting.text).toContain('AI Summarizer');
      expect(greeting.text).toContain('YouTube');
    });
  });

  describe('3. Knowledge Base Query Answers & Accuracy', () => {
    it('accurately explains AI Detection score brackets, perplexity, and burstiness', () => {
      const res = answerAssistantQuery('how do I interpret my score and perplexity?', 'detector_text');
      expect(res.text).toContain('0%–25%: Highly Human');
      expect(res.text).toContain('66%–100%: High AI Probability');
      expect(res.text).toContain('98.7% precision');
      expect(res.actions.some((a) => a.to === '/humanizer')).toBe(true);
    });

    it('accurately explains Humanizer capabilities and workflow', () => {
      const res = answerAssistantQuery('how does humanizer bypass detection?', 'humanizer');
      expect(res.text).toContain('Humanizer');
      expect(res.text).toContain('natural syntactic variety');
      expect(res.actions.some((a) => a.to === '/humanizer')).toBe(true);
    });

    it('accurately explains Live Call deepfake monitoring without camera lock', () => {
      const res = answerAssistantQuery('how does live call zoom protection work?', 'detector_video');
      expect(res.text).toContain('Live-Call Deepfake Protection');
      expect(res.text).toContain('2x2 Participant Grid ROI');
      expect(res.text).toContain('getDisplayMedia');
    });

    it('accurately explains trial checks, credit consumption rates, and pricing', () => {
      const res = answerAssistantQuery('how many free trial checks and what are credit costs?', 'pricing');
      expect(res.text).toContain('5 one-time introductory trial checks');
      expect(res.text).toContain('1 credit per 250 words');
      expect(res.text).toContain('3 credits per 1,000 words');
      expect(res.text).toContain('5 credits per image or minute of video');
      expect(res.actions.some((a) => a.to === '/pricing')).toBe(true);
    });

    it('accurately explains Zero-Retention privacy policy', () => {
      const res = answerAssistantQuery('is my data stored or used for training?', 'security');
      expect(res.text).toContain('Zero-Retention Policy');
      expect(res.text).toContain('volatile memory');
      expect(res.actions.some((a) => a.to === '/privacy')).toBe(true);
    });

    it('accurately explains supported LLM models', () => {
      const res = answerAssistantQuery('what models do you detect like chatgpt or claude?', 'general');
      expect(res.text).toContain('GPT-5');
      expect(res.text).toContain('Claude 3.5 Sonnet');
      expect(res.text).toContain('Gemini');
      expect(res.text).toContain('DeepSeek-R1');
    });

    it('accurately explains Verified Authorship certificates', () => {
      const res = answerAssistantQuery('how do i get a copyright certificate?', 'authorship');
      expect(res.text).toContain('cryptographic timestamp');
      expect(res.text).toContain('tracking code');
      expect(res.actions.some((a) => a.to === '/verified-authorship/register')).toBe(true);
    });
  });

  describe('4. Link Route Validation', () => {
    it('verifies that all action link URLs correspond to valid routes in the app', () => {
      const testQueries = [
        'score',
        'humanize',
        'live call zoom',
        'summarize',
        'credits and pricing',
        'privacy policy',
        'authorship certificate',
        'plagiarism check',
        'seo ranking',
        'api documentation',
        'contact help',
        'recommend next tool',
      ];

      const validPaths = new Set(
        routes.map((r) => r.path.split('/:')[0]) // base paths without params
      );
      validPaths.add('/');

      for (const q of testQueries) {
        const res = answerAssistantQuery(q, 'general');
        for (const action of res.actions) {
          if (action.to) {
            const basePath = action.to.split('?')[0].split('#')[0];
            const isKnown =
              validPaths.has(basePath) ||
              routes.some((r) => {
                if (r.path === basePath) return true;
                const pattern = r.path.replace(/:[a-zA-Z]+/g, '[^/]+');
                return new RegExp(`^${pattern}$`).test(basePath);
              });
            expect(isKnown, `Link ${action.to} must match a registered route`).toBe(true);
          }
        }
      }
    });
  });
});
