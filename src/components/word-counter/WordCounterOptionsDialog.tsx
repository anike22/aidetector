import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  SlidersHorizontal,
  Type,
  Gauge,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  
  visibleStats: {
    words: boolean;
    characters: boolean;
    noSpaces: boolean;
    sentences: boolean;
    paragraphs: boolean;
    readingTime: boolean;
    speakingTime: boolean;
  };
  setVisibleStats: React.Dispatch<React.SetStateAction<{
    words: boolean;
    characters: boolean;
    noSpaces: boolean;
    sentences: boolean;
    paragraphs: boolean;
    readingTime: boolean;
    speakingTime: boolean;
  }>>;

  fontSize: number;
  setFontSize: (size: number) => void;
  fontFamily: 'sans' | 'serif' | 'mono';
  setFontFamily: (font: 'sans' | 'serif' | 'mono') => void;
  lineHeight: 'normal' | 'relaxed' | 'loose';
  setLineHeight: (lh: 'normal' | 'relaxed' | 'loose') => void;
  isSpellcheckEnabled: boolean;
  setIsSpellcheckEnabled: (enabled: boolean) => void;

  readingWpm: number;
  setReadingWpm: (wpm: number) => void;
  speakingWpm: number;
  setSpeakingWpm: (wpm: number) => void;

  maxWordsPerSentence: number;
  setMaxWordsPerSentence: (max: number) => void;
  maxWordsPerParagraph: number;
  setMaxWordsPerParagraph: (max: number) => void;

  onResetDefaults: () => void;
}

