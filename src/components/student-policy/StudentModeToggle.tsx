import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, ChevronDown, ChevronUp, Sparkles, BookOpen } from 'lucide-react';

interface StudentModeToggleProps {
  isOpen: boolean;
  onToggle: () => void;
  hasPolicyLoaded?: boolean;
  declaredCount?: number;
}

export const StudentModeToggle: React.FC<StudentModeToggleProps> = ({
  isOpen,
  onToggle,
  hasPolicyLoaded = false,
  declaredCount = 0,
}) => {
  return (
    <div className="flex items-center justify-between py-2 px-1">
      <Button
        type="button"
        variant="ghost"
        onClick={onToggle}
        className="group relative flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-foreground/90 hover:text-foreground hover:bg-accent/10 rounded-lg border border-border/70 transition-all shadow-xs"
        aria-expanded={isOpen}
        aria-controls="student-mode-guidance-panel"
      >
        <div className="flex items-center justify-center w-6 h-6 rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
          <GraduationCap className="w-3.5 h-3.5" />
        </div>
        <span className="font-semibold text-xs md:text-sm tracking-tight text-left">
          Student? Check your assignment’s AI rules.
        </span>
        {hasPolicyLoaded && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-0 font-medium">
            Policy Active
          </Badge>
        )}
        {declaredCount > 0 && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-border font-medium">
            {declaredCount} declared
          </Badge>
        )}
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground ml-1 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground ml-1 shrink-0" />
        )}
      </Button>
    </div>
  );
};
