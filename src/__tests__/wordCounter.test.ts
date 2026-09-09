import { describe, it, expect } from 'vitest';
import {
  countWords,
  countGraphemes,
  countCharactersWithoutWhitespace,
  countSentences,
  countParagraphs,
  getSentences,
  getParagraphs,
  computeTextStatistics,
  computeWordFrequency,
  hashText,
  DEFAULT_SPEEDS,
} from '../utils/wordCounter';

describe('Word Counter Utilities', () => {
  describe('countWords', () => {
    it('returns 0 for empty or whitespace-only text', () => {
      expect(countWords('')).toBe(0);
      expect(countWords('   \n\t  ')).toBe(0);
    });

    it('counts standard English words', () => {
      expect(countWords('The quick brown fox jumps over the lazy dog.')).toBe(9);
    });

    it('handles contractions as single words', () => {
      expect(countWords("Don't worry, it's going to be fine. O'Connor said so.")).toBe(10);
    });

    it('handles hyphenated words as single words', () => {
      expect(countWords('State-of-the-art user-friendly technology.')).toBe(3);
    });

    it('handles numbers, currency, URLs, and emails as single units', () => {
      // 1(Visit) 2(https://aidetector.cx) 3(or) 4(email) 5(team@aidetector.cx) 6(for) 7($49.99) 8(today.) = 8 words
      expect(countWords('Visit https://aidetector.cx or email team@aidetector.cx for $49.99 today.')).toBe(8);
    });

    it('counts CJK characters accurately without spaces', () => {
      // 6 Chinese characters -> 6 words (人 工 智 能 技 术)
      expect(countWords('人工智能技术')).toBe(6);
      // Mixed English and Chinese: "AI" (1) + "人工智能" (4) = 5 words
      expect(countWords('AI 人工智能')).toBe(5);
    });

    it('handles emoji and does not treat pure emoji as words', () => {
      expect(countWords('Hello world! 👋 🚀')).toBe(2);
      expect(countWords('👨‍👩‍👧‍👦')).toBe(0);
    });
  });

  describe('countGraphemes & Characters', () => {
    it('counts standard characters with spaces', () => {
      expect(countGraphemes('Hello World')).toBe(11);
    });

    it('counts characters without whitespace', () => {
      expect(countCharactersWithoutWhitespace('Hello World')).toBe(10);
      expect(countCharactersWithoutWhitespace('  A B C  \n\t D  ')).toBe(4);
    });

    it('handles complex emoji with ZWJ and modifiers as single grapheme clusters', () => {
      // Family emoji with ZWJ sequence should be 1 grapheme
      expect(countGraphemes('👨‍👩‍👧‍👦')).toBe(1);
      // Emoji with skin tone modifier
      expect(countGraphemes('👍🏽')).toBe(1);
    });
  });

  describe('Sentence boundary detection', () => {
    it('splits simple sentences', () => {
      const text = 'First sentence. Second sentence! Third sentence?';
      expect(countSentences(text)).toBe(3);
    });

    it('handles abbreviations without false splits (Dr., Mr., e.g., i.e., U.S.A.)', () => {
      const text = 'Dr. Smith visited the U.S. hospital. He met with Prof. Jones at 3:00 p.m. to discuss the study.';
      const sentences = getSentences(text);
      expect(sentences.length).toBe(2);
      expect(sentences[0].text).toContain('Dr. Smith');
    });

    it('handles decimal numbers and ellipses without false splits', () => {
      const text = 'The price was $19.99 for version 2.5. We waited... and then left.';
      const sentences = getSentences(text);
      expect(sentences.length).toBe(2);
    });

    it('handles CJK punctuation (。！？)', () => {
      const text = '这是第一句话。这是第二句话！还有第三句吗？';
      expect(countSentences(text)).toBe(3);
    });

    it('evaluates writing limits correctly', () => {
      const shortSentence = 'This is short.';
      const longSentence = 'This sentence is intentionally made very long with many unnecessary words and repetitive phrasing in order to comfortably exceed the twenty-five word limit preset in our writing limits panel.';
      const text = `${shortSentence} ${longSentence}`;
      
      const sentences = getSentences(text, 25);
      expect(sentences.length).toBe(2);
      expect(sentences[0].exceedsLimit).toBe(false);
      expect(sentences[1].exceedsLimit).toBe(true);
    });
  });

  describe('Paragraph counting', () => {
    it('counts paragraphs separated by double newlines', () => {
      const text = 'First paragraph.\n\nSecond paragraph with multiple lines.\nStill second paragraph.\n\nThird paragraph.';
      expect(countParagraphs(text)).toBe(3);
    });

    it('evaluates paragraph writing limits', () => {
      const p1 = 'Short paragraph.';
      const p2 = Array(260).fill('word').join(' ');
      const text = `${p1}\n\n${p2}`;

      const paragraphs = getParagraphs(text, 250);
      expect(paragraphs.length).toBe(2);
      expect(paragraphs[0].exceedsLimit).toBe(false);
      expect(paragraphs[1].exceedsLimit).toBe(true);
    });
  });

  describe('computeTextStatistics', () => {
    it('returns zeroes for empty string', () => {
      const stats = computeTextStatistics('');
      expect(stats.words).toBe(0);
      expect(stats.sentences).toBe(0);
      expect(stats.paragraphs).toBe(0);
      expect(stats.readingTimeFormatted).toBe('0 sec');
    });

    it('computes accurate reading and speaking times with custom speeds', () => {
      // 450 words at 225 wpm reading = 120 sec -> 2 min, at 150 wpm speaking = 180 sec -> 3 min
      const text = Array(450).fill('word').join(' ');
      const stats = computeTextStatistics(text, {
        wordsPerMinuteReading: 225,
        wordsPerMinuteSpeaking: 150,
      });

      expect(stats.words).toBe(450);
      expect(stats.readingTimeSeconds).toBe(120);
      expect(stats.readingTimeFormatted).toBe('2 min');
      expect(stats.speakingTimeSeconds).toBe(180);
      expect(stats.speakingTimeFormatted).toBe('3 min');
    });

    it('formats exact reading and speaking times matching specification (152 words case)', () => {
      // 152 words:
      // Reading: round(152 / 225 * 60) = round(40.533) = 41 sec
      // Speaking: round(152 / 130 * 60) = round(70.1538) = 70 sec -> 1 min 10 sec
      const text = Array(152).fill('word').join(' ');
      const stats = computeTextStatistics(text, {
        wordsPerMinuteReading: 225,
        wordsPerMinuteSpeaking: 130,
      });

      expect(stats.words).toBe(152);
      expect(stats.readingTimeSeconds).toBe(41);
      expect(stats.readingTimeFormatted).toBe('41 sec');
      expect(stats.speakingTimeSeconds).toBe(70);
      expect(stats.speakingTimeFormatted).toBe('1 min 10 sec');
    });
  });

  describe('computeWordFrequency', () => {
    it('computes top frequencies and respects stop words filtering', () => {
      const text = 'The technology of the future is the technology of artificial intelligence and machine learning technology.';
      
      const withStopWords = computeWordFrequency(text, false);
      const withoutStopWords = computeWordFrequency(text, true);

      // 'technology' appears 3 times
      const techItem = withoutStopWords.find(i => i.word === 'technology');
      expect(techItem).toBeDefined();
      expect(techItem?.count).toBe(3);

      // 'the' should be filtered in withoutStopWords
      expect(withoutStopWords.some(i => i.word === 'the')).toBe(false);
      // 'the' should be present in withStopWords
      expect(withStopWords.some(i => i.word === 'the')).toBe(true);
    });
  });

  describe('hashText', () => {
    it('produces consistent hashes and detects changes', () => {
      const textA = 'Sample text for analysis.';
      const textB = 'Sample text for analysis.';
      const textC = 'Sample text for analysis edited.';

      expect(hashText(textA)).toBe(hashText(textB));
      expect(hashText(textA)).not.toBe(hashText(textC));
    });
  });

  describe('multilingual text and speed variations', () => {
    it('handles Arabic and multilingual text properly', () => {
      const arabic = 'مرحبا بالعالم العربي الجميل';
      const arabicStats = computeTextStatistics(arabic);
      expect(arabicStats.words).toBe(4);
      expect(arabicStats.charactersWithSpaces).toBe(arabic.length);

      // Spanish with accents
      const spanish = 'El rápido zorro marrón salta sobre el perro perezoso.';
      const spanishStats = computeTextStatistics(spanish);
      expect(spanishStats.words).toBe(9);
    });

    it('calculates reading and speaking times with custom speeds', () => {
      const words = Array(300).fill('word').join(' ');
      
      const customStats = computeTextStatistics(words, { wordsPerMinuteReading: 150, wordsPerMinuteSpeaking: 100 });
      expect(customStats.readingTimeSeconds).toBe(120);
      expect(customStats.readingTimeFormatted).toBe('2 min');
      expect(customStats.speakingTimeSeconds).toBe(180);
      expect(customStats.speakingTimeFormatted).toBe('3 min');
    });

    it('evaluates custom writing limits and exact boundaries', () => {
      const text = 'Short sentence. This is a much longer sentence that contains ten distinct words in total.';
      
      const sentences = getSentences(text, 8);
      const exceeded = sentences.filter(s => s.exceedsLimit);
      expect(exceeded.length).toBe(1);
      expect(exceeded[0].wordCount).toBe(13);
      expect(exceeded[0].text).toContain('much longer sentence');

      const generousSentences = getSentences(text, 20);
      const generousExceeded = generousSentences.filter(s => s.exceedsLimit);
      expect(generousExceeded.length).toBe(0);
    });
  });
});
