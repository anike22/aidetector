import React from 'react';
import {
  SpellCheck,
  CheckCircle2,
  ArrowRight,
  BookA,
  RefreshCw,
  Activity,
  Target,
  AlertTriangle,
  Globe,
  Sparkles,
  Check,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  SUPPORTED_GRAMMAR_LANGUAGES,
  type GrammarSuggestion,
} from '@/utils/grammarAssistant';
import type { ThesaurusResult } from '@/utils/thesaurus';
import type { ReadabilityMetrics } from '@/utils/readability';
import type { TextStatistics, WordFrequencyItem } from '@/utils/wordCounter';

interface Props {
  grammarLanguage: string;
  setGrammarLanguage: (lang: string) => void;
  isGrammarScanEnabled: boolean;
  setIsGrammarScanEnabled: (val: boolean) => void;
  isScanningGrammar: boolean;
  onRunGrammarScan: () => void;
  activeGrammarSuggestions: GrammarSuggestion[];
  onAcceptGrammar: (sug: GrammarSuggestion) => void;
  onDismissGrammar: (id: string) => void;
  onAcceptAllGrammar?: () => void;
  isGrammarStale?: boolean;

  thesaurusQuery: string;
  setThesaurusQuery: (val: string) => void;
  thesaurusResult: ThesaurusResult | null;
  isSearchingThesaurus: boolean;
  onSearchThesaurus: (word?: string) => void;
  onReplaceWithSynonym: (synonym: string) => void;

  activeSeconds: number;
  keystrokeCount: number;
  wordsAdded: number;
  wordsDeleted: number;
  readability: ReadabilityMetrics;

  stats: TextStatistics;
  wordGoal: number;
  setWordGoal: (val: number) => void;
  wordGoalProgress: number;
  wordGoalRemaining: number;
  setMaxWordsPerSentence: (val: number) => void;
  setMaxWordsPerParagraph: (val: number) => void;