export function WordCounterOptionsDialog({
  isOpen,
  onOpenChange,
  visibleStats,
  setVisibleStats,
  fontSize,
  setFontSize,
  fontFamily,
  setFontFamily,
  lineHeight,
  setLineHeight,
  isSpellcheckEnabled,
  setIsSpellcheckEnabled,
  readingWpm,
  setReadingWpm,
  speakingWpm,
  setSpeakingWpm,
  maxWordsPerSentence,
  setMaxWordsPerSentence,
  maxWordsPerParagraph,
  setMaxWordsPerParagraph,
  onResetDefaults,
}: Props) {
  const toggleStat = (key: keyof typeof visibleStats) => {
    setVisibleStats(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleReadingSpeedChange = (val: number) => {
    const valid = Math.min(600, Math.max(50, isNaN(val) ? 225 : val));
    setReadingWpm(valid);
  };

  const handleSpeakingSpeedChange = (val: number) => {
    const valid = Math.min(400, Math.max(40, isNaN(val) ? 130 : val));
    setSpeakingWpm(valid);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg p-5 max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-primary" />
            Word Counter Settings &amp; Preferences
          </DialogTitle>
          <DialogDescription className="text-xs">
            Customize displayed metrics, calculation speeds, typography, and writing limits.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="speeds" className="w-full mt-2">
          <TabsList className="grid grid-cols-4 w-full h-8 p-1">
            <TabsTrigger value="speeds" className="text-xs gap-1">
              <Gauge className="w-3 h-3" />
              Speeds
            </TabsTrigger>
            <TabsTrigger value="display" className="text-xs gap-1">
              <SlidersHorizontal className="w-3 h-3" />
              Metrics
            </TabsTrigger>
            <TabsTrigger value="typography" className="text-xs gap-1">
              <Type className="w-3 h-3" />
              Editor
            </TabsTrigger>
            <TabsTrigger value="limits" className="text-xs gap-1">
              <ShieldCheck className="w-3 h-3" />
              Limits
            </TabsTrigger>
          </TabsList>

          {/* 1. Speeds Tab */}
          <TabsContent value="speeds" className="space-y-4 pt-3 text-xs">
            <div className="p-3 bg-muted/30 border border-border/50 rounded-lg space-y-1">
              <span className="font-semibold text-foreground">Duration Calculations</span>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Reading and speaking times are calculated as: <code className="font-mono text-primary font-semibold">seconds = round(words / WPM * 60)</code>.
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="reading-wpm-input" className="text-xs font-medium">
                    Reading Speed (WPM):
                  </Label>
                  <span className="font-mono text-xs font-bold text-primary">{readingWpm} words/min</span>
                </div>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[readingWpm]}
                    min={100}
                    max={450}
                    step={5}
                    onValueChange={(val) => handleReadingSpeedChange(val[0])}
                    className="flex-1"
                  />
                  <Input
                    id="reading-wpm-input"
                    type="number"
                    min="50"
                    max="600"
                    value={readingWpm}
                    onChange={(e) => handleReadingSpeedChange(parseInt(e.target.value, 10))}
                    className="w-18 h-8 text-xs font-mono text-center"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Default: 225 WPM (average adult silent reading speed).
                </p>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-border/40">
                <div className="flex items-center justify-between">
                  <Label htmlFor="speaking-wpm-input" className="text-xs font-medium">
                    Speaking Speed (WPM):
                  </Label>
                  <span className="font-mono text-xs font-bold text-primary">{speakingWpm} words/min</span>
                </div>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[speakingWpm]}
                    min={80}
                    max={250}
                    step={5}
                    onValueChange={(val) => handleSpeakingSpeedChange(val[0])}
                    className="flex-1"
                  />
                  <Input
                    id="speaking-wpm-input"
                    type="number"
                    min="40"
                    max="400"
                    value={speakingWpm}
                    onChange={(e) => handleSpeakingSpeedChange(parseInt(e.target.value, 10))}
                    className="w-18 h-8 text-xs font-mono text-center"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Default: 130 WPM (average presentation/speech pace).
                </p>
              </div>
            </div>
          </TabsContent>

          {/* 2. Display Metrics Tab */}
          <TabsContent value="display" className="space-y-3 pt-3 text-xs">
            <p className="text-muted-foreground text-[11px]">
              Toggle visibility of individual cards in the top statistics bar:
            </p>

            <div className="space-y-2.5">
              {[
                { key: 'words' as const, label: 'Words Count', desc: 'Total document words' },
                { key: 'characters' as const, label: 'Characters (with spaces)', desc: 'Total graphemes' },
                { key: 'noSpaces' as const, label: 'Characters (without spaces)', desc: 'Non-whitespace characters' },
                { key: 'sentences' as const, label: 'Sentences Count', desc: 'Sentence segmentation & limits' },
                { key: 'paragraphs' as const, label: 'Paragraphs Count', desc: 'Paragraphs & line breaks' },
                { key: 'readingTime' as const, label: 'Reading Time Estimate', desc: 'Estimated silent reading duration' },
                { key: 'speakingTime' as const, label: 'Speaking Time Estimate', desc: 'Estimated spoken presentation duration' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between p-2 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                  <div>
                    <span className="font-medium text-foreground block">{item.label}</span>
                    <span className="text-[10px] text-muted-foreground">{item.desc}</span>
                  </div>
                  <Switch
                    checked={visibleStats[item.key]}
                    onCheckedChange={() => toggleStat(item.key)}
                    className="scale-75"
                  />
                </div>
              ))}
            </div>
          </TabsContent>

          {/* 3. Typography & Editor Tab */}
          <TabsContent value="typography" className="space-y-3 pt-3 text-xs">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="font-size-slider" className="text-xs font-medium">
                  Editor Font Size:
                </Label>
                <span className="font-mono text-xs">{fontSize}px</span>
              </div>
              <Slider
                id="font-size-slider"
                value={[fontSize]}
                min={12}
                max={24}
                step={1}
                onValueChange={(val) => setFontSize(val[0])}
              />
            </div>

            <div className="space-y-1.5 pt-2 border-t border-border/40">
              <Label className="text-xs font-medium">Font Family:</Label>
              <div className="grid grid-cols-3 gap-2">
                {(['sans', 'serif', 'mono'] as const).map(font => (
                  <Button
                    key={font}
                    type="button"
                    variant={fontFamily === font ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFontFamily(font)}
                    className="h-8 text-xs capitalize"
                  >
                    {font === 'sans' ? 'Sans-Serif' : font === 'serif' ? 'Serif' : 'Monospace'}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-border/40">
              <Label className="text-xs font-medium">Line Height:</Label>
              <div className="grid grid-cols-3 gap-2">
                {(['normal', 'relaxed', 'loose'] as const).map(lh => (
                  <Button
                    key={lh}
                    type="button"
                    variant={lineHeight === lh ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLineHeight(lh)}
                    className="h-8 text-xs capitalize"
                  >
                    {lh}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/40">
              <div>
                <span className="font-medium text-foreground block">Browser Spellcheck</span>
                <span className="text-[10px] text-muted-foreground">Highlight browser misspelled words</span>
              </div>
              <Switch
                checked={isSpellcheckEnabled}
                onCheckedChange={setIsSpellcheckEnabled}
                className="scale-75"
              />
            </div>
          </TabsContent>

          {/* 4. Writing Limits Tab */}
          <TabsContent value="limits" className="space-y-3 pt-3 text-xs">
            <p className="text-muted-foreground text-[11px]">
              Set warning thresholds to identify run-on sentences and overly dense paragraphs.
            </p>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="sentence-limit-input" className="text-xs font-medium">
                  Max Words per Sentence:
                </Label>
                <span className="font-mono text-xs font-bold text-primary">{maxWordsPerSentence} words</span>
              </div>
              <Input
                id="sentence-limit-input"
                type="number"
                min="10"
                max="100"
                value={maxWordsPerSentence}
                onChange={(e) => setMaxWordsPerSentence(Math.max(5, parseInt(e.target.value, 10) || 25))}
                className="h-8 text-xs"
              />
              <p className="text-[10px] text-muted-foreground">
                Sentences with more than this limit will be highlighted with an alert.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-border/40">
              <div className="flex items-center justify-between">
                <Label htmlFor="paragraph-limit-input" className="text-xs font-medium">
                  Max Words per Paragraph:
                </Label>
                <span className="font-mono text-xs font-bold text-primary">{maxWordsPerParagraph} words</span>
              </div>
              <Input
                id="paragraph-limit-input"
                type="number"
                min="50"
                max="1000"
                value={maxWordsPerParagraph}
                onChange={(e) => setMaxWordsPerParagraph(Math.max(20, parseInt(e.target.value, 10) || 250))}
                className="h-8 text-xs"
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex flex-row items-center justify-between pt-3 border-t border-border/60">
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetDefaults}
            className="text-xs text-muted-foreground hover:text-foreground gap-1 px-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </Button>
          <Button
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs bg-primary text-primary-foreground"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
