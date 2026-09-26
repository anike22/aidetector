import React, { useId } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, AlertCircle, Loader2 } from 'lucide-react';

export interface ImageAIProbabilityCupCardProps {
  /**
   * The AI probability score.
   * Documented scale: 0 to 100 (percentage).
   * Also supports 0.0 to 1.0 scale which will be normalized to 0-100.
   * Can be undefined/null for unavailable/loading states.
   */
  score?: number | null;
  /**
   * Status of the analysis
   */
  isLoading?: boolean;
  /**
   * Optional custom label
   */
  label?: string;
  /**
   * Optional custom supporting text
   */
  supportingText?: string;
  /**
   * Additional className
   */
  className?: string;
}

/**
 * Normalizes an AI probability value into an integer 0-100 or null if unavailable.
 * Treats valid 0 as 0 (not missing data).
 */
export function normalizeAIProbability(score?: number | null): number | null {
  if (score === undefined || score === null || isNaN(score)) {
    return null;
  }
  // If provided on a 0-1 floating scale (e.g., 0.78), normalize to 78
  if (score > 0 && score <= 1) {
    return Math.max(0, Math.min(100, Math.round(score * 100)));
  }
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Returns semantic color classes and hex/hsl fills for a given probability percentage.
 */
export function getProbabilityColorDetails(percentage: number) {
  if (percentage >= 70) {
    return {
      textColor: 'text-destructive',
      badgeVariant: 'destructive' as const,
      badgeText: 'High AI Probability',
      waterGradientStart: '#ef4444',
      waterGradientEnd: '#b91c1c',
      waterSurface: '#fca5a5',
      glowColor: 'rgba(239, 68, 68, 0.25)'
    };
  }
  if (percentage >= 40) {
    return {
      textColor: 'text-amber-500 dark:text-amber-400',
      badgeVariant: 'secondary' as const,
      badgeText: 'Moderate AI Probability',
      waterGradientStart: '#f59e0b',
      waterGradientEnd: '#d97706',
      waterSurface: '#fde68a',
      glowColor: 'rgba(245, 158, 11, 0.25)'
    };
  }
  return {
    textColor: 'text-emerald-600 dark:text-emerald-400',
    badgeVariant: 'outline' as const,
    badgeText: 'Low AI Probability',
    waterGradientStart: '#10b981',
    waterGradientEnd: '#059669',
    waterSurface: '#a7f3d0',
    glowColor: 'rgba(16, 185, 129, 0.25)'
  };
}

/**
 * SVG Water-Filled Cup Graphic
 * Height: 110, Width: 80
 * Tapered glass cup with tick marks at 0%, 25%, 50%, 75%, 100%
 */
export function WaterCupGraphic({
  percentage,
  colorDetails
}: {
  percentage: number;
  colorDetails: ReturnType<typeof getProbabilityColorDetails>;
}) {
  const uniqueId = useId().replace(/:/g, '-');
  const clipId = `cup-clip-${uniqueId}`;
  const gradId = `water-grad-${uniqueId}`;

  // Cup interior geometry
  // Top opening: y=16, height=80 (from y=16 to y=96), width at top=56, width at bottom=46
  // Fill calculation: height range from y=96 (0%) up to y=20 (100%) -> total travel = 76px
  const fillableHeight = 76;
  const bottomY = 96;
  const waterHeight = (percentage / 100) * fillableHeight;
  const waterTopY = bottomY - waterHeight;

  return (
    <div className="relative flex items-center justify-center shrink-0 w-24 h-28" aria-hidden="true">
      <svg
        viewBox="0 0 90 115"
        className="w-full h-full drop-shadow-sm select-none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Cup Interior Clip Path */}
          <clipPath id={clipId}>
            {/* Tapered cup body polygon with slightly rounded bottom corners */}
            <path d="M19 18 L71 18 L65 92 C64.5 96, 61 98, 57 98 L33 98 C29 98, 25.5 96, 25 92 Z" />
          </clipPath>

          {/* Water Fill Gradient */}
          <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colorDetails.waterGradientStart} stopOpacity="0.88" />
            <stop offset="100%" stopColor={colorDetails.waterGradientEnd} stopOpacity="0.95" />
          </linearGradient>
        </defs>

        {/* 1. Cup Inner Background (Empty volume tint) */}
        <path
          d="M19 18 L71 18 L65 92 C64.5 96, 61 98, 57 98 L33 98 C29 98, 25.5 96, 25 92 Z"
          className="fill-muted/40"
        />

        {/* 2. Water fill container clipped to interior */}
        <g clipPath={`url(#${clipId})`}>
          {percentage > 0 && (
            <>
              {/* Main water body */}
              <rect
                x="10"
                y={waterTopY}
                width="70"
                height={waterHeight + 10}
                fill={`url(#${gradId})`}
                className="transition-all duration-700 ease-out"
              />

              {/* Water surface wave & meniscus highlight */}
              {percentage < 100 && (
                <ellipse
                  cx="45"
                  cy={waterTopY}
                  rx={23 + (percentage / 100) * 5}
                  ry="3.5"
                  fill={colorDetails.waterSurface}
                  opacity="0.85"
                  className="transition-all duration-700 ease-out"
                />
              )}

              {/* Subtle bubble accents inside water */}
              {percentage > 20 && (
                <>
                  <circle cx="34" cy={bottomY - waterHeight * 0.4} r="1.5" fill="#ffffff" opacity="0.4" />
                  <circle cx="56" cy={bottomY - waterHeight * 0.7} r="1.2" fill="#ffffff" opacity="0.35" />
                  <circle cx="42" cy={bottomY - waterHeight * 0.25} r="1.8" fill="#ffffff" opacity="0.3" />
                </>
              )}
            </>
          )}
        </g>

        {/* 3. Cup Measurement Tick Marks (25%, 50%, 75%) */}
        {/* 100% tick */}
        <line x1="68" y1="20" x2="74" y2="20" stroke="currentColor" className="text-muted-foreground/60" strokeWidth="1.2" />
        <text x="76" y="22" fontSize="6" className="fill-muted-foreground font-mono font-bold select-none">100</text>
        
        {/* 75% tick */}
        <line x1="66" y1="39" x2="72" y2="39" stroke="currentColor" className="text-muted-foreground/50" strokeWidth="1" strokeDasharray="1,1" />
        <text x="74" y="41" fontSize="5.5" className="fill-muted-foreground/80 font-mono select-none">75</text>

        {/* 50% tick */}
        <line x1="64" y1="58" x2="71" y2="58" stroke="currentColor" className="text-muted-foreground/60" strokeWidth="1.2" />
        <text x="73" y="60" fontSize="5.5" className="fill-muted-foreground font-mono font-bold select-none">50</text>

        {/* 75% tick */}
        <line x1="62" y1="77" x2="68" y2="77" stroke="currentColor" className="text-muted-foreground/50" strokeWidth="1" strokeDasharray="1,1" />
        <text x="70" y="79" fontSize="5.5" className="fill-muted-foreground/80 font-mono select-none">25</text>

        {/* 0% tick */}
        <line x1="60" y1="96" x2="66" y2="96" stroke="currentColor" className="text-muted-foreground/60" strokeWidth="1.2" />
        <text x="68" y="98" fontSize="5.5" className="fill-muted-foreground font-mono font-bold select-none">0</text>

        {/* 4. Glass Cup Outer Rim, Walls, and Base Outline */}
        {/* Top Rim Ellipse */}
        <ellipse
          cx="45"
          cy="18"
          rx="26"
          ry="4"
          className="stroke-foreground/60 fill-transparent"
          strokeWidth="2"
        />
        
        {/* Cup Outer Walls & Rounded Base */}
        <path
          d="M19 18 L25 92 C25.5 96, 29 98, 33 98 L57 98 C61 98, 64.5 96, 65 92 L71 18"
          className="stroke-foreground/60 fill-transparent"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Glass specular vertical shine reflection */}
        <path
          d="M23 24 L27 88"
          className="stroke-white/40 dark:stroke-white/20"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export default function ImageAIProbabilityCupCard({
  score,
  isLoading = false,
  label = 'AI Probability',
  supportingText = 'Estimated likelihood that this image is AI-generated.',
  className = ''
}: ImageAIProbabilityCupCardProps) {
  const normalizedScore = normalizeAIProbability(score);
  const isAvailable = normalizedScore !== null;
  const colorDetails = isAvailable ? getProbabilityColorDetails(normalizedScore) : null;

  return (
    <Card className={`border border-border/80 bg-card shadow-sm overflow-hidden transition-all duration-300 ${className}`}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
          {/* Left Column: Label, Score, and Description */}
          <div className="flex-1 min-w-0 space-y-1.5 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                {label}
              </span>
              {isAvailable && colorDetails && (
                <Badge variant={colorDetails.badgeVariant} className="text-[10px] py-0 px-2 h-4 font-semibold">
                  {colorDetails.badgeText}
                </Badge>
              )}
            </div>

            {/* Score Display Area */}
            {isLoading ? (
              <div className="flex items-center justify-center sm:justify-start gap-2.5 py-1">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
                <span className="text-sm font-medium text-muted-foreground animate-pulse">
                  Calculating calibrated AI probability...
                </span>
              </div>
            ) : isAvailable && colorDetails ? (
              <div className="flex items-baseline justify-center sm:justify-start gap-2">
                <span
                  className={`text-4xl sm:text-5xl font-black tracking-tight ${colorDetails.textColor}`}
                  aria-label={`AI probability: ${normalizedScore} percent`}
                >
                  {normalizedScore}%
                </span>
                <span className="text-xs font-semibold text-muted-foreground">
                  likelihood
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-center sm:justify-start gap-2 py-1 text-muted-foreground">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="text-sm font-medium">AI probability unavailable</span>
              </div>
            )}

            {/* Supporting explanatory copy */}
            <p className="text-xs text-muted-foreground text-pretty max-w-md">
              {supportingText}
            </p>
          </div>

          {/* Right Column: Water Cup Indicator */}
          <div className="flex flex-col items-center justify-center shrink-0">
            {isLoading ? (
              <div className="w-24 h-28 flex flex-col items-center justify-center bg-muted/20 border border-dashed border-border rounded-xl">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
                <span className="text-[10px] text-muted-foreground mt-2">Analyzing</span>
              </div>
            ) : isAvailable && colorDetails ? (
              <div className="flex flex-col items-center">
                <WaterCupGraphic percentage={normalizedScore} colorDetails={colorDetails} />
                <span className="text-[10px] font-semibold text-muted-foreground/80 mt-0.5">
                  Water level: {normalizedScore}% full
                </span>
              </div>
            ) : (
              <div className="w-24 h-28 flex flex-col items-center justify-center bg-muted/20 border border-border rounded-xl p-2 text-center">
                <AlertCircle className="w-5 h-5 text-muted-foreground mb-1" />
                <span className="text-[10px] text-muted-foreground font-medium">No Level</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