  frequencyList: WordFrequencyItem[];
  stopWordsFilter: boolean;
  setStopWordsFilter: (val: boolean) => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function WordCounterAdvancedPanel({
  grammarLanguage,
  setGrammarLanguage,
  isGrammarScanEnabled,
  setIsGrammarScanEnabled,
  isScanningGrammar,
  onRunGrammarScan,
  activeGrammarSuggestions,
  onAcceptGrammar,
  onDismissGrammar,
  onAcceptAllGrammar,
  isGrammarStale = false,

  thesaurusQuery,
  setThesaurusQuery,
  thesaurusResult,
  isSearchingThesaurus,
  onSearchThesaurus,
  onReplaceWithSynonym,

  activeSeconds,
  keystrokeCount,
  wordsAdded,
  wordsDeleted,
  readability,

  stats,
  wordGoal,
  setWordGoal,
  wordGoalProgress,
  wordGoalRemaining,
  setMaxWordsPerSentence,
  setMaxWordsPerParagraph,

  frequencyList,
  stopWordsFilter,
  setStopWordsFilter,
  activeTab = 'grammar',
  onTabChange,
}: Props) {
  return (
    <div className="w-full space-y-4">
      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <TabsList className="grid grid-cols-4 w-full h-9 p-1">
          <TabsTrigger value="grammar" className="text-xs">
            Grammar
            {activeGrammarSuggestions.length > 0 && (
              <Badge variant="secondary" className="ml-1 px-1 py-0 text-[10px] h-4">
                {activeGrammarSuggestions.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="thesaurus" className="text-xs">Synonyms</TabsTrigger>
          <TabsTrigger value="activity" className="text-xs">Activity</TabsTrigger>
          <TabsTrigger value="goals" className="text-xs">Goals</TabsTrigger>
        </TabsList>

        {/* 1. Grammar & Style Tab */}
        <TabsContent value="grammar" className="mt-3 space-y-3">
          <Card className="border-border shadow-xs">
            <CardHeader className="p-4 pb-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                  <SpellCheck className="w-4 h-4 text-primary" />
                  Writing &amp; Grammar Assistant
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
                    Free • 0 Credits
                  </Badge>
                </div>
              </div>
              <CardDescription className="text-xs">
                Local rule-based grammar, punctuation, and style checks in your browser.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 pt-1 space-y-3">
              
              {/* Language Selection & Scan Trigger Bar */}
              <div className="p-2.5 rounded-lg bg-muted/40 border border-border/50 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-1 min-w-[140px]">
                    <Globe className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <Label htmlFor="grammar-lang-select" className="text-[11px] text-muted-foreground shrink-0">
                      Language:
                    </Label>
                    <Select value={grammarLanguage} onValueChange={setGrammarLanguage}>
                      <SelectTrigger id="grammar-lang-select" className="h-7 text-xs bg-background flex-1">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUPPORTED_GRAMMAR_LANGUAGES.map((lang) => (
                          <SelectItem key={lang.code} value={lang.code} className="text-xs">
                            <span className="mr-1.5">{lang.flag}</span>
                            {lang.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    size="sm"
                    onClick={onRunGrammarScan}
                    disabled={isScanningGrammar || !stats.words}
                    className="h-7 px-3 text-xs gap-1.5 bg-primary text-primary-foreground shrink-0"
                  >
                    <RefreshCw className={`w-3 h-3 ${isScanningGrammar ? 'animate-spin' : ''}`} />
                    <span>{isScanningGrammar ? 'Scanning...' : 'Check Grammar'}</span>
                  </Button>
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/30">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-primary" />
                    Live auto-scan:
                  </span>
                  <Switch
                    checked={isGrammarScanEnabled}
                    onCheckedChange={setIsGrammarScanEnabled}
                    className="scale-75"
                  />
                </div>
              </div>

              {/* Stale Text Warning */}
              {isGrammarStale && activeGrammarSuggestions.length > 0 && (
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Text changed since scan.</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRunGrammarScan}
                    className="h-6 text-[10px] px-2 border-amber-500/40 text-amber-800 dark:text-amber-200"
                  >
                    Re-scan
                  </Button>
                </div>
              )}

              {/* Suggestions List or Empty State */}
              {!isGrammarScanEnabled && activeGrammarSuggestions.length === 0 ? (
                <div className="p-4 rounded-xl bg-muted/30 border border-border/50 text-center text-xs text-muted-foreground">
                  Click "Check Grammar" or enable live auto-scan to review grammar, style, and spelling.
                </div>
              ) : activeGrammarSuggestions.length === 0 ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center text-xs text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>No grammar or style issues detected. Your writing is clear!</span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                    <span>{activeGrammarSuggestions.length} suggestion{activeGrammarSuggestions.length > 1 ? 's' : ''} found:</span>
                    {onAcceptAllGrammar && activeGrammarSuggestions.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onAcceptAllGrammar}
                        className="h-6 text-[11px] px-2 text-primary hover:text-primary font-medium"
                      >
                        Accept All
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                    {activeGrammarSuggestions.map((sug) => (
                      <div
                        key={sug.id}
                        className="p-3 rounded-lg border border-border/70 bg-card hover:border-primary/40 transition-colors text-xs space-y-1.5 shadow-xs"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <Badge variant="outline" className="text-[10px] capitalize font-medium">
                            {sug.category}
                          </Badge>
                          <span className="font-semibold text-foreground text-[11px] truncate">{sug.title}</span>
                        </div>
                        <p className="text-muted-foreground text-[11px] leading-normal">{sug.explanation}</p>
                        
                        <div className="p-2 rounded bg-muted/40 font-mono text-[11px] flex items-center justify-between gap-2 overflow-x-auto">
                          <span className="line-through text-destructive truncate max-w-[45%]">{sug.originalText}</span>
                          <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold truncate max-w-[45%]">{sug.replacementText || '(remove)'}</span>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDismissGrammar(sug.id)}
                            className="h-6 text-[11px] px-2 text-muted-foreground hover:text-foreground"
                          >
                            Dismiss
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => onAcceptGrammar(sug)}
                            className="h-6 text-[11px] px-2.5 bg-primary text-primary-foreground gap-1"
                          >
                            <Check className="w-3 h-3" />
                            Accept
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. Thesaurus / Synonyms Tab */}
        <TabsContent value="thesaurus" className="mt-3 space-y-3">
          <Card className="border-border shadow-xs">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                <BookA className="w-4 h-4 text-primary" />
                Thesaurus &amp; Synonyms
              </CardTitle>
              <CardDescription className="text-xs">
                Look up expressive synonyms for any word or highlighted selection.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 pt-2 space-y-3">
              <div className="flex items-center gap-1.5">
                <Input
                  value={thesaurusQuery}
                  onChange={(e) => setThesaurusQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && onSearchThesaurus()}
                  placeholder="Type a word (e.g. important)..."
                  className="h-8 text-xs"
                />
                <Button
                  size="sm"
                  onClick={() => onSearchThesaurus()}
                  disabled={isSearchingThesaurus}
                  className="h-8 px-3 text-xs"
                >
                  {isSearchingThesaurus ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Search'}
                </Button>
              </div>

              {thesaurusResult ? (
                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                  <div className="flex items-center justify-between text-xs border-b border-border/50 pb-1.5">
                    <span className="font-bold text-foreground text-sm">
                      {thesaurusResult.word}
                    </span>
                    <Badge variant="secondary" className="text-[10px]">
                      {thesaurusResult.source === 'local' ? 'Offline Dictionary' : 'Public API'}
                    </Badge>
                  </div>

                  {thesaurusResult.definitions.map((def, dIdx) => (
                    <div key={dIdx} className="space-y-2">
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {def.partOfSpeech}
                        </Badge>
                        <span className="italic">{def.definition}</span>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {def.synonyms.map((syn, sIdx) => (
                          <button
                            key={sIdx}
                            type="button"
                            onClick={() => onReplaceWithSynonym(syn)}
                            className="px-2.5 py-1 rounded-md bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium transition-colors cursor-pointer border border-primary/20"
                            title={`Click to replace with "${syn}"`}
                          >
                            {syn}
                          </button>
                        ))}
                      </div>

                      {def.antonyms && def.antonyms.length > 0 && (
                        <div className="pt-1 text-[11px] text-muted-foreground">
                          <strong>Antonyms:</strong> {def.antonyms.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-muted/20 border border-border/50 text-center text-xs text-muted-foreground">
                  Highlight a word in the editor or type above to find verified synonyms.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. Activity & Session Tab */}
        <TabsContent value="activity" className="mt-3 space-y-3">
          <Card className="border-border shadow-xs">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-primary" />
                Writing Session Activity
              </CardTitle>
              <CardDescription className="text-xs">
                Local session tracking. Zero keystrokes are uploaded.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 pt-2 space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-2.5 rounded-lg bg-muted/40 border border-border/50">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">Active Time</span>
                  <span className="text-lg font-extrabold text-foreground">
                    {Math.floor(activeSeconds / 60)}m {activeSeconds % 60}s
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-muted/40 border border-border/50">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">Keystrokes</span>
                  <span className="text-lg font-extrabold text-foreground">
                    {keystrokeCount.toLocaleString()}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-muted/40 border border-border/50">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold block">Words Added</span>
                  <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                    +{wordsAdded.toLocaleString()}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-muted/40 border border-border/50">
                  <span className="text-[10px] text-destructive uppercase font-bold block">Words Removed</span>
                  <span className="text-lg font-extrabold text-destructive">
                    -{wordsDeleted.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Readability Quick Card */}
              <div className="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-1.5 text-xs">
                <div className="font-semibold text-foreground flex items-center justify-between">
                  <span>Flesch Reading Ease:</span>
                  <span className="font-mono">{readability.fleschReadingEase} / 100</span>
                </div>
                <p className="text-[11px] text-muted-foreground">{readability.fleschReadingEaseLabel}</p>

                <div className="font-semibold text-foreground flex items-center justify-between pt-1">
                  <span>Grade Level:</span>
                  <span className="font-mono">{readability.fleschKincaidGradeLabel}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. Goals & Limits Tab */}
        <TabsContent value="goals" className="mt-3 space-y-3">
          <Card className="border-border shadow-xs">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                <Target className="w-4 h-4 text-primary" />
                Writing Goals &amp; Limits
              </CardTitle>
              <CardDescription className="text-xs">
                Set targets and monitor sentence/paragraph lengths.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 pt-2 space-y-4">
              {/* Word Goal */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <Label htmlFor="word-goal-input">Word Target Goal:</Label>
                  <span className="font-mono text-muted-foreground">
                    {stats.words} / {wordGoal || '—'} words
                  </span>
                </div>
                <Input
                  id="word-goal-input"
                  type="number"
                  min="0"
                  step="50"
                  value={wordGoal || ''}
                  onChange={(e) => setWordGoal(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  placeholder="e.g. 500"
                  className="h-8 text-xs"
                />
                {wordGoal > 0 && (
                  <div className="space-y-1">
                    <Progress value={wordGoalProgress} className="h-1.5" />
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>{Math.round(wordGoalProgress)}% complete</span>
                      <span>
                        {wordGoalRemaining > 0 ? `${wordGoalRemaining} words left` : 'Goal reached! 🎉'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Presets for Sentence & Paragraph limits */}
              <div className="pt-2 border-t border-border/50 space-y-2">
                <span className="text-xs font-semibold text-foreground block">Writing Limits Presets</span>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setMaxWordsPerSentence(25); setMaxWordsPerParagraph(250); }}
                    className="h-7 text-[11px]"
                  >
                    Standard (25 / 250)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setMaxWordsPerSentence(20); setMaxWordsPerParagraph(150); }}
                    className="h-7 text-[11px]"
                  >
                    Concise (20 / 150)
                  </Button>
                </div>
              </div>

              {/* Top Word Frequency list */}
              {frequencyList.length > 0 && (
                <div className="pt-2 border-t border-border/50 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span>Top Words</span>
                    <div className="flex items-center gap-1.5 font-normal text-[11px] text-muted-foreground">
                      <span>Filter stop-words:</span>
                      <Switch
                        checked={stopWordsFilter}
                        onCheckedChange={setStopWordsFilter}
                        className="scale-75"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {frequencyList.slice(0, 8).map((item, fIdx) => (
                      <div key={fIdx} className="flex items-center justify-between text-xs">
                        <span className="font-mono text-foreground font-medium">{item.word}</span>
                        <span className="text-muted-foreground">{item.count}x ({item.percentage}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
