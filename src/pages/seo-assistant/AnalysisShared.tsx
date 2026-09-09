// Shared UI helpers for analysis sidebar modules
import { ReactNode, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ModuleProps {
  title: string;
  score?: number;
  scoreLabel?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  badgeVariant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
}

function scoreColor(score: number) {
  if (score >= 80) return 'text-success';
  if (score >= 50) return 'text-warning';
  return 'text-destructive';
}

function scoreBg(score: number) {
  if (score >= 80) return 'border-success/30 bg-success/5';
  if (score >= 50) return 'border-warning/30 bg-warning/5';
  return 'border-destructive/30 bg-destructive/5';
}

export function ScoreRing({ score, size = 56 }: { score: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 80 ? '#10B981' : score >= 50 ? '#F59E0B' : '#DC2626';
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease' }} />
      </svg>
      <span className={`absolute text-xs font-bold ${scoreColor(score)}`}>{score}</span>
    </div>
  );
}

export function MiniScoreBar({ score, label }: { score: number; label: string }) {
  const color = score >= 80 ? 'bg-success' : score >= 50 ? 'bg-warning' : 'bg-destructive';
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-24 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden min-w-0">
        <div className={`h-1.5 rounded-full ${color} transition-all`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-xs font-semibold w-7 text-right shrink-0 ${scoreColor(score)}`}>{score}</span>
    </div>
  );
}

export function Rec({ text }: { text: string }) {
  return (
    <li className="text-xs text-muted-foreground text-pretty leading-relaxed">
      <span className="text-primary mr-1">→</span>{text}
    </li>
  );
}

export function AnalysisModule({ title, score, children, defaultOpen = true }: ModuleProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`border rounded-lg overflow-hidden ${score !== undefined ? scoreBg(score) : 'border-border bg-card'}`}>
      <button
        className="w-full flex items-center justify-between px-3 py-2.5 text-left"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-semibold text-navy truncate">{title}</span>
          {score !== undefined && (
            <Badge variant="outline" className={`text-[10px] py-0 h-4 px-1.5 shrink-0 ${
              score >= 80 ? 'border-success/40 text-success bg-success/10' :
              score >= 50 ? 'border-warning/40 text-warning bg-warning/10' :
              'border-destructive/40 text-destructive bg-destructive/10'
            }`}>
              {score}
            </Badge>
          )}
        </div>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
      </button>
      {open && <div className="px-3 pb-3 flex flex-col gap-2">{children}</div>}
    </div>
  );
}

export function CheckItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`text-xs font-bold shrink-0 ${ok ? 'text-success' : 'text-muted-foreground/50'}`}>{ok ? '✓' : '✗'}</span>
      <span className={`text-xs ${ok ? 'text-foreground/80' : 'text-muted-foreground'}`}>{label}</span>
    </div>
  );
}
