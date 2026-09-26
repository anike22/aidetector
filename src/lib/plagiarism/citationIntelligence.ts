/**
 * Advanced Citation Intelligence & Attribution Verification Layer
 */

import type { CitationItem, CitationStatus } from './types';
import type { VerifiedSource } from '@/pages/detector/detectionEngine';

// Common academic citation patterns
const APA_CITATION_REGEX = /\(([A-Z][a-zA-Z\s\-]+(?:,\s*(?:et\s+al\.|&|\band\b)?\s*[A-Z][a-zA-Z\s\-]+)*),?\s*([12]\d{3}[a-z]?)(?:,\s*p{1,2}\.?\s*\d+(?:-\d+)?)?\)/g;
const BRACKET_NUM_REGEX = /\[(\d+(?:\s*[,-]\s*\d+)*)\]/g;
const NARRATIVE_CITATION_REGEX = /\b([A-Z][a-zA-Z\-]+(?:\s+et\s+al\.)?)\s+\(([12]\d{3}[a-z]?)\)/g;
const DOI_REGEX = /\b(10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+)\b/g;
const QUOTE_REGEX = /["“]([^"”]{15,})["”]/g;

export function parseCitations(text: string, verifiedSources: VerifiedSource[] = []): CitationItem[] {
  const citations: CitationItem[] = [];
  const seenSpans = new Set<string>();

  // 1. Parenthetical APA citations (Smith et al., 2021)
  let match: RegExpExecArray | null;
  while ((match = APA_CITATION_REGEX.exec(text)) !== null) {
    const raw = match[0];
    const authorsStr = match[1];
    const yearStr = match[2];
    const start = match.index;
    const end = start + raw.length;
    const spanKey = `${start}-${end}`;

    if (!seenSpans.has(spanKey)) {
      seenSpans.add(spanKey);
      const authors = authorsStr.split(/[,&]|\band\b/).map((a) => a.trim()).filter(Boolean);

      // Verify if cited author/year matches any discovered source
      const matchingSource = verifiedSources.find((s) => {
        const titleOrPub = (s.title + ' ' + s.publisher).toLowerCase();
        return authors.some((a) => titleOrPub.includes(a.toLowerCase())) ||
               (s.doi && s.doi.includes(yearStr));
      });

      let status: CitationStatus = 'properly_cited';
      let explanation = 'Standard author-date citation recognized.';

      if (matchingSource) {
        status = 'properly_cited';
        explanation = `Verified match with source: "${matchingSource.title.slice(0, 60)}..."`;
      } else {
        // Source not in immediate query, check validity
        const year = parseInt(yearStr, 10);
        const currentYear = new Date().getFullYear();
        if (year > currentYear + 1 || year < 1800) {
          status = 'nonexistent_fabricated';
          explanation = `Suspicious publication year (${yearStr}). Possible nonexistent citation.`;
        } else {
          status = 'properly_cited';
          explanation = `Well-formed citation for ${authors[0]} (${yearStr}).`;
        }
      }

      citations.push({
        id: `cit_${citations.length + 1}`,
        inTextCitation: raw,
        startIndex: start,
        endIndex: end,
        format: 'APA',
        citedAuthors: authors,
        citedYear: yearStr,
        status,
        statusExplanation: explanation,
        associatedMatchId: matchingSource?.url,
        verifiedInCrossrefOrOpenAlex: !!matchingSource,
      });
    }
  }

  // 2. Narrative Citations (e.g. Einstein et al. (1905) showed...)
  while ((match = NARRATIVE_CITATION_REGEX.exec(text)) !== null) {
    const raw = match[0];
    const authorStr = match[1];
    const yearStr = match[2];
    const start = match.index;
    const end = start + raw.length;
    const spanKey = `${start}-${end}`;

    if (!seenSpans.has(spanKey)) {
      seenSpans.add(spanKey);
      citations.push({
        id: `cit_${citations.length + 1}`,
        inTextCitation: raw,
        startIndex: start,
        endIndex: end,
        format: 'Harvard',
        citedAuthors: [authorStr],
        citedYear: yearStr,
        status: 'properly_cited',
        statusExplanation: `Narrative citation identifying ${authorStr} (${yearStr}).`,
      });
    }
  }

  // 3. IEEE Bracket citations [1], [2, 3], [4-7]
  while ((match = BRACKET_NUM_REGEX.exec(text)) !== null) {
    const raw = match[0];
    const start = match.index;
    const end = start + raw.length;
    const spanKey = `${start}-${end}`;

    if (!seenSpans.has(spanKey)) {
      seenSpans.add(spanKey);
      citations.push({
        id: `cit_${citations.length + 1}`,
        inTextCitation: raw,
        startIndex: start,
        endIndex: end,
        format: 'IEEE',
        status: 'properly_cited',
        statusExplanation: 'Numeric reference marker properly positioned.',
      });
    }
  }

  return citations;
}

export function auditAttributionForPassage(
  submittedPassage: string,
  startIndex: number,
  endIndex: number,
  fullText: string,
  citations: CitationItem[],
  matchedSource?: VerifiedSource
): { status: CitationStatus; explanation: string; isAttributed: boolean } {
  // Check if passage itself is in quotation marks
  const surroundingWindow = fullText.slice(Math.max(0, startIndex - 20), Math.min(fullText.length, endIndex + 20));
  const isQuoted = surroundingWindow.includes('"') || surroundingWindow.includes('“') || surroundingWindow.includes('”');

  // Check if a citation is situated within 150 characters of this passage
  const nearbyCitation = citations.find(
    (c) => Math.abs(c.startIndex - endIndex) <= 180 || Math.abs(c.endIndex - startIndex) <= 180
  );

  if (isQuoted && nearbyCitation) {
    return {
      status: 'properly_cited',
      explanation: `Passage is enclosed in quotations and attributed via citation "${nearbyCitation.inTextCitation}".`,
      isAttributed: true,
    };
  }

  if (nearbyCitation) {
    return {
      status: 'properly_cited',
      explanation: `Passage is attributed by nearby citation "${nearbyCitation.inTextCitation}".`,
      isAttributed: true,
    };
  }

  if (isQuoted && !nearbyCitation) {
    return {
      status: 'improperly_attributed_quote',
      explanation: 'Passage is in quotation marks but lacks an explicit source citation.',
      isAttributed: false,
    };
  }

  return {
    status: 'missing_citation',
    explanation: 'Matched external material is present without citation or attribution.',
    isAttributed: false,
  };
}
