import { describe, it, expect } from 'vitest';
import { YOUTUBE_METADATA } from '@/components/promo/YouTubeSchemaDrawer';

describe('YouTube Video Metadata & Structured Schema', () => {
  it('provides 3 high-converting title options', () => {
    expect(YOUTUBE_METADATA.titles.length).toBe(3);
    for (const title of YOUTUBE_METADATA.titles) {
      expect(title).toContain('AIDetector.cx');
    }
  });

  it('includes complete description with timestamps and links', () => {
    expect(YOUTUBE_METADATA.description).toContain('https://aidetector.cx');
    expect(YOUTUBE_METADATA.description).toContain('0:00');
    expect(YOUTUBE_METADATA.description).toContain('0:54');
    expect(YOUTUBE_METADATA.description).toContain('#AIDetector');
  });

  it('provides exact YouTube timestamps starting at 0:00', () => {
    expect(YOUTUBE_METADATA.timestamps).toMatch(/^0:00/);
    expect(YOUTUBE_METADATA.timestamps.split('\n').length).toBe(7);
  });

  it('validates Schema.org VideoObject JSON-LD structure', () => {
    const schema = YOUTUBE_METADATA.schemaJsonLd;
    expect(schema['@context']).toBe('https://schema.org');
    expect(schema['@type']).toBe('VideoObject');
    expect(schema.duration).toBe('PT1M');
    expect(schema.hasPart).toHaveLength(7);

    for (const clip of schema.hasPart) {
      expect(clip['@type']).toBe('Clip');
      expect(clip.startOffset).toBeDefined();
      expect(clip.endOffset).toBeDefined();
      expect(clip.url).toMatch(/#t=/);
    }
  });
});
