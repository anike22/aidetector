/**
 * Private Corpus & Self-Plagiarism Architecture
 *
 * Allows authenticated users and institutions to compare submitted documents against
 * their own private historical submissions, unpublished drafts, or institutional archives.
 *
 * Isolates self-similarity from external unauthorized plagiarism.
 */

import { computeDocumentSha256 } from './forensicReportGenerator';

export interface PrivateCorpusDocument {
  id: string;
  title: string;
  documentHash: string; // SHA-256
  createdAt: string;
  authorId: string;
  authorName?: string;
  isOwnPriorWork: boolean;
  departmentOrFolder?: string;
  content: string;
  wordCount?: number;
}

export interface SelfSimilarityMatch {
  id: string;
  documentId: string;
  documentTitle: string;
  authorName?: string;
  creationDate: string;
  similarityScore: number; // 0-100
  matchType: 'self_reuse' | 'draft_version' | 'internal_institutional';
  isPermittedSelfReuse: boolean;
  explanation: string;
  matchedPassagesCount: number;
}

export const DEFAULT_PRESET_CORPUS: PrivateCorpusDocument[] = [
  {
    id: 'corpus_preset_1',
    title: 'Student Submission: AI Ethics & Automated Governance (2024 Draft)',
    documentHash: computeDocumentSha256('Artificial intelligence has rapidly transformed organizational operations across commercial domains.'),
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    authorId: 'student_1042',
    authorName: 'Alex Morgan (Class of 2025)',
    isOwnPriorWork: true,
    departmentOrFolder: 'Computer Science Dept / CS-402',
    wordCount: 1420,
    content: `Artificial intelligence has rapidly transformed the way organizations operate across every industry, enabling unprecedented levels of automation and efficiency. As these systems become more sophisticated, questions about authorship, accountability, and content originality have become increasingly important. Universities, publishers, and businesses alike are grappling with how to distinguish human-written content from AI-generated text in an era where the two are nearly indistinguishable.`
  },
  {
    id: 'corpus_preset_2',
    title: 'Institutional Archive: NLP Attention Mechanisms Term Paper (Fall 2023)',
    documentHash: computeDocumentSha256('According to recent empirical investigations in artificial intelligence, transformer architectures rely heavily on multi-head self-attention.'),
    createdAt: new Date(Date.now() - 120 * 86400000).toISOString(),
    authorId: 'student_0884',
    authorName: 'David Chen (Class of 2024)',
    isOwnPriorWork: false,
    departmentOrFolder: 'Faculty Archive / AI Research Lab',
    wordCount: 2850,
    content: `According to recent empirical investigations in artificial intelligence (Vaswani et al., 2017; Devlin et al., 2019), transformer architectures rely heavily on multi-head self-attention mechanisms to compute contextual representations across sequence dimensions. As demonstrated by Brown et al. (2020), scaling language models substantially improves few-shot performance on downstream natural language processing tasks.`
  }
];

const CORPUS_STORAGE_KEY = 'aidetector_private_corpus_v1';

export function getStoredPrivateCorpus(): PrivateCorpusDocument[] {
  if (typeof window === 'undefined') return DEFAULT_PRESET_CORPUS;
  try {
    const raw = localStorage.getItem(CORPUS_STORAGE_KEY);
    if (!raw) return DEFAULT_PRESET_CORPUS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_PRESET_CORPUS;
  } catch {
    return DEFAULT_PRESET_CORPUS;
  }
}

export function savePrivateCorpus(docs: PrivateCorpusDocument[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CORPUS_STORAGE_KEY, JSON.stringify(docs));
  } catch {
    // Ignore quota errors
  }
}

export function createCorpusDocument(
  title: string,
  content: string,
  authorName = 'Student / Author',
  isOwnPriorWork = true,
  department = 'General Submissions'
): PrivateCorpusDocument {
  const words = (content.match(/\S+/g) || []).length;
  return {
    id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title: title.trim() || 'Untitled Student Essay',
    documentHash: computeDocumentSha256(content),
    createdAt: new Date().toISOString(),
    authorId: 'user_current',
    authorName,
    isOwnPriorWork,
    departmentOrFolder: department,
    content,
    wordCount: words,
  };
}

/**
 * Analyzes submitted content against the user's private corpus
 */
export function analyzePrivateCorpusSimilarity(
  submittedText: string,
  privateCorpus: PrivateCorpusDocument[]
): SelfSimilarityMatch[] {
  const matches: SelfSimilarityMatch[] = [];
  const subWords = new Set(submittedText.toLowerCase().split(/\s+/).filter((w) => w.length > 4));

  for (const doc of privateCorpus) {
    const docWords = new Set(doc.content.toLowerCase().split(/\s+/).filter((w) => w.length > 4));
    let shared = 0;
    subWords.forEach((w) => {
      if (docWords.has(w)) shared++;
    });

    const overlap = subWords.size > 0 ? Math.round((shared / subWords.size) * 100) : 0;

    if (overlap >= 20) {
      const isDraft = doc.title.toLowerCase().includes('draft') || doc.title.toLowerCase().includes('v1') || doc.title.toLowerCase().includes('v2');
      const matchType: SelfSimilarityMatch['matchType'] = doc.isOwnPriorWork
        ? (isDraft ? 'draft_version' : 'self_reuse')
        : 'internal_institutional';

      matches.push({
        id: `self_match_${doc.id}`,
        documentId: doc.id,
        documentTitle: doc.title,
        authorName: doc.authorName,
        creationDate: new Date(doc.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        similarityScore: overlap,
        matchType,
        isPermittedSelfReuse: doc.isOwnPriorWork,
        explanation: doc.isOwnPriorWork
          ? `Matched prior student submission or draft (${doc.authorName ?? 'Self'}). Classified as permitted self-reuse, separated from external plagiarism.`
          : `Matched internal institutional archive essay (${doc.authorName ?? 'Student'}). Flagged for departmental review.`,
        matchedPassagesCount: Math.max(1, Math.ceil(overlap / 15)),
      });
    }
  }

  return matches;
}
