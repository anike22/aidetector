import { useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { RotateCcw, X, Check } from 'lucide-react';
import type { HumanizerSettings } from '@/types/humanizer';

interface Props {
  value: HumanizerSettings;
  onChange: (next: HumanizerSettings) => void;
  onApply: () => void;
  onCancel: () => void;
  onReset: () => void;
  className?: string;
  mode?: 'sheet' | 'inline';
}

export default function AdvancedControlsPanel({
  value,
  onChange,
  onApply,
  onCancel,
  onReset,
  className,
  mode = 'inline',
}: Props) {
  const tabsRef = useRef<HTMLDivElement>(null);

  const update = <K extends keyof HumanizerSettings>(key: K, v: HumanizerSettings[K]) => {
    onChange({ ...value, [key]: v });
  };

  const tabs = [
    { id: 'style', label: 'Style & Cadence' },
    { id: 'preservation', label: 'Entity Preservation' },
    { id: 'structure', label: 'Structure & Flow' },
    { id: 'custom', label: 'Custom Instructions' },
  ] as const;

  return (
    <div className={`flex flex-col h-full ${className ?? ''}`}>
      <div ref={tabsRef} className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-0 pb-4">
        <Tabs defaultValue="style" className="w-full">
          <TabsList
            className="w-full justify-start mb-4 bg-muted/60 p-1 rounded-lg overflow-x-auto no-scrollbar"
            aria-label="Advanced controls sections"
          >
            {tabs.map((t) => (
              <TabsTrigger
                key={t.id}
                value={t.id}
                className="flex-shrink-0 px-3 py-2 text-sm whitespace-nowrap data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md"
              >
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="style" className="space-y-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Writing Style Mode</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'standard', label: 'Standard', desc: 'Balanced clarity for general reading', badge: 'Versatile' },
                  { id: 'academic', label: 'Academic', desc: 'Scholarly register, citations & methodology', badge: 'Research' },
                  { id: 'professional', label: 'Professional', desc: 'Executive reports & industry whitepapers', badge: 'Executive' },
                  { id: 'conversational', label: 'Conversational', desc: 'Natural cadence, warmth & flow', badge: 'Engaging' },
                  { id: 'technical', label: 'Technical', desc: 'Precise terminology, code & exact units', badge: 'Precise' },
                  { id: 'marketing', label: 'Marketing', desc: 'Value-driven persuasive storytelling', badge: 'Persuasive' }
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => update('style', s.id as any)}
                    className={`text-left p-2.5 rounded-lg border text-xs transition-all ${
                      (value.style || 'standard') === s.id
                        ? 'border-primary bg-primary/10 text-primary font-medium ring-1 ring-primary'
                        : 'border-border bg-card hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-foreground">{s.label}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{s.badge}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-tight">{s.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <Label htmlFor="styleReferenceSample" className="text-sm font-medium flex items-center gap-1.5">
                  Writing Style Reference Sample (Optional)
                </Label>
                <span className="text-[11px] text-muted-foreground">Private & Non-Training</span>
              </div>
              <Textarea
                id="styleReferenceSample"
                placeholder="Paste a sample (100-300 words) of your authentic writing. The engine matches cadence, rhythm, and vocabulary density without copying the sample content."
                value={value.styleReferenceSample || ''}
                onChange={(e) => update('styleReferenceSample', e.target.value)}
                className="min-h-[90px] text-xs resize-y"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border">
              <ControlSwitch label="Reduce Passive Voice" checked={value.reducePassiveVoice} onChange={(v) => update('reducePassiveVoice', v)} />
              <ControlSwitch label="Emotional Warmth" checked={value.increaseEmotionalWarmth} onChange={(v) => update('increaseEmotionalWarmth', v)} />
              <ControlSwitch label="Reduce Formality" checked={value.reduceFormality} onChange={(v) => update('reduceFormality', v)} />
              <ControlSwitch label="Allow Contractions" checked={value.allowContractions} onChange={(v) => update('allowContractions', v)} />
              <ControlSwitch
                label="British English"
                checked={value.useBritishEnglish}
                onChange={(v) => {
                  update('useBritishEnglish', v);
                  if (v) update('useAmericanEnglish', false);
                }}
              />
              <ControlSwitch
                label="American English"
                checked={value.useAmericanEnglish}
                onChange={(v) => {
                  update('useAmericanEnglish', v);
                  if (v) update('useBritishEnglish', false);
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="preservation" className="space-y-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md">
            <div className="space-y-2">
              <Label htmlFor="wordsToPreserve-panel" className="text-sm font-medium">Locked Exact Terms (Comma-separated)</Label>
              <Input
                id="wordsToPreserve-panel"
                placeholder="e.g., AIDetector.cx, GPT-4o, Section 4.2, proprietary brand names"
                value={value.wordsToPreserve}
                onChange={(e) => update('wordsToPreserve', e.target.value)}
                className="h-10"
              />
              <p className="text-[11px] text-muted-foreground">Guaranteed 100% character-for-character preservation across all rewrites.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <ControlSwitch label="Preserve Facts & Numbers" checked={value.preserveFacts} onChange={(v) => update('preserveFacts', v)} />
              <ControlSwitch label="Preserve Keywords" checked={value.preserveKeywords} onChange={(v) => update('preserveKeywords', v)} />
              <ControlSwitch label="Preserve Citations ([1], [Smith])" checked={value.preserveCitations} onChange={(v) => update('preserveCitations', v)} />
              <ControlSwitch label="Preserve Markdown Formatting" checked={value.preserveFormatting} onChange={(v) => update('preserveFormatting', v)} />
              <ControlSwitch label="Preserve Paragraphs" checked={value.preserveParagraphStructure} onChange={(v) => update('preserveParagraphStructure', v)} />
              <ControlSwitch label="Preserve Tech Terms & Code" checked={value.preserveTechnicalTerminology} onChange={(v) => update('preserveTechnicalTerminology', v)} />
            </div>
          </TabsContent>

          <TabsContent value="structure" className="space-y-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ControlSwitch label="Shorten Text (Concise)" checked={value.shortenText} onChange={(v) => update('shortenText', v)} />
              <ControlSwitch label="Expand Explanations" checked={value.expandExplanations} onChange={(v) => update('expandExplanations', v)} />
              <ControlSwitch label="Sentence Variation" checked={value.increaseSentenceVariation} onChange={(v) => update('increaseSentenceVariation', v)} />
              <ControlSwitch label="Improve Transitions" checked={value.improveTransitions} onChange={(v) => update('improveTransitions', v)} />
              <ControlSwitch label="Remove Repetition" checked={value.removeRepetition} onChange={(v) => update('removeRepetition', v)} />
              <ControlSwitch label="Improve Clarity" checked={value.improveClarity} onChange={(v) => update('improveClarity', v)} />
            </div>
          </TabsContent>

          <TabsContent value="custom" className="space-y-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="wordsToAvoid-panel" className="text-sm">Words to Avoid</Label>
                <Input
                  id="wordsToAvoid-panel"
                  placeholder="e.g., delve, multifaceted, crucial"
                  value={value.wordsToAvoid}
                  onChange={(e) => update('wordsToAvoid', e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preferredTerminology-panel" className="text-sm">Preferred Terminology</Label>
                <Input
                  id="preferredTerminology-panel"
                  placeholder="e.g., use 'clients' instead of 'users'"
                  value={value.preferredTerminology}
                  onChange={(e) => update('preferredTerminology', e.target.value)}
                  className="h-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="brandVoiceInstructions-panel" className="text-sm">Brand Voice Instructions</Label>
              <Input
                id="brandVoiceInstructions-panel"
                placeholder="e.g., Direct, modern SaaS tone"
                value={value.brandVoiceInstructions}
                onChange={(e) => update('brandVoiceInstructions', e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="additionalInstructions-panel" className="text-sm">Additional Instructions</Label>
              <Textarea
                id="additionalInstructions-panel"
                placeholder="Any specific formatting or stylistic requirements..."
                value={value.additionalInstructions}
                onChange={(e) => update('additionalInstructions', e.target.value)}
                className="min-h-[100px] resize-none"
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div className="shrink-0 border-t bg-background px-4 py-4 space-y-3">
        {mode === 'inline' && (
          <p className="text-xs text-muted-foreground">
            Changes are saved to the form when you apply.
          </p>
        )}
        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-muted-foreground hover:text-destructive"
          >
            <RotateCcw className="w-4 h-4 mr-1.5" />
            Reset
          </Button>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onCancel} className="gap-1.5">
              <X className="w-4 h-4" />
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={onApply} className="gap-1.5 bg-primary text-primary-foreground">
              <Check className="w-4 h-4" />
              Apply Controls
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ControlSwitch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  const id = `${label.replace(/\s+/g, '-').toLowerCase()}-advanced`;
  return (
    <div className="flex items-center justify-between border rounded-md p-3 min-h-[52px] gap-3 bg-card/50">
      <Label htmlFor={id} className="cursor-pointer text-sm flex-1">
        {label}
      </Label>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        className="shrink-0"
        aria-label={label}
      />
    </div>
  );
}
