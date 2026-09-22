import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Code2,
  GraduationCap,
  PenTool,
  Building2,
  Search,
  Check,
  AlertCircle,
  Briefcase,
  Sparkles,
} from 'lucide-react';
import type { AudienceUseCaseItem } from '@/types/directory';

interface ProductAudienceUseCasesProps {
  productName: string;
  useCases?: AudienceUseCaseItem[];
}

export function ProductAudienceUseCases({
  productName,
  useCases,
}: ProductAudienceUseCasesProps) {
  if (!useCases || useCases.length === 0) {
    return null;
  }

  return (
    <div id="use-cases" className="space-y-6 scroll-mt-24">
      <div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-foreground">
            Audience-Specific Practical Workflows & Fit
          </h2>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Objective evaluation of {productName}'s effectiveness across distinct user personas, technical workflows, and operational guardrails.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {useCases.map((uc, index) => (
          <Card key={index} className="bg-card border-border rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
            <CardHeader className="p-4 sm:p-5 bg-muted/20 border-b border-border/60">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  {uc.persona}
                </CardTitle>
                <Badge variant="outline" className="text-[10px] py-0 h-4">
                  Persona Guide
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-5 space-y-4 flex-1 text-xs">
              {/* Value Add & Benefits */}
              <div className="space-y-1.5">
                <span className="font-bold text-foreground block text-[11px] uppercase tracking-wider">
                  Key Practical Benefits
                </span>
                <ul className="space-y-1 text-muted-foreground">
                  {uc.benefits.map((b, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommended Workflows */}
              <div className="space-y-1.5 pt-2 border-t border-border/40">
                <span className="font-bold text-foreground block text-[11px] uppercase tracking-wider">
                  Recommended Workflow Integration
                </span>
                <ul className="space-y-1 text-muted-foreground">
                  {uc.recommendedWorkflows.map((w, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-primary font-bold">•</span>
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Limitations */}
              {uc.importantLimitations && uc.importantLimitations.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-1 mt-auto">
                  <span className="font-bold text-amber-600 dark:text-amber-400 text-[11px] flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Important Persona Limitations
                  </span>
                  <ul className="space-y-0.5 text-muted-foreground text-[11px]">
                    {uc.importantLimitations.map((lim, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-amber-500 font-bold">•</span>
                        <span>{lim}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
