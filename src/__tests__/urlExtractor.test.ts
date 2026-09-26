import { describe, it, expect } from 'vitest';
import {
  validateWebUrl,
  extractCleanArticleTextFromHtml,
} from '../utils/urlExtractor';

describe('Safe Web URL Extractor', () => {
  describe('URL validation & SSRF protection', () => {
    it('accepts valid public HTTP/HTTPS URLs', () => {
      const res1 = validateWebUrl('https://example.com/article/ai-research');
      expect(res1.valid).toBe(true);
      expect(res1.cleanUrl).toBe('https://example.com/article/ai-research');

      const res2 = validateWebUrl('http://techblog.org/news?id=123');
      expect(res2.valid).toBe(true);

      const res3 = validateWebUrl('nytimes.com/world/science.html');
      expect(res3.valid).toBe(true);
      expect(res3.cleanUrl).toBe('https://nytimes.com/world/science.html');
    });

    it('rejects empty or malformed URLs', () => {
      expect(validateWebUrl('').valid).toBe(false);
      expect(validateWebUrl('   ').valid).toBe(false);
      expect(validateWebUrl('ftp://example.com').valid).toBe(false);
    });

    it('blocks internal/private IPs and localhost for SSRF prevention', () => {
      expect(validateWebUrl('http://localhost:3000/api').valid).toBe(false);
      expect(validateWebUrl('http://127.0.0.1/admin').valid).toBe(false);
      expect(validateWebUrl('http://10.0.0.1/secret').valid).toBe(false);
      expect(validateWebUrl('http://192.168.1.1/router').valid).toBe(false);
      expect(validateWebUrl('http://172.16.0.5/dashboard').valid).toBe(false);
      expect(validateWebUrl('http://169.254.169.254/latest/meta-data').valid).toBe(false);
      expect(validateWebUrl('http://service.local/data').valid).toBe(false);
      expect(validateWebUrl('http://server.internal/metrics').valid).toBe(false);
    });
  });

  describe('HTML text extraction and boilerplate stripping', () => {
    it('strips scripts, styles, navigation, headers, and footers', () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Sample News</title>
            <style>body { font-size: 14px; }</style>
            <script>console.log("analytics");</script>
          </head>
          <body>
            <header><nav><a href="/">Home</a><a href="/about">About</a></nav></header>
            <article>
              <h1>Breakthrough in Grid Battery Storage Technology</h1>
              <p>Utility-scale battery storage grew by 125 percent across North America in 2024, driven primarily by falling lithium-ion battery costs.</p>
              <p>According to the Energy Information Administration, grid operators deployed 10.4 gigawatts of new capacity, surpassing natural gas peaker additions for the second consecutive year.</p>
            </article>
            <footer><p>&copy; 2026 TechMedia Corp. All rights reserved.</p></footer>
          </body>
        </html>
      `;

      const text = extractCleanArticleTextFromHtml(html);
      expect(text).toContain('Breakthrough in Grid Battery Storage Technology');
      expect(text).toContain('Utility-scale battery storage grew by 125 percent');
      expect(text).toContain('10.4 gigawatts');
      expect(text).not.toContain('console.log');
      expect(text).not.toContain('font-size: 14px');
      expect(text).not.toContain('Home');
      expect(text).not.toContain('All rights reserved');
    });

    it('decodes HTML entities properly', () => {
      const html = '<p>The company&#39;s revenue grew &amp; exceeded expectations &mdash; reaching &gt; $50M.</p>';
      const text = extractCleanArticleTextFromHtml(html);
      expect(text).toContain("The company's revenue grew & exceeded expectations — reaching > $50M.");
    });
  });
});
