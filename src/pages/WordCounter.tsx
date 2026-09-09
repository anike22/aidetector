import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import PageMeta from '@/components/common/PageMeta';
import MainLayout from '@/components/layouts/MainLayout';
import {
  FileText,
  Sparkles,
  RotateCcw,
  Maximize2,
  Minimize2,
  Settings2,
  Bot,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

// Utilities
import {
  countWords,
  getSentences,
  getParagraphs,
  computeTextStatistics,
  computeWordFrequency,
  hashText,
  DEFAULT_SPEEDS,
  type TextStatistics,
} from '@/utils/wordCounter';
import {
  analyzeGrammar,
  applySuggestion,
  type GrammarSuggestion,
} from '@/utils/grammarAssistant';
import { applyCaseTransformation } from '@/utils/caseConverter';
import { lookupThesaurus, type ThesaurusResult } from '@/utils/thesaurus';
import { calculateReadabilityMetrics } from '@/utils/readability';

// AI Detector Services & Hooks
import {
  runBalancedDetector,
  type BalancedDetectorResult,
} from '@/lib/detection/balancedDetectorService';
import {
  runAggressiveDetector,
  type AggressiveDetectorResult,
} from '@/lib/detection/aggressiveDetectorService';
import { useEntitlement } from '@/hooks/useEntitlement';
import { useUpgradeModal } from '@/hooks/useUpgradeModal';

// Components
import { WordCounterStatsBanner } from '@/components/word-counter/WordCounterStatsBanner';
import { WordCounterToolbar } from '@/components/word-counter/WordCounterToolbar';
import { WordCounterAdvancedPanel } from '@/components/word-counter/WordCounterAdvancedPanel';
import { WordCounterOptionsDialog } from '@/components/word-counter/WordCounterOptionsDialog';
import { WordCounterFindReplaceDialog } from '@/components/word-counter/WordCounterFindReplaceDialog';
import { WordCounterAiResultCard } from '@/components/word-counter/WordCounterAiResultCard';
import WordCounterSeoContent from '@/components/word-counter/WordCounterSeoContent';

const LOCAL_STORAGE_KEY = 'aidetector_wordcounter_draft_v2';
const SETTINGS_STORAGE_KEY = 'aidetector_wordcounter_settings_v2';

// 152-word sample text for instant reproduction and testing
const SAMPLE_TEXT = `Artificial intelligence is rapidly transforming modern writing, research, and communication across global industries. As machine learning models become more sophisticated, distinguishing between human-authored prose and synthetic text requires rigorous statistical analysis.

Language models generate text by predicting subsequent tokens based on probability distributions learned from vast corpora. In contrast, experienced human writers exhibit natural burstiness, variable sentence rhythms, and nuanced stylistic choices that reflect personal thought and intention.

Understanding document metrics such as word counts, sentence lengths, reading duration, and lexical diversity helps authors refine their prose for clarity and audience engagement. Whether drafting an academic essay, preparing a keynote speech, or optimizing digital content, maintaining authentic human expression remains essential in an increasingly automated world.

Tools that combine instant local counting with multi-model AI verification empower creators to review their drafts with confidence, precision, and privacy.`;

export default function WordCounter() {
  // ── Core Text & History State ─────────────────────────────────────────────
  const [text, setText] = useState<string>('');
  const [history, setHistory] = useState<Array<{ text: string; selectionStart: number; selectionEnd: number }>>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number }>({ start: 0, end: 0 });
  const [selectedText, setSelectedText] = useState<string>('');

  // ── Layout & View Modes ───────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<'basic' | 'advanced'>('basic');
  const [advancedTab, setAdvancedTab] = useState<'grammar' | 'thesaurus' | 'activity' | 'goals'>('grammar');
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState<boolean>(false);
  const [isFindReplaceOpen, setIsFindReplaceOpen] = useState<boolean>(false);

  // ── Options & Preferences State ───────────────────────────────────────────
  const [readingWpm, setReadingWpm] = useState<number>(DEFAULT_SPEEDS.wordsPerMinuteReading);
  const [speakingWpm, setSpeakingWpm] = useState<number>(DEFAULT_SPEEDS.wordsPerMinuteSpeaking);
  const [fontSize, setFontSize] = useState<number>(15);
  const [fontFamily, setFontFamily] = useState<'sans' | 'serif' | 'mono'>('sans');
  const [lineHeight, setLineHeight] = useState<'normal' | 'relaxed' | 'loose'>('relaxed');
  const [isSpellcheckEnabled, setIsSpellcheckEnabled] = useState<boolean>(true);
  const [maxWordsPerSentence, setMaxWordsPerSentence] = useState<number>(25);
  const [maxWordsPerParagraph, setMaxWordsPerParagraph] = useState<number>(250);
  const [wordGoal, setWordGoal] = useState<number>(0);
  const [stopWordsFilter, setStopWordsFilter] = useState<boolean>(true);

  const [visibleStats, setVisibleStats] = useState({
    words: true,
    characters: true,
    noSpaces: true,
    sentences: true,
    paragraphs: true,
    readingTime: true,
    speakingTime: true,
  });

  // ── Grammar Assistant State ───────────────────────────────────────────────
  const [grammarLanguage, setGrammarLanguage] = useState<string>('en');
  const [isGrammarScanEnabled, setIsGrammarScanEnabled] = useState<boolean>(true);
  const [isScanningGrammar, setIsScanningGrammar] = useState<boolean>(false);
  const [grammarSuggestions, setGrammarSuggestions] = useState<GrammarSuggestion[]>([]);
  const [dismissedSuggestionIds, setDismissedSuggestionIds] = useState<Set<string>>(new Set());
  const [lastScannedTextHash, setLastScannedTextHash] = useState<string>('');

  // ── Thesaurus State ───────────────────────────────────────────────────────
  const [thesaurusQuery, setThesaurusQuery] = useState<string>('');
  const [thesaurusResult, setThesaurusResult] = useState<ThesaurusResult | null>(null);
  const [isSearchingThesaurus, setIsSearchingThesaurus] = useState<boolean>(false);

  // ── Find and Replace State ────────────────────────────────────────────────
  const [findQuery, setFindQuery] = useState<string>('');
  const [replaceQuery, setReplaceQuery] = useState<string>('');
  const [isMatchCase, setIsMatchCase] = useState<boolean>(false);

  // ── Activity Tracking State ───────────────────────────────────────────────
  const [activeSeconds, setActiveSeconds] = useState<number>(0);
  const [keystrokeCount, setKeystrokeCount] = useState<number>(0);
  const [wordsAdded, setWordsAdded] = useState<number>(0);
  const [wordsDeleted, setWordsDeleted] = useState<number>(0);
  const lastWordCountRef = useRef<number>(0);

  // ── Auto-save Draft State ─────────────────────────────────────────────────
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);

  // ── AI Detection State ────────────────────────────────────────────────────
  const [aiResult, setAiResult] = useState<BalancedDetectorResult | AggressiveDetectorResult | null>(null);
  const [isAnalyzingAI, setIsAnalyzingAI] = useState<boolean>(false);
  const [analyzedTextHash, setAnalyzedTextHash] = useState<string | null>(null);
  const [analyzedTarget, setAnalyzedTarget] = useState<'full' | 'selection'>('full');
  const [detectorMode, setDetectorMode] = useState<'balanced' | 'aggressive'>('balanced');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { entitlement, refresh: refreshEntitlement } = useEntitlement('text_detect_balanced');
  const { openUpgradeModal } = useUpgradeModal();

  const remaining = entitlement?.remainingCredits ?? entitlement?.trialChecksRemaining ?? 1;

  // ── Push Undo/Redo History Snapshot ───────────────────────────────────────
  const pushToHistory = useCallback((newText: string, selStart: number = 0, selEnd: number = 0) => {
    setHistory(prev => {
      const next = prev.slice(0, historyIndex + 1);
      if (next.length > 0 && next[next.length - 1].text === newText) {
        return next;
      }
      return [...next, { text: newText, selectionStart: selStart, selectionEnd: selEnd }];
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  // ── Load Initial Draft & Settings on Mount ────────────────────────────────
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed.readingWpm) setReadingWpm(parsed.readingWpm);
        if (parsed.speakingWpm) setSpeakingWpm(parsed.speakingWpm);
        if (parsed.fontSize) setFontSize(parsed.fontSize);
        if (parsed.fontFamily) setFontFamily(parsed.fontFamily);
        if (parsed.lineHeight) setLineHeight(parsed.lineHeight);
        if (parsed.visibleStats) setVisibleStats(parsed.visibleStats);
        if (parsed.grammarLanguage) setGrammarLanguage(parsed.grammarLanguage);
      }
    } catch {}

    try {
      const savedDraft = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedDraft) {
        setText(savedDraft);
        setHistory([{ text: savedDraft, selectionStart: 0, selectionEnd: 0 }]);
        setHistoryIndex(0);
        lastWordCountRef.current = countWords(savedDraft);
        setLastSavedTime(new Date());
      } else {
        // Load default sample text on empty session
        setText(SAMPLE_TEXT);
        setHistory([{ text: SAMPLE_TEXT, selectionStart: 0, selectionEnd: 0 }]);
        setHistoryIndex(0);
        lastWordCountRef.current = countWords(SAMPLE_TEXT);
      }
    } catch {
      setText(SAMPLE_TEXT);
      setHistory([{ text: SAMPLE_TEXT, selectionStart: 0, selectionEnd: 0 }]);
      setHistoryIndex(0);
    }
  }, []);

  // ── Auto-save Draft to LocalStorage ───────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if (text) {
          localStorage.setItem(LOCAL_STORAGE_KEY, text);
          setLastSavedTime(new Date());
        }
      } catch {}
    }, 1000);
    return () => clearTimeout(timer);
  }, [text]);

  // ── Save Settings on Change ───────────────────────────────────────────────
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({
        readingWpm,
        speakingWpm,
        fontSize,
        fontFamily,
        lineHeight,
        visibleStats,
        grammarLanguage,
      }));
    } catch {}
  }, [readingWpm, speakingWpm, fontSize, fontFamily, lineHeight, visibleStats, grammarLanguage]);

  // ── Active Timer & Words delta tracking ───────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.hasFocus() && text.length > 0) {
        setActiveSeconds(prev => prev + 1);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [text]);

  // ── Recalculate Statistics ────────────────────────────────────────────────
  const stats = useMemo(() => {
    return computeTextStatistics(text, {
      wordsPerMinuteReading: readingWpm,
      wordsPerMinuteSpeaking: speakingWpm,
    });
  }, [text, readingWpm, speakingWpm]);

  // ── Selection Statistics ──────────────────────────────────────────────────
  const selectionStats = useMemo(() => {
    if (!selectedText.trim()) return null;
    return computeTextStatistics(selectedText, {
      wordsPerMinuteReading: readingWpm,
      wordsPerMinuteSpeaking: speakingWpm,
    });
  }, [selectedText, readingWpm, speakingWpm]);

  // ── Sentences and Paragraphs Analysis ─────────────────────────────────────
  const sentencesList = useMemo(() => getSentences(text, maxWordsPerSentence), [text, maxWordsPerSentence]);
  const paragraphsList = useMemo(() => getParagraphs(text, maxWordsPerParagraph), [text, maxWordsPerParagraph]);
  const readability = useMemo(() => calculateReadabilityMetrics(text), [text]);
  const frequencyList = useMemo(() => computeWordFrequency(text, stopWordsFilter), [text, stopWordsFilter]);

  // ── Execute Grammar Scan ──────────────────────────────────────────────────
  const runGrammarAnalysis = useCallback((inputText: string = text, lang: string = grammarLanguage) => {
    if (!inputText || !inputText.trim()) {
      setGrammarSuggestions([]);
      setLastScannedTextHash('');
      return;
    }

    setIsScanningGrammar(true);
    const results = analyzeGrammar(inputText, lang);
    setGrammarSuggestions(results);
    setLastScannedTextHash(hashText(inputText));
    setIsScanningGrammar(false);
  }, [text, grammarLanguage]);

  // ── Auto-scan grammar if enabled and text changes ─────────────────────────
  useEffect(() => {
    if (!isGrammarScanEnabled) return;
    const timer = setTimeout(() => {
      runGrammarAnalysis(text, grammarLanguage);
    }, 500);
    return () => clearTimeout(timer);
  }, [text, isGrammarScanEnabled, grammarLanguage, runGrammarAnalysis]);

  // ── Filtered Grammar Suggestions (excluding dismissed) ────────────────────
  const activeGrammarSuggestions = useMemo(() => {
    return grammarSuggestions.filter(s => !dismissedSuggestionIds.has(s.id));
  }, [grammarSuggestions, dismissedSuggestionIds]);

  const isGrammarStale = useMemo(() => {
    if (!lastScannedTextHash || !text) return false;
    return lastScannedTextHash !== hashText(text);
  }, [lastScannedTextHash, text]);

  // ── Textarea Input & Keystroke Handler ─────────────────────────────────────
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    const currentWords = countWords(newText);
    const diff = currentWords - lastWordCountRef.current;
    
    if (diff > 0) {
      setWordsAdded(prev => prev + diff);
    } else if (diff < 0) {
      setWordsDeleted(prev => prev + Math.abs(diff));
    }
    lastWordCountRef.current = currentWords;

    setText(newText);
    setKeystrokeCount(prev => prev + 1);
    pushToHistory(newText, e.target.selectionStart, e.target.selectionEnd);
  };

  // ── Selection Tracking ────────────────────────────────────────────────────
  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    setSelectionRange({ start: target.selectionStart, end: target.selectionEnd });
    const sel = target.value.slice(target.selectionStart, target.selectionEnd);
    setSelectedText(sel);

    // Auto-fill thesaurus query if single word selected
    if (sel.trim() && !sel.includes(' ') && sel.trim().length <= 30) {
      setThesaurusQuery(sel.trim());
    }
  };

  // ── Undo / Redo Actions ───────────────────────────────────────────────────
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const snapshot = history[prevIndex];
      setText(snapshot.text);
      setHistoryIndex(prevIndex);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(snapshot.selectionStart, snapshot.selectionEnd);
          textareaRef.current.focus();
        }
      }, 0);
    }
  };

  const handleRedo = () => {
    if (historyIndex < historyLength - 1) {
      const nextIndex = historyIndex + 1;
      const snapshot = history[nextIndex];
      setText(snapshot.text);
      setHistoryIndex(nextIndex);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(snapshot.selectionStart, snapshot.selectionEnd);
          textareaRef.current.focus();
        }
      }, 0);
    }
  };

  const historyLength = history.length;

  // ── Paste Action ──────────────────────────────────────────────────────────
  const handlePaste = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (!clipText) {
        toast.info('Clipboard is empty');
        return;
      }
      
      const before = text.slice(0, selectionRange.start);
      const after = text.slice(selectionRange.end);
      const newText = before + clipText + after;
      setText(newText);
      pushToHistory(newText, selectionRange.start + clipText.length, selectionRange.start + clipText.length);
      toast.success('Pasted from clipboard');
    } catch {
      toast.info('Press Ctrl+V or Cmd+V to paste into the editor.');
    }
  };

  // ── Copy Action ───────────────────────────────────────────────────────────
  const handleCopy = async () => {
    const contentToCopy = selectedText.trim() ? selectedText : text;
    if (!contentToCopy) {
      toast.info('No text to copy');
      return;
    }

    try {
      await navigator.clipboard.writeText(contentToCopy);
      toast.success(selectedText.trim() ? 'Selection copied to clipboard' : 'Entire document copied');
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  // ── Clear Action with Undo snapshot ───────────────────────────────────────
  const handleClear = () => {
    if (!text.trim()) return;
    pushToHistory('', 0, 0);
    setText('');
    setSelectedText('');
    toast.success('Text cleared. Click Undo if this was accidental.');
  };

  // ── Sample Text Action ────────────────────────────────────────────────────
  const handleInsertSample = () => {
    setText(SAMPLE_TEXT);
    pushToHistory(SAMPLE_TEXT, 0, SAMPLE_TEXT.length);
    toast.success('Sample text loaded (152 words)');
  };

  // ── Case Transformations ──────────────────────────────────────────────────
  const handleCaseTransform = (type: 'upper' | 'lower' | 'sentence' | 'title') => {
    if (!text.trim()) {
      toast.info('Enter or paste text first');
      return;
    }

    const { newText, transformedSelectionStart, transformedSelectionEnd } = applyCaseTransformation(
      text,
      type,
      selectionRange.start,
      selectionRange.end
    );

    setText(newText);
    pushToHistory(newText, transformedSelectionStart, transformedSelectionEnd);

    const labels = {
      upper: 'UPPERCASE',
      lower: 'lowercase',
      sentence: 'Sentence case',
      title: 'Title Case',
    };
    toast.success(`Converted to ${labels[type]}`);
  };

  // ── Grammar Suggestion Actions ────────────────────────────────────────────
  const handleAcceptSuggestion = (suggestion: GrammarSuggestion) => {
    const newText = applySuggestion(text, suggestion);
    setText(newText);
    pushToHistory(newText, suggestion.startIndex, suggestion.startIndex + suggestion.replacementText.length);
    setDismissedSuggestionIds(prev => new Set(prev).add(suggestion.id));
    toast.success(`Applied: "${suggestion.replacementText || 'removal'}"`);
  };

  const handleDismissSuggestion = (suggestionId: string) => {
    setDismissedSuggestionIds(prev => new Set(prev).add(suggestionId));
  };

  const handleAcceptAllGrammar = () => {
    let currentText = text;
    for (const sug of activeGrammarSuggestions) {
      currentText = applySuggestion(currentText, sug);
    }
    setText(currentText);
    pushToHistory(currentText, 0, currentText.length);
    setDismissedSuggestionIds(new Set(grammarSuggestions.map(s => s.id)));
    toast.success(`Applied all ${activeGrammarSuggestions.length} suggestions`);
  };

  // ── Thesaurus Search & Replace ────────────────────────────────────────────
  const handleThesaurusSearch = async (wordToSearch?: string) => {
    const query = (wordToSearch || thesaurusQuery || selectedText).trim();
    if (!query) {
      toast.info('Enter or highlight a word to look up synonyms');
      return;
    }

    setIsSearchingThesaurus(true);
    try {
      const res = await lookupThesaurus(query);
      setThesaurusResult(res);
      if (!res || res.definitions.length === 0 || res.definitions[0].synonyms.length === 0) {
        toast.info(`No synonyms found for "${query}"`);
      }
    } catch {
      toast.error('Thesaurus search failed');
    } finally {
      setIsSearchingThesaurus(false);
    }
  };

  const handleReplaceWithSynonym = (synonym: string) => {
    if (!textareaRef.current) return;
    const targetWord = (thesaurusResult?.word || selectedText).trim();

    if (selectionRange.start !== selectionRange.end) {
      const before = text.slice(0, selectionRange.start);
      const after = text.slice(selectionRange.end);
      const newText = before + synonym + after;
      setText(newText);
      pushToHistory(newText, selectionRange.start, selectionRange.start + synonym.length);
      toast.success(`Replaced with "${synonym}"`);
    } else if (targetWord) {
      const regex = new RegExp(`\\b${targetWord}\\b`, 'i');
      const match = text.match(regex);
      if (match && match.index !== undefined) {
        const before = text.slice(0, match.index);
        const after = text.slice(match.index + match[0].length);
        const newText = before + synonym + after;
        setText(newText);
        pushToHistory(newText, match.index, match.index + synonym.length);
        toast.success(`Replaced "${targetWord}" with "${synonym}"`);
      } else {
        toast.info('Highlight the specific word in the editor to replace it.');
      }
    }
  };

  // ── Find & Replace Logic ──────────────────────────────────────────────────
  const findMatches = useMemo(() => {
    if (!findQuery || !text) return [];
    const matches: Array<{ start: number; end: number; text: string }> = [];
    const flags = isMatchCase ? 'g' : 'gi';
    try {
      const escaped = findQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, flags);
      let m: RegExpExecArray | null;
      while ((m = regex.exec(text)) !== null) {
        matches.push({ start: m.index, end: m.index + m[0].length, text: m[0] });
      }
    } catch {}
    return matches;
  }, [text, findQuery, isMatchCase]);

  const handleReplaceOne = () => {
    if (findMatches.length === 0) return;
    const targetMatch = findMatches[0];
    const before = text.slice(0, targetMatch.start);
    const after = text.slice(targetMatch.end);
    const newText = before + replaceQuery + after;
    setText(newText);
    pushToHistory(newText, targetMatch.start, targetMatch.start + replaceQuery.length);
    toast.success(`Replaced 1 instance of "${findQuery}"`);
  };

  const handleReplaceAll = () => {
    if (findMatches.length === 0) return;
    const flags = isMatchCase ? 'g' : 'gi';
    const escaped = findQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, flags);
    const newText = text.replace(regex, replaceQuery);
    setText(newText);
    pushToHistory(newText, 0, newText.length);
    toast.success(`Replaced ${findMatches.length} occurrences`);
  };

  // ── File Save & Export Actions ────────────────────────────────────────────
  const handleExport = (format: 'txt' | 'md' | 'html' | 'doc') => {
    if (!text.trim()) {
      toast.info('Enter text before exporting');
      return;
    }

    let mimeType = 'text/plain';
    let content = text;
    const ext = format;

    if (format === 'md') {
      mimeType = 'text/markdown';
    } else if (format === 'html') {
      mimeType = 'text/html';
      content = `<!DOCTYPE html>\n<html>\n<head><meta charset="utf-8"><title>Document Export</title></head>\n<body>\n${text.split('\n\n').map(p => `<p>${p}</p>`).join('\n')}\n</body>\n</html>`;
    } else if (format === 'doc') {
      mimeType = 'application/msword';
      content = `<html><head><meta charset="utf-8"></head><body>${text.split('\n\n').map(p => `<p>${p}</p>`).join('\n')}</body></html>`;
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `word-counter-export-${Date.now()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Exported as .${ext}`);
  };

  // ── File Upload Handler ───────────────────────────────────────────────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content !== undefined) {
        setText(content);
        pushToHistory(content, 0, content.length);
        toast.success(`Loaded "${file.name}" (${file.size} bytes)`);
      }
    };
    reader.onerror = () => {
      toast.error('Failed to read file');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // ── Reset Options Defaults ────────────────────────────────────────────────
  const handleResetDefaults = () => {
    setReadingWpm(225);
    setSpeakingWpm(130);
    setFontSize(15);
    setFontFamily('sans');
    setLineHeight('relaxed');
    setIsSpellcheckEnabled(true);
    setMaxWordsPerSentence(25);
    setMaxWordsPerParagraph(250);
    setVisibleStats({
      words: true,
      characters: true,
      noSpaces: true,
      sentences: true,
      paragraphs: true,
      readingTime: true,
      speakingTime: true,
    });
    toast.success('Settings reset to defaults');
  };

  // ── AI Detector Integration Handler ───────────────────────────────────────
  const handleCheckAI = async (useSelectionOnly: boolean = false) => {
    const targetText = useSelectionOnly && selectedText.trim() ? selectedText.trim() : text.trim();

    if (!targetText) {
      toast.error('Please enter or paste text to analyze for AI patterns.');
      return;
    }

    const wordsInTarget = countWords(targetText);
    if (wordsInTarget < 25) {
      toast.error(`Text is too short (${wordsInTarget} words). Minimum 25 words required for reliable detection.`);
      return;
    }

    setIsAnalyzingAI(true);

    try {
      let res: BalancedDetectorResult | AggressiveDetectorResult;
      if (detectorMode === 'aggressive') {
        res = await runAggressiveDetector(targetText);
      } else {
        res = await runBalancedDetector(targetText, {
          contentType: 'auto',
          sentenceLevel: true,
        });
      }

      setAiResult(res);
      setAnalyzedTextHash(hashText(text));
      setAnalyzedTarget(useSelectionOnly ? 'selection' : 'full');
      refreshEntitlement();
      toast.success('AI Detection completed');
    } catch (err: any) {
      const msg = err?.message || 'AI detection request failed';
      if (err?.code === 'UPGRADE_REQUIRED' || err?.code === 'AUTH_REQUIRED') {
        openUpgradeModal({
          featureName: 'AI Detector',
          trigger: 'limit_reached',
          remaining,
          limit: 1,
        });
      } else {
        toast.error(msg);
      }
    } finally {
      setIsAnalyzingAI(false);
    }
  };

  // ── Check if Analyzed Text Hash has become Stale ──────────────────────────
  const isResultStale = useMemo(() => {
    if (!aiResult || !analyzedTextHash) return false;
    return analyzedTextHash !== hashText(text);
  }, [aiResult, analyzedTextHash, text]);

  // ── Goals Remaining Math ──────────────────────────────────────────────────
  const wordGoalProgress = wordGoal > 0 ? Math.min(100, (stats.words / wordGoal) * 100) : 0;
  const wordGoalRemaining = wordGoal > 0 ? wordGoal - stats.words : 0;

  // ── Writing Limit Violations Count ────────────────────────────────────────
  const flaggedSentencesCount = sentencesList.filter(s => s.exceedsLimit).length;

  return (
    <MainLayout>
      <PageMeta
        title="Free Word Counter & Character Counter | AIDetector.cx"
        description="Count words, characters, sentences, and paragraphs instantly. Estimate reading and speaking time, track writing goals, and optionally check text for AI."
        canonicalUrl="https://www.aidetector.cx/word-counter"
        schemas={[
          {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Free Word Counter & Character Counter | AIDetector.cx',
            description:
              'Count words, characters, sentences, and paragraphs instantly. Estimate reading and speaking time, track writing goals, and optionally check text for AI.',
            url: 'https://www.aidetector.cx/word-counter',
            inLanguage: 'en',
            isPartOf: { '@type': 'WebSite', name: 'AIDetector.cx', url: 'https://www.aidetector.cx' },
            breadcrumb: {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.aidetector.cx' },
                { '@type': 'ListItem', position: 2, name: 'Tools', item: 'https://www.aidetector.cx/tools' },
                { '@type': 'ListItem', position: 3, name: 'Word Counter', item: 'https://www.aidetector.cx/word-counter' },
              ],
            },
          },
          {
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'AIDetector.cx Word Counter',
            applicationCategory: 'UtilitiesApplication',
            operatingSystem: 'Web',
            url: 'https://www.aidetector.cx/word-counter',
            browserRequirements: 'Requires JavaScript',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
              description:
                'Word, character, sentence, paragraph, reading time, speaking time, grammar, thesaurus, and word frequency features are free and unlimited. Optional AI detection checks are subject to free trial and paid plan limits.',
            },
            featureList: [
              'Free unlimited word, character, sentence, and paragraph counting',
              'Reading time and speaking time estimates with adjustable speeds',
              'Character counts with and without spaces',
              'Selected-text counting',
              'Writing goals and sentence/paragraph length highlighting',
              'Word frequency analysis with stop words filter',
              'Rule-based local grammar and style assistant in five languages',
              'Offline thesaurus with online fallback',
              'Case conversions: uppercase, lowercase, title case, sentence case',
              'Local draft auto-save and TXT, Markdown, HTML, and Word export',
              'Optional multi-model AI detection with sentence-level inspection',
            ],
          },
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'Is the word counter free?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Yes. Counting, statistics, grammar checking, the thesaurus, word frequency, case conversion, and exports are free and unlimited, and they run entirely in your browser. The optional AI check is the only feature with usage limits.',
                },
              },
              {
                '@type': 'Question',
                name: 'How are hyphenated words, contractions, and emoji counted?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '"state-of-the-art" and "don\'t" each count as one word. Emoji never count as words; in character totals each emoji counts as a single character. See How counting works on the page for the full rules and examples.',
                },
              },
              {
                '@type': 'Question',
                name: 'Will my count match Microsoft Word or Google Docs?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Not always. Every tool applies its own conventions to hyphenated words, numbers, URLs, and emoji, so small differences are normal. This page documents its exact rules in How counting works, so you can rely on it as the source of truth for text counted here.',
                },
              },
              {
                '@type': 'Question',
                name: 'Which languages are supported?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Counting works for any language that separates words with spaces, including accented characters. For Chinese, Japanese, and Korean, each character is counted as one word unit — a character-based approximation rather than true word segmentation, because those scripts do not use spaces. Sentence detection is an estimate for all languages.',
                },
              },
              {
                '@type': 'Question',
                name: 'Is my text saved or sent anywhere?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'All counting and editing features run locally in your browser. A draft is auto-saved to your browser\'s local storage so you can pick up where you left off; clearing the editor or your browser data removes it. Text is transmitted only when you explicitly run an AI check.',
                },
              },
              {
                '@type': 'Question',
                name: 'Can I export or upload text?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Yes. You can export your text as TXT, Markdown, HTML, or Word documents, copy it to the clipboard, or upload a plain-text file to count it. Exports and uploads never leave your browser.',
                },
              },
              {
                '@type': 'Question',
                name: 'Can I change the reading and speaking speed?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Yes. Open Options to set your own words-per-minute values for reading and speaking; both estimates recalculate instantly. The defaults are 225 WPM for reading and 130 WPM for speaking.',
                },
              },
              {
                '@type': 'Question',
                name: 'What are the limits of the optional AI check?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'The AI check requires at least 25 words and can run on your full text or just a selection. Guests get a small number of free checks; registered accounts receive free monthly checks and can continue with credits or a subscription. Running out never affects any counting feature.',
                },
              },
            ],
          },
        ]}
      />

      <div className={`min-h-screen bg-background pb-20 ${isFocusMode ? 'fixed inset-0 z-50 overflow-y-auto bg-background p-4 md:p-8' : ''}`}>
        
        {/* ── Top Header Navigation Bar (sticky only in Focus Mode) ───────────── */}
        <div className={`border-b border-border/40 bg-card/60 backdrop-blur-sm ${isFocusMode ? 'sticky top-0 z-20' : ''}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
            
            {/* Title & Badge */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground flex flex-wrap items-center gap-2">
                  Free Word Counter and Character Counter
                  <Badge variant="outline" className="text-[11px] font-normal border-primary/30 text-primary hidden sm:inline-flex">
                    Free & Instant
                  </Badge>
                </h1>
                <p className="text-xs text-muted-foreground text-pretty mt-0.5">
                  Count words, characters, sentences, and paragraphs with reading and speaking time estimates — instantly, in your browser.
                </p>
              </div>
            </div>

            {/* View Mode Switch & Options */}
            <div className="flex items-center gap-2">
              
              {/* Basic vs Advanced View Toggle */}
              <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border/50 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setViewMode('basic')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    viewMode === 'basic'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Basic View
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('advanced')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    viewMode === 'advanced'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Advanced View
                </button>
              </div>

              {/* Options Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOptionsOpen(true)}
                className="h-8 text-xs gap-1.5"
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Options</span>
              </Button>

              {/* Fullscreen / Focus Mode Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFocusMode(!isFocusMode)}
                className="h-8 px-2 text-muted-foreground hover:text-foreground"
                title={isFocusMode ? 'Exit Fullscreen' : 'Fullscreen Focus Mode'}
              >
                {isFocusMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* ── Main Container ─────────────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5">
          
          {/* 1. PROMINENT LIVE COUNTS BANNER */}
          <WordCounterStatsBanner
            stats={stats}
            selectionStats={selectionStats}
            readingWpm={readingWpm}
            speakingWpm={speakingWpm}
            maxWordsPerSentence={maxWordsPerSentence}
            showWritingLimits={true}
            flaggedSentencesCount={flaggedSentencesCount}
            visibleStats={visibleStats}
          />

          {/* ── Editor & Tools Layout ─────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            
            {/* Left/Main Column: Editor & Primary Action Bar */}
            <div className={`${viewMode === 'advanced' ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-4`}>
              
              <Card className="border-border shadow-card bg-card overflow-hidden">
                
                {/* ── FUNCTIONAL TOOLBAR ────────────────────────────────────── */}
                <WordCounterToolbar
                  text={text}
                  selectedText={selectedText}
                  historyIndex={historyIndex}
                  historyLength={historyLength}
                  isGrammarScanEnabled={isGrammarScanEnabled}
                  activeGrammarCount={activeGrammarSuggestions.length}
                  onPaste={handlePaste}
                  onUndo={handleUndo}
                  onRedo={handleRedo}
                  onCaseTransform={handleCaseTransform}
                  onToggleGrammar={() => {
                    setViewMode('advanced');
                    setAdvancedTab('grammar');
                  }}
                  onCopy={handleCopy}
                  onClear={handleClear}
                  onExport={handleExport}
                  onFileUpload={handleFileUpload}
                  onOpenFindReplace={() => setIsFindReplaceOpen(true)}
                  onOpenAdvancedTab={(tab) => {
                    setViewMode('advanced');
                    setAdvancedTab(tab);
                  }}
                  onInsertSample={handleInsertSample}
                />

                {/* ── MAIN TEXTAREA EDITOR ──────────────────────────────────── */}
                <div className="p-4 bg-background relative">
                  <Textarea
                    ref={textareaRef}
                    value={text}
                    onChange={handleTextChange}
                    onSelect={handleSelect}
                    onMouseUp={handleSelect}
                    onKeyUp={handleSelect}
                    placeholder="Type or paste your text here to begin counting words, checking grammar, and analyzing AI patterns..."
                    spellCheck={isSpellcheckEnabled}
                    style={{
                      fontSize: `${fontSize}px`,
                      fontFamily: fontFamily === 'mono' ? 'monospace' : fontFamily === 'serif' ? 'serif' : 'inherit',
                      lineHeight: lineHeight === 'loose' ? '2.0' : lineHeight === 'relaxed' ? '1.7' : '1.5',
                    }}
                    className="w-full min-h-[380px] sm:min-h-[440px] resize-y border-0 focus-visible:ring-0 shadow-none p-0 text-foreground bg-transparent placeholder:text-muted-foreground/60 leading-relaxed font-normal"
                  />
                </div>

                {/* ── EDITOR FOOTER BAR ─────────────────────────────────────── */}
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-muted/30 border-t border-border/50 text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <span>
                      <strong>{stats.words.toLocaleString()}</strong> words • <strong>{stats.charactersWithSpaces.toLocaleString()}</strong> characters
                    </span>
                    {lastSavedTime && (
                      <span className="hidden sm:inline text-muted-foreground/70">
                        • Auto-saved {lastSavedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleInsertSample}
                      className="h-7 text-xs px-2 text-primary hover:text-primary font-medium"
                    >
                      Load Sample
                    </Button>
                  </div>
                </div>
              </Card>

              {/* ── INTEGRATED AI DETECTION ACTION CARD ──────────────────────── */}
              <Card className="border-border shadow-card bg-card p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                        Verify AI Authorship
                        <Badge variant="secondary" className="text-[10px] capitalize font-medium">
                          {detectorMode} Engine
                        </Badge>
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Scan your draft with our multi-model classifier to detect AI-generated phrasing.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Detector Mode Selector */}
                    <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border/50 text-xs font-medium">
                      <button
                        type="button"
                        onClick={() => setDetectorMode('balanced')}
                        className={`px-2.5 py-1 rounded-md transition-colors ${
                          detectorMode === 'balanced'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Balanced
                      </button>
                      <button
                        type="button"
                        onClick={() => setDetectorMode('aggressive')}
                        className={`px-2.5 py-1 rounded-md transition-colors ${
                          detectorMode === 'aggressive'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Aggressive
                      </button>
                    </div>

                    {/* AI Check Button */}
                    <Button
                      size="sm"
                      onClick={() => handleCheckAI(false)}
                      disabled={isAnalyzingAI || !text.trim()}
                      className="h-9 px-4 text-xs font-semibold bg-primary text-primary-foreground shadow-sm gap-2"
                    >
                      <Zap className={`w-4 h-4 ${isAnalyzingAI ? 'animate-spin' : ''}`} />
                      <span>{isAnalyzingAI ? 'Analyzing...' : 'Check for AI'}</span>
                    </Button>
                  </div>
                </div>

                {selectedText.trim() && selectedText.trim().length > 30 && (
                  <div className="mt-3 pt-3 border-t border-border/40 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Selection active: {countWords(selectedText)} words highlighted.
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCheckAI(true)}
                      disabled={isAnalyzingAI}
                      className="h-7 text-xs gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      Check Selected Passage Only
                    </Button>
                  </div>
                )}
              </Card>

              {/* ── AI RESULT CARD (if checked) ──────────────────────────────── */}
              {aiResult && (
                <WordCounterAiResultCard
                  aiResult={aiResult}
                  analyzedTarget={analyzedTarget}
                  isResultStale={isResultStale}
                  isAnalyzingAI={isAnalyzingAI}
                  onRecheck={() => handleCheckAI(analyzedTarget === 'selection')}
                  text={text}
                />
              )}
            </div>

            {/* Right Column: Advanced Analysis Multi-Tab Panel (Visible in Advanced View) */}
            {viewMode === 'advanced' && (
              <div className="lg:col-span-4 space-y-4 animate-in fade-in slide-in-from-right-2 duration-200">
                <WordCounterAdvancedPanel
                  grammarLanguage={grammarLanguage}
                  setGrammarLanguage={setGrammarLanguage}
                  isGrammarScanEnabled={isGrammarScanEnabled}
                  setIsGrammarScanEnabled={setIsGrammarScanEnabled}
                  isScanningGrammar={isScanningGrammar}
                  onRunGrammarScan={() => runGrammarAnalysis(text, grammarLanguage)}
                  activeGrammarSuggestions={activeGrammarSuggestions}
                  onAcceptGrammar={handleAcceptSuggestion}
                  onDismissGrammar={handleDismissSuggestion}
                  onAcceptAllGrammar={handleAcceptAllGrammar}
                  isGrammarStale={isGrammarStale}

                  thesaurusQuery={thesaurusQuery}
                  setThesaurusQuery={setThesaurusQuery}
                  thesaurusResult={thesaurusResult}
                  isSearchingThesaurus={isSearchingThesaurus}
                  onSearchThesaurus={handleThesaurusSearch}
                  onReplaceWithSynonym={handleReplaceWithSynonym}

                  activeSeconds={activeSeconds}
                  keystrokeCount={keystrokeCount}
                  wordsAdded={wordsAdded}
                  wordsDeleted={wordsDeleted}
                  readability={readability}

                  stats={stats}
                  wordGoal={wordGoal}
                  setWordGoal={setWordGoal}
                  wordGoalProgress={wordGoalProgress}
                  wordGoalRemaining={wordGoalRemaining}
                  setMaxWordsPerSentence={setMaxWordsPerSentence}
                  setMaxWordsPerParagraph={setMaxWordsPerParagraph}

                  frequencyList={frequencyList}
                  stopWordsFilter={stopWordsFilter}
                  setStopWordsFilter={setStopWordsFilter}
                  activeTab={advancedTab}
                  onTabChange={(tab: any) => setAdvancedTab(tab)}
                />
              </div>
            )}
          </div>

          {/* ── Supporting Guide (below entire tool workspace) ──────────────────── */}
          {!isFocusMode && (
            <div className="mt-16">
              <WordCounterSeoContent />
            </div>
          )}
        </div>
      </div>

      {/* ── Dialogs ─────────────────────────────────────────────────────────── */}
      <WordCounterOptionsDialog
        isOpen={isOptionsOpen}
        onOpenChange={setIsOptionsOpen}
        visibleStats={visibleStats}
        setVisibleStats={setVisibleStats}
        fontSize={fontSize}
        setFontSize={setFontSize}
        fontFamily={fontFamily}
        setFontFamily={setFontFamily}
        lineHeight={lineHeight}
        setLineHeight={setLineHeight}
        isSpellcheckEnabled={isSpellcheckEnabled}
        setIsSpellcheckEnabled={setIsSpellcheckEnabled}
        readingWpm={readingWpm}
        setReadingWpm={setReadingWpm}
        speakingWpm={speakingWpm}
        setSpeakingWpm={setSpeakingWpm}
        maxWordsPerSentence={maxWordsPerSentence}
        setMaxWordsPerSentence={setMaxWordsPerSentence}
        maxWordsPerParagraph={maxWordsPerParagraph}
        setMaxWordsPerParagraph={setMaxWordsPerParagraph}
        onResetDefaults={handleResetDefaults}
      />

      <WordCounterFindReplaceDialog
        isOpen={isFindReplaceOpen}
        onOpenChange={setIsFindReplaceOpen}
        findQuery={findQuery}
        setFindQuery={setFindQuery}
        replaceQuery={replaceQuery}
        setReplaceQuery={setReplaceQuery}
        isMatchCase={isMatchCase}
        setIsMatchCase={setIsMatchCase}
        matchCount={findMatches.length}
        onReplaceOne={handleReplaceOne}
        onReplaceAll={handleReplaceAll}
      />
    </MainLayout>
  );
}
