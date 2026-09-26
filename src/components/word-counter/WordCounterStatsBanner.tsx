import React from 'react';
import {
  FileText,
  AlignLeft,
  BookOpen,
  Volume2,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { TextStatistics } from '@/utils/wordCounter';

interface Props {
  stats: TextStatistics;
  selectionStats?: TextStatistics | null;
  readingWpm?: number;
  speakingWpm?: number;
  maxWordsPerSentence?: number;
  showWritingLimits?: boolean;
  flaggedSentencesCount?: number;
  visibleStats?: {
    words: boolean;
    characters: boolean;
    noSpaces: boolean;
    sentences: boolean;
    paragraphs: boolean;
    readingTime: boolean;
    speakingTime: boolean;
  };
}

export function WordCounterStatsBanner({
  stats,
  selectionStats,
  readingWpm = 225,
  speakingWpm = 130,
  maxWordsPerSentence = 25,
  showWritingLimits = true,
  flaggedSentencesCount = 0,
  visibleStats = {
    words: true,
    characters: true,
    noSpaces: true,
    sentences: true,
    paragraphs: true,
    readingTime: true,
    speakingTime: true,
  },
}: Props) {
  const avgWordsPerSent = stats.averageSentenceLengthWords || 0;
  const isSelectionActive = !!selectionStats && selectionStats.words > 0;

  return (
    <div className="space-y-2 mb-5">
      {/* Selection Notice Indicator (if text is highlighted) */}
      {isSelectionActive && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg text-xs text-primary animate-in fade-in duration-200">
          <span className="flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            Showing statistics for highlighted selection ({selectionStats.words.toLocaleString()} words)
          </span>
          <span className="text-[11px] text-muted-foreground">
            Values in parentheses indicate selected portion
          </span>
        </div>
      )}

      {/* ── Responsive Statistics Grid ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7 gap-3">
        
        {/* 1. Words (primary) */}
        {visibleStats.words && (
          <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/30 shadow-xs flex flex-col justify-between hover:border-primary/50 transition-colors min-w-0">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Words</span>
              <FileText className="w-4 h-4 text-primary shrink-0" />
            </div>
            <div className="min-w-0">
              <div className="text-2xl font-bold tracking-tight text-foreground truncate">
                {stats.words.toLocaleString()}
              </div>
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                {isSelectionActive
                  ? `(${selectionStats.words.toLocaleString()} selected)`
                  : 'Document total'}
              </p>
            </div>
          </div>
        )}

        {/* 2. Characters (with spaces, primary) */}
        {visibleStats.characters && (
          <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/30 shadow-xs flex flex-col justify-between hover:border-primary/50 transition-colors min-w-0">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Characters</span>
              <AlignLeft className="w-4 h-4 text-primary shrink-0" />
            </div>
            <div className="min-w-0">
              <div className="text-2xl font-bold tracking-tight text-foreground truncate">
                {stats.charactersWithSpaces.toLocaleString()}
              </div>
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                {isSelectionActive
                  ? `(${selectionStats.charactersWithSpaces.toLocaleString()} selected)`
                  : 'With spaces'}
              </p>
            </div>
          </div>
        )}

        {/* 3. Characters Without Spaces (primary) */}
        {visibleStats.noSpaces && (
          <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/30 shadow-xs flex flex-col justify-between hover:border-primary/50 transition-colors min-w-0">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">No Spaces</span>
              <span className="text-[10px] font-mono font-medium text-muted-foreground">char</span>
            </div>
            <div className="min-w-0">
              <div className="text-2xl font-bold tracking-tight text-foreground truncate">
                {stats.charactersWithoutSpaces.toLocaleString()}
              </div>
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                {isSelectionActive
                  ? `(${selectionStats.charactersWithoutSpaces.toLocaleString()} selected)`
                  : 'Without whitespace'}
              </p>
            </div>
          </div>
        )}

        {/* 4. Sentences */}
        {visibleStats.sentences && (
          <div className="p-3.5 rounded-xl bg-card border border-border/70 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-colors min-w-0">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Sentences</span>
              {showWritingLimits && flaggedSentencesCount > 0 && (
                <Badge variant="destructive" className="h-4 px-1 text-[10px] gap-0.5" title={`${flaggedSentencesCount} sentence(s) exceed ${maxWordsPerSentence} words`}>
                  <AlertCircle className="w-2.5 h-2.5" />
                  {flaggedSentencesCount}
                </Badge>
              )}
            </div>
            <div className="min-w-0">
              <div className="text-2xl font-bold tracking-tight text-foreground truncate">
                {stats.sentences.toLocaleString()}
              </div>
              <p className="text-[11px] text-muted-foreground truncate mt-0.5" title={`Average: ${avgWordsPerSent} words/sentence`}>
                Average: {avgWordsPerSent} words/sentence
              </p>
            </div>
          </div>
        )}

        {/* 5. Paragraphs */}
        {visibleStats.paragraphs && (
          <div className="p-3.5 rounded-xl bg-card border border-border/70 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-colors min-w-0">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Paragraphs</span>
            </div>
            <div className="min-w-0">
              <div className="text-2xl font-bold tracking-tight text-foreground truncate">
                {stats.paragraphs.toLocaleString()}
              </div>
              <p className="text-[11px] text-muted-foreground truncate mt-0.5" title={`Longest paragraph: ${stats.longestParagraphWords} words`}>
                Longest: {stats.longestParagraphWords} words
              </p>
            </div>
          </div>
        )}

        {/* 6. Reading Time */}
        {visibleStats.readingTime && (
          <div className="p-3.5 rounded-xl bg-card border border-border/70 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-colors min-w-0">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-primary shrink-0" />
                Reading
              </span>
              <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            </div>
            <div className="min-w-0">
              <div className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
                {stats.readingTimeFormatted}
              </div>
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                Estimate @ {readingWpm} WPM
              </p>
            </div>
          </div>
        )}

        {/* 7. Speaking Time */}
        {visibleStats.speakingTime && (
          <div className="p-3.5 rounded-xl bg-card border border-border/70 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-colors min-w-0">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5 text-primary shrink-0" />
                Speaking
              </span>
              <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            </div>
            <div className="min-w-0">
              <div className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
                {stats.speakingTimeFormatted}
              </div>
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                Estimate @ {speakingWpm} WPM
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
