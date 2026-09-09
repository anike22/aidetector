// EssayNavbar — phase stepper + essay title + autosave indicator + back nav
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Check, AlertCircle, Loader2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEssayStudio } from '@/contexts/EssayStudioContext';
import type { EssayPhase } from '@/types/essay';
import { PHASE_LABELS, PHASE_ORDER } from '@/types/essay';

interface Props {
  essayId: string;
  currentPhase: EssayPhase;
  onPhaseChange: (phase: EssayPhase) => void;
}

const SAVE_ICONS = {
  idle: null,
  saving: Loader2,
  saved: Check,
  error: AlertCircle,
};

const SAVE_LABELS = {
  idle: '',
  saving: 'Saving…',
  saved: 'Saved',
  error: 'Save failed',
};

const SAVE_COLORS = {
  idle: '',
  saving: 'text-muted-foreground',
  saved: 'text-success',
  error: 'text-destructive',
};

export default function EssayNavbar({ essayId, currentPhase, onPhaseChange }: Props) {
  const navigate = useNavigate();
  const { essay, saveStatus, saveNow } = useEssayStudio();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentIdx = PHASE_ORDER.indexOf(currentPhase);
  const SaveIcon = SAVE_ICONS[saveStatus];

  // Close mobile menu on phase change
  useEffect(() => { setMobileMenuOpen(false); }, [currentPhase]);

  return (
    <header className="sticky top-0 z-40 bg-background border-b border-border">
      <div className="flex items-center h-14 px-3 md:px-4 gap-2">
        {/* Back */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => navigate('/essay-studio')}
          aria-label="Back to Essay Studio"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        {/* Essay title */}
        <div className="flex-1 min-w-0 hidden md:block">
          <span className="text-sm font-medium truncate">
            {essay?.title || 'Loading…'}
          </span>
        </div>

        {/* Desktop phase stepper */}
        <nav className="hidden md:flex items-center gap-0.5 flex-1 justify-center" aria-label="Essay phases">
          {PHASE_ORDER.map((phase, idx) => {
            const isActive = phase === currentPhase;
            const isPast = idx < currentIdx;
            return (
              <button
                key={phase}
                onClick={() => onPhaseChange(phase)}
                className={`
                  flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors
                  ${isActive ? 'bg-primary text-primary-foreground' : ''}
                  ${isPast && !isActive ? 'text-success' : ''}
                  ${!isActive && !isPast ? 'text-muted-foreground hover:text-foreground hover:bg-muted' : ''}
                `}
              >
                {isPast && !isActive && <Check className="h-3 w-3" />}
                {PHASE_LABELS[phase]}
              </button>
            );
          })}
        </nav>

        {/* Mobile phase name */}
        <div className="flex md:hidden flex-1 min-w-0 items-center gap-1.5">
          <span className="text-xs text-muted-foreground">
            {essay?.title ? essay.title.slice(0, 20) + (essay.title.length > 20 ? '…' : '') : ''}
          </span>
          <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
          <span className="text-xs font-semibold text-primary">{PHASE_LABELS[currentPhase]}</span>
        </div>

        {/* Autosave status */}
        {saveStatus !== 'idle' && (
          <span className={`text-xs hidden md:flex items-center gap-1 shrink-0 ${SAVE_COLORS[saveStatus]}`}>
            {SaveIcon && (
              <SaveIcon className={`h-3.5 w-3.5 ${saveStatus === 'saving' ? 'animate-spin' : ''}`} />
            )}
            {SAVE_LABELS[saveStatus]}
          </span>
        )}

        {/* Manual save */}
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={saveNow} aria-label="Save now">
          <Save className="h-3.5 w-3.5" />
        </Button>

        {/* Mobile phase menu toggle */}
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden h-8 text-xs px-2"
          onClick={() => setMobileMenuOpen(o => !o)}
        >
          Phases
        </Button>
      </div>

      {/* Mobile phase dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-background border-t border-border px-3 py-2">
          <div className="flex flex-wrap gap-1.5">
            {PHASE_ORDER.map((phase, idx) => {
              const isActive = phase === currentPhase;
              const isPast = idx < currentIdx;
              return (
                <button
                  key={phase}
                  onClick={() => onPhaseChange(phase)}
                  className={`
                    flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors
                    ${isActive ? 'bg-primary text-primary-foreground' : ''}
                    ${isPast && !isActive ? 'bg-success/10 text-success' : ''}
                    ${!isActive && !isPast ? 'bg-muted text-muted-foreground' : ''}
                  `}
                >
                  {isPast && !isActive && <Check className="h-3 w-3" />}
                  {PHASE_LABELS[phase]}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
