import { describe, it, expect } from 'vitest';
import { PROMO_FORMATS } from '@/components/promo/PromoVideoModal';
import { VIDEO_SCENES } from '@/components/promo/InteractiveVideoStage';

describe('Promotional Video Suite & Modal Integration', () => {
  it('contains all 5 required video format specifications', () => {
    expect(PROMO_FORMATS).toHaveLength(5);
    const ids = PROMO_FORMATS.map((f) => f.id);
    expect(ids).toContain('main_60s_captioned');
    expect(ids).toContain('main_60s_clean');
    expect(ids).toContain('vertical_30s');
    expect(ids).toContain('feed_30s');
    expect(ids).toContain('teaser_15s');
  });

  it('validates 16:9, 9:16, and 4:5 aspect ratios and resolutions', () => {
    const mainCap = PROMO_FORMATS.find((f) => f.id === 'main_60s_captioned')!;
    expect(mainCap.resolution).toBe('1920×1080');
    expect(mainCap.aspect).toBe('16:9');
    expect(mainCap.duration).toBe('60s');

    const vert = PROMO_FORMATS.find((f) => f.id === 'vertical_30s')!;
    expect(vert.resolution).toBe('1080×1920');
    expect(vert.aspect).toBe('9:16');
    expect(vert.duration).toBe('30s');

    const feed = PROMO_FORMATS.find((f) => f.id === 'feed_30s')!;
    expect(feed.resolution).toBe('1080×1350');
    expect(feed.aspect).toBe('4:5');
    expect(feed.duration).toBe('30s');

    const teaser = PROMO_FORMATS.find((f) => f.id === 'teaser_15s')!;
    expect(teaser.resolution).toBe('1080×1920');
    expect(teaser.duration).toBe('15s');
  });

  it('has valid public media file paths and subtitle tracks', () => {
    for (const fmt of PROMO_FORMATS) {
      expect(fmt.src).toMatch(/^\/promo\/.*\.mp4$/);
      expect(fmt.poster).toMatch(/^\/promo\/.*\.jpg$/);
      if (fmt.captionsSrc) {
        expect(fmt.captionsSrc).toBe('/promo/promo-captions.vtt');
      }
    }
  });

  it('defines 7 continuous, non-overlapping video scenes spanning exactly 60 seconds without unsupported claims', () => {
    expect(VIDEO_SCENES).toHaveLength(7);
    expect(VIDEO_SCENES[0].startTime).toBe(0.0);
    expect(VIDEO_SCENES[VIDEO_SCENES.length - 1].endTime).toBe(60.0);

    for (let i = 0; i < VIDEO_SCENES.length - 1; i++) {
      expect(VIDEO_SCENES[i].endTime).toBe(VIDEO_SCENES[i + 1].startTime);
      expect(VIDEO_SCENES[i].voiceoverText.length).toBeGreaterThan(10);
      expect(VIDEO_SCENES[i].title.length).toBeGreaterThan(3);

      // Verify absence of unsupported claims
      expect(VIDEO_SCENES[i].voiceoverText).not.toContain('98.7%');
      expect(VIDEO_SCENES[i].voiceoverText).not.toContain('<1.2%');
      expect(VIDEO_SCENES[i].voiceoverText).not.toContain('100% Zero-Retention');
    }
  });
});

