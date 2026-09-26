import React, { useState } from 'react';
import type { ForensicEvidenceMatch } from '@/lib/plagiarism/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ExternalLink, ShieldCheck, AlertTriangle } from 'lucide-react';

interface Props {
  matches: ForensicEvidenceMatch[];
}

export function SideBySideEvidenceMap({ matches }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!matches || matches.length === 0) {
    return (
      <Card className="border-border shadow-sm">
        <CardContent className="p-8 text-center text-muted-foreground text-sm">
          No overlapping passages or plagiarism evidence found. All text appears unique against verified indexes.
        </CardContent>
      </Card>
    );
  }

  const currentMatch = matches[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : matches.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < matches.length - 1 ? prev + 1 : 0));
  };

  return (
    <Card className="border-[#1b2649] bg-[#0b1224] shadow-xl text-slate-100">
      <CardHeader className="py-3.5 px-4 border-b border-[#1b2649] flex flex-row items-center justify-between bg-[#0c152e]">
        <div className="flex items-center gap-2 flex-wrap">
          <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
            <span>Evidence Match #{currentIndex + 1} of {matches.length}</span>
          </CardTitle>
          <Badge className="bg-[#19274e] text-indigo-300 border border-[#2d3f74] text-xs font-semibold">
            {currentMatch.categoryLabel}
          </Badge>
          <Badge className="bg-[#122b22] text-emerald-300 border border-emerald-500/30 text-xs">
            {currentMatch.confidence}% Confidence
          </Badge>
        </div>
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 bg-[#121c3b] hover:bg-[#1a2850] text-slate-200 hover:text-white border border-[#21315e]" onClick={handlePrev}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 bg-[#121c3b] hover:bg-[#1a2850] text-slate-200 hover:text-white border border-[#21315e]" onClick={handleNext}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-5 flex flex-col gap-4 text-sm bg-[#080d1b]">
        {/* Side-by-side comparison boxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left: Submitted text */}
          <div className="flex flex-col gap-2 p-4 bg-rose-950/20 border border-rose-500/30 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wide">
                Submitted Passage
              </span>
              <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30 text-[10px]">
                Target Content
              </Badge>
            </div>
            <p className="text-xs md:text-sm text-slate-100 leading-relaxed whitespace-pre-wrap bg-rose-950/30 p-2.5 rounded border border-rose-500/20">
              "{currentMatch.submittedPassage}"
            </p>
          </div>

          {/* Right: Discovered source text */}
          <div className="flex flex-col gap-2 p-4 bg-[#0e172a] border border-[#21315e] rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-wide">
                Matched Source Passage
              </span>
              <Badge className="bg-[#1a264a] text-indigo-300 border border-[#2b3d73] text-[10px]">
                {currentMatch.sourceProvider?.toUpperCase() || 'SCHOLARLY'}
              </Badge>
            </div>
            <p className="text-xs md:text-sm text-slate-100 leading-relaxed whitespace-pre-wrap bg-[#131d3b] p-2.5 rounded border border-[#21315e]">
              "{currentMatch.sourcePassage}"
            </p>
          </div>
        </div>

        {/* Attribution and Source footer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-[#1b2649] text-xs">
          <div className="flex items-start gap-2.5 bg-[#0e172a] p-3 rounded-xl border border-[#21315e]">
            {currentMatch.attributionStatus === 'properly_cited' ? (
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div>
              <span className="font-semibold text-white">Attribution Assessment: </span>
              <p className="text-slate-300 mt-0.5 leading-relaxed">{currentMatch.attributionExplanation}</p>
            </div>
          </div>

          <div className="flex flex-col gap-1 bg-[#0e172a] p-3 rounded-xl border border-[#21315e]">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-white truncate">
                {currentMatch.sourceTitle}
              </span>
              <Badge className="bg-[#19274e] text-indigo-300 border border-[#2d3f74] text-[10px] shrink-0">
                {currentMatch.sourceProvider}
              </Badge>
            </div>
            <div className="text-slate-400 text-[11px]">Publisher: <span className="text-slate-200">{currentMatch.sourcePublisher}</span></div>
            {currentMatch.sourceDoi && (
              <div className="text-slate-400 text-[11px]">DOI: <span className="text-indigo-300 font-mono">{currentMatch.sourceDoi}</span></div>
            )}
            <a
              href={currentMatch.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium truncate mt-1"
            >
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{currentMatch.sourceUrl}</span>
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
