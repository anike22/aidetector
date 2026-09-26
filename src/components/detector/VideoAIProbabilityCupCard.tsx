import React, { useId } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, AlertCircle, Loader2 } from 'lucide-react';

export interface VideoAIProbabilityCupCardProps {
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
export function normalizeVideoAIProbability(score?: number | null): number | null {
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
export function getVideoProbabilityColorDetails(percentage: number) {
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
export function VideoWaterCupGraphic({
  percentage,
  colorDetails
}: {
  percentage: number;
  colorDetails: ReturnType<typeof getVideoProbabilityColorDetails>;
}) {
  const uniqueId = useId().replace(/:/g, '-');
  const clipId = `video-cup-clip-${uniqueId}`;
  const gradId = `video-water-grad-${uniqueId}`;

  // Cup interior geometry
  // Top opening: y=18, height=80 (from y=18 to y=98), width at top=52, width at bottom=42
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

        {/* 3. Cup Measurement Tick Marks (25%, 50%, 75%, 100%) */}
        {/* 100% tick */}
        <line x1="68" y1="20" x2="74" y2="20" stroke="currentColor" className="text-muted-foreground/60" strokeWidth="1.2" />
        <text x="76" y="22" fontSize="6" className="fill-muted-foreground font-mono font-bold select-none">100</text>
        
        {/* 75% tick */}
        <line x1="66" y1="39" x2="72" y2="39" stroke="currentColor" className="text-muted-foreground/50" strokeWidth="1.2" />
        <text x="74" y="41" fontSize="6" className="fill-muted-foreground font-mono select-none">75</text>
        
        {/* 50% tick */}
        <line x1="64" y1="58" x2="70" y2="58" stroke="currentColor" className="text-muted-foreground/50" strokeWidth="1.2" />
        <text x="72" y="60" fontSize="6" className="fill-muted-foreground font-mono font-semibold select-none">50</text>
        
        {/* 25% tick */}
        <line x1="62" y1="77" x2="68" y2="77" stroke="currentColor" className="text-muted-foreground/50" strokeWidth="1.2" />
        <text x="70" y="79" fontSize="6" className="fill-muted-foreground font-mono select-none">25</text>
        
        {/* 0% tick */}
        <line x1="59" y1="96" x2="65" y2="96" stroke="currentColor" className="text-muted-foreground/60" strokeWidth="1.2" />
        <text x="67" y="98" fontSize="6" className="fill-muted-foreground font-mono select-none">0</text>

        {/* 4. Glass Outline and Highlights */}
        {/* Outer tapered cup border */}
        <path
          d="M18 16 L72 16 L65.5 92.5 C65 96.5, 61.5 99, 57 99 L33 99 C28.5 99, 25 96.5, 24.5 92.5 Z"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
          className="text-foreground/80 dark:text-foreground/70"
        />

        {/* Top Rim Lip */}
        <ellipse
          cx="45"
          cy="16"
          rx="27"
          ry="4"
          stroke="currentColor"
          strokeWidth="2"
          className="text-foreground/90 fill-background/60 dark:text-foreground/80"
        />

        {/* Vertical glass shine / reflection on left side */}
        <path
          d="M24 24 L27 88"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.35"
        />
        <path
          d="M28 28 L30 65"
          stroke="#ffffff"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.2"
        />
      </svg>
    </div>
  );
}

/**
 * Prominent AI Probability Summary Card with Water-Filled Cup Indicator for Video Detector
 */
export default function VideoAIProbabilityCupCard({
  score,
  isLoading = false,
  label = 'AI Probability',
  supportingText = 'Estimated likelihood that this video is AI-generated.',
  className = ''
}: VideoAIProbabilityCupCardProps) {
  const normalizedScore = normalizeVideoAIProbability(score);
  const hasValidScore = normalizedScore !== null;
  const colorDetails = hasValidScore
    ? getVideoProbabilityColorDetails(normalizedScore)
    : null;

  return (
    <Card
      className={`border-border bg-card shadow-sm overflow-hidden relative transition-all ${className}`}
      aria-label={`${label}: ${hasValidScore ? `${normalizedScore}%` : isLoading ? 'Analyzing' : 'Unavailable'}`}
    >
      <CardContent className="p-4 md:p-5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left / Main Text Block */}
          <div className="flex-1 min-w-0 space-y-1.5 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
              <span className="text-xs md:text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-primary" />
                {label}
              </span>
              
              {hasValidScore && colorDetails && (
                <Badge variant={colorDetails.badgeVariant} className="text-xs font-semibold py-0.5 px-2">
                  {colorDetails.badgeText}
                </Badge>
              )}
            </div>

            {/* Score Display or Status States */}
            {isLoading ? (
              <div className="flex items-center justify-center md:justify-start gap-2 py-1">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="text-base md:text-lg font-medium text-muted-foreground">
                  Evaluating video authenticity...
                </span>
              </div>
            ) : hasValidScore ? (
              <div className="flex items-baseline justify-center md:justify-start gap-2">
                <span className={`text-3xl md:text-4xl font-extrabold tracking-tight ${colorDetails?.textColor}`}>
                  {normalizedScore}%
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  calibrated multi-modal score
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-center md:justify-start gap-2 py-1 text-muted-foreground">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium">AI probability unavailable</span>
              </div>
            )}

            {/* Supporting explanatory text */}
            <p className="text-xs text-muted-foreground max-w-md leading-relaxed text-balance">
              {supportingText}
            </p>
          </div>

          {/* Right / Visual Indicator: Water Cup Graphic */}
          <div className="flex items-center justify-center shrink-0">
            {isLoading ? (
              <div className="w-24 h-28 rounded-xl bg-muted/40 border border-border/60 flex flex-col items-center justify-center gap-2 text-muted-foreground animate-pulse">
                <Loader2 className="w-6 h-6 animate-spin text-primary/70" />
                <span className="text-[10px] font-medium uppercase tracking-wider">Scanning</span>
              </div>
            ) : hasValidScore && colorDetails ? (
              <VideoWaterCupGraphic
                percentage={normalizedScore}
                colorDetails={colorDetails}
              />
            ) : (
              <div className="w-24 h-28 rounded-xl bg-muted/20 border border-dashed border-border/80 flex flex-col items-center justify-center gap-1.5 p-2 text-center text-muted-foreground">
                <AlertCircle className="w-5 h-5 text-muted-foreground/60" />
                <span className="text-[10px] leading-tight font-medium">No score available</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
