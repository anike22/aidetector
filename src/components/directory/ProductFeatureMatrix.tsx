import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Check,
  X,
  AlertCircle,
  HelpCircle,
  Layers,
  Code2,
  FileText,
  Brain,
  MessageSquare,
  ShieldAlert,
  Sparkles,
  Lock,
} from 'lucide-react';
import type { FeatureCategoryGroup, FeatureAvailabilityItem } from '@/types/directory';

interface ProductFeatureMatrixProps {
  productName: string;
  featureGroups?: FeatureCategoryGroup[];
  availabilityMatrix?: FeatureAvailabilityItem[];
}

export function ProductFeatureMatrix({
  productName,
  featureGroups,
  availabilityMatrix,
}: ProductFeatureMatrixProps) {
  if ((!featureGroups || featureGroups.length === 0) && (!availabilityMatrix || availabilityMatrix.length === 0)) {
    return null;
  }

  return (
    <div id="features" className="space-y-8 scroll-mt-24">
      <div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-foreground">
            Structured Feature Analysis & Capability Breakdown
          </h2>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Detailed technical evaluation of {productName}'s core capabilities, workflow integrations, and practical boundaries.
        </p>
      </div>

      {/* Categorized Feature Cards */}
      {featureGroups && featureGroups.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {featureGroups.map((group, idx) => (
            <Card key={idx} className="bg-card border-border rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
              <CardHeader className="p-4 sm:p-5 bg-muted/20 border-b border-border/60">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-primary" />
                    {group.category}
                  </CardTitle>
                </div>
                <CardDescription className="text-xs text-muted-foreground mt-1">
                  {group.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-4 sm:p-5 space-y-4 flex-1">
                {group.features.map((feat, fIdx) => (
                  <div
                    key={fIdx}
                    className="p-3.5 rounded-xl bg-background/80 border border-border/70 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-foreground">{feat.name}</span>
                      <Badge variant="outline" className="text-[10px] py-0 h-4 border-primary/30 text-primary font-medium">
                        {feat.availabilityTier}
                      </Badge>
                    </div>

                    <p className="text-muted-foreground leading-relaxed">{feat.description}</p>

                    <div className="pt-2 border-t border-border/40 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-muted-foreground font-medium block text-[10px] uppercase tracking-wider">
                          Best Suited For
                        </span>
                        <span className="text-foreground">{feat.targetAudience}</span>
                      </div>
                      {feat.limitations && (
                        <div>
                          <span className="text-amber-500 font-medium block text-[10px] uppercase tracking-wider">
                            Boundaries & Caveats
                          </span>
                          <span className="text-muted-foreground">{feat.limitations}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Feature Availability Matrix Table */}
      {availabilityMatrix && availabilityMatrix.length > 0 && (
        <Card className="bg-card border-border rounded-2xl overflow-hidden shadow-sm">
          <CardHeader className="p-4 sm:p-5 border-b border-border">
            <CardTitle className="text-sm font-bold text-foreground">
              Official Feature Availability Matrix
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Verified tier gating, platform restrictions, and plan requirements for {productName}.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-xs">Feature / Capability</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Required Plan</TableHead>
                    <TableHead className="text-xs">Supported Platforms</TableHead>
                    <TableHead className="text-xs">Verification Notes</TableHead>
                    <TableHead className="text-xs text-right">Audit Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {availabilityMatrix.map((item, i) => (
                    <TableRow key={i} className="border-border hover:bg-muted/30">
                      <TableCell className="font-semibold text-xs text-foreground">
                        {item.featureName}
                      </TableCell>
                      <TableCell>
                        {item.isAvailable === true && (
                          <Badge className="text-[10px] py-0 h-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1 font-medium">
                            <Check className="w-3 h-3" /> Available
                          </Badge>
                        )}
                        {item.isAvailable === 'partial' && (
                          <Badge className="text-[10px] py-0 h-4 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1 font-medium">
                            <AlertCircle className="w-3 h-3" /> Partial
                          </Badge>
                        )}
                        {item.isAvailable === false && (
                          <Badge variant="outline" className="text-[10px] py-0 h-4 text-muted-foreground gap-1">
                            <X className="w-3 h-3" /> Unavailable
                          </Badge>
                        )}
                        {item.isAvailable === 'unverified' && (
                          <Badge variant="secondary" className="text-[10px] py-0 h-4 gap-1">
                            <HelpCircle className="w-3 h-3" /> Unverified
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs font-medium text-foreground">
                        {item.requiredPlan}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {item.supportedPlatforms.join(', ')}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[240px]">
                        {item.verificationNotes}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground text-right font-mono">
                        {item.lastVerified}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
