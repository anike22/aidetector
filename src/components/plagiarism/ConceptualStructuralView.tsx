import React from 'react';
import type { ConceptualSimilarityItem, StructuralSimilarityItem, CrossLingualMatch } from '@/lib/plagiarism/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, LayoutGrid, Languages, ExternalLink } from 'lucide-react';

interface Props {
  conceptual: ConceptualSimilarityItem[];
  structural: StructuralSimilarityItem[];
  crossLingual: CrossLingualMatch[];
}

export function ConceptualStructuralView({ conceptual, structural, crossLingual }: Props) {
  return (
    <div className="flex flex-col gap-5">
      {/* 1. Cross-Lingual Plagiarism */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <Languages className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Cross-Lingual Semantic Matches</h3>
          <Badge variant="secondary" className="text-xs">{crossLingual.length} detected</Badge>
        </div>
        {crossLingual.length === 0 ? (
          <p className="text-xs text-muted-foreground">No cross-lingual or translated passage matches detected.</p>
        ) : (
          crossLingual.map((xl) => (
            <Card key={xl.id} className="border-border shadow-sm text-xs">
              <CardContent className="p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">
                    {xl.sourceLanguage} → {xl.submittedLanguage}
                  </span>
                  <Badge variant="outline">{xl.confidence}% confidence</Badge>
                </div>
                <div className="p-2 bg-muted/40 rounded text-muted-foreground italic">
                  "{xl.submittedPassage}"
                </div>
                <span className="text-muted-foreground">{xl.translationPatternExplanation}</span>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 2. Conceptual Similarity */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-warning" />
          <h3 className="text-sm font-bold text-foreground">Conceptual & Framework Similarity</h3>
          <Badge variant="secondary" className="text-xs">{conceptual.length} detected</Badge>
        </div>
        {conceptual.length === 0 ? (
          <p className="text-xs text-muted-foreground">No overlapping conceptual frameworks or hypotheses flagged.</p>
        ) : (
          conceptual.map((c) => (
            <Card key={c.id} className="border-border shadow-sm text-xs">
              <CardContent className="p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">{c.conceptName}</span>
                  <Badge variant="outline">{c.similarityScore}% alignment</Badge>
                </div>
                <span className="text-muted-foreground">{c.description}</span>
                <div className="flex items-center justify-between text-muted-foreground pt-1 border-t border-border">
                  <span>Matched: {c.sourceTitle}</span>
                  <a href={c.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" /> View Source
                  </a>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 3. Structural Plagiarism */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Structural Document Similarity</h3>
          <Badge variant="secondary" className="text-xs">{structural.length} detected</Badge>
        </div>
        {structural.length === 0 ? (
          <p className="text-xs text-muted-foreground">Document architecture and heading progression are distinct.</p>
        ) : (
          structural.map((s) => (
            <Card key={s.id} className="border-border shadow-sm text-xs">
              <CardContent className="p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">{s.sectionTitle}</span>
                  <Badge variant="outline">{s.similarityScore}% structural match</Badge>
                </div>
                <span className="text-muted-foreground">{s.alignmentDetails}</span>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
