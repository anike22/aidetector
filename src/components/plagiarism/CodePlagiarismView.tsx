import React from 'react';
import type { CodePlagiarismMatch } from '@/lib/plagiarism/codePlagiarismEngine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Code, ExternalLink, Terminal, ShieldCheck, AlertTriangle } from 'lucide-react';

interface Props {
  matches: CodePlagiarismMatch[];
}

export function CodePlagiarismView({ matches }: Props) {
  if (!matches || matches.length === 0) {
    return (
      <Card className="border-border shadow-sm">
        <CardContent className="p-6 text-center text-muted-foreground text-sm">
          <Terminal className="w-8 h-8 mx-auto mb-2 text-muted-foreground/60" />
          No proprietary source code plagiarism or AST structure duplication detected.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-lg border border-border">
        <strong>Abstract Syntax Token Analysis:</strong> Evaluates control flow, cyclomatic complexity, and algorithmic structure invariant to variable renaming, comment stripping, or whitespace changes. Standard library routines are classified safely.
      </div>

      <div className="grid grid-cols-1 gap-3">
        {matches.map((m) => (
          <Card key={m.id} className="border-border shadow-sm text-xs">
            <CardHeader className="py-2.5 px-4 border-b border-border flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-primary" />
                <CardTitle className="text-sm font-bold text-foreground">
                  {m.matchedRepositoryOrSource}
                </CardTitle>
                <Badge variant="outline" className="uppercase text-[10px]">{m.language}</Badge>
              </div>
              <div className="flex items-center gap-2">
                {m.isStandardLibraryOrTrivial ? (
                  <Badge variant="outline" className="text-success border-success/30 bg-success/5">
                    <ShieldCheck className="w-3 h-3 mr-1" /> Standard Boilerplate
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
                    <AlertTriangle className="w-3 h-3 mr-1" /> Code Duplication
                  </Badge>
                )}
                <Badge variant="secondary">{m.overallConfidence}% Match</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-3.5 flex flex-col gap-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Token Similarity: {m.tokenSimilarityScore}%</span>
                <span>Control Flow Alignment: {m.structureAlignmentScore}%</span>
              </div>
              <p className="text-muted-foreground">{m.explanation}</p>
              {m.detectedObfuscations.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {m.detectedObfuscations.map((ob, i) => (
                    <Badge key={i} variant="outline" className="text-[10px]">{ob}</Badge>
                  ))}
                </div>
              )}
              <div className="pt-2 border-t border-border flex justify-end">
                <a
                  href={m.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1 font-medium"
                >
                  <ExternalLink className="w-3 h-3" /> View Code Repository
                </a>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
