import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Star,
  ThumbsUp,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  FileCheck,
  Sparkles,
  Upload,
  HelpCircle,
  Flag,
  Lock,
  Building2,
  SlidersHorizontal,
  Info,
  Check,
  Scale,
  X,
  AlertTriangle,
} from 'lucide-react';
import {
  ProductUserReview,
  EvidenceAttachment,
  ConflictDisclosure,
  ConflictRelationshipType,
  ReviewReport,
} from '@/types/directory';
import { toast } from 'sonner';
import { ProductReviewMethodologyModal } from './ProductReviewMethodologyModal';
import { ProductUserReviewModal } from './ProductUserReviewModal';

interface ProductUserReviewsSectionProps {
  productId: string;
  productName: string;
  initialReviews?: ProductUserReview[];
}

const LOCAL_STORAGE_REVIEWS_KEY = 'aidetector_directory_user_reviews';
const LOCAL_STORAGE_VOTES_KEY = 'aidetector_directory_user_votes';
const LOCAL_STORAGE_REPORTS_KEY = 'aidetector_directory_review_reports';

export function ProductUserReviewsSection({
  productId,
  productName,
  initialReviews = [],
}: ProductUserReviewsSectionProps) {
  // Methodology Modal State
  const [methodologyOpen, setMethodologyOpen] = useState(false);

  // Reviews Data State with LocalStorage Persistence
  const [reviews, setReviews] = useState<ProductUserReview[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_REVIEWS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as ProductUserReview[];
        const productSaved = parsed.filter(r => r.productId === productId);
        if (productSaved.length > 0) {
          // Merge with initial reviews, avoiding duplicates by id
          const ids = new Set(productSaved.map(r => r.id));
          const combined = [...productSaved, ...initialReviews.filter(r => !ids.has(r.id))];
          return combined;
        }
      }
    } catch {
      // Fallback
    }
    return initialReviews;
  });

  // Track user helpful votes in localStorage
  const [votedReviews, setVotedReviews] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_VOTES_KEY);
      if (saved) {
        return new Set(JSON.parse(saved));
      }
    } catch {
      // Fallback
    }
    return new Set();
  });

  // Review Form Modal State
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<ProductUserReview | null>(null);

  // Report Review Modal State
  const [reportReviewId, setReportReviewId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState<ReviewReport['reason']>('misleading_information');
  const [reportDetails, setReportDetails] = useState('');

  // Filtering & Sorting State
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful'>('newest');
  const [filterRating, setFilterRating] = useState<string>('all');
  const [filterEvidence, setFilterEvidence] = useState<string>('all');
  const [filterPlan, setFilterPlan] = useState<string>('all');

  // Sync reviews to localStorage
  const saveReviewsToStorage = (updatedReviews: ProductUserReview[]) => {
    try {
      const allSaved = localStorage.getItem(LOCAL_STORAGE_REVIEWS_KEY);
      let existingAll: ProductUserReview[] = allSaved ? JSON.parse(allSaved) : [];
      // Remove current product's older entries and append updated
      existingAll = existingAll.filter(r => r.productId !== productId);
      existingAll = [...existingAll, ...updatedReviews];
      localStorage.setItem(LOCAL_STORAGE_REVIEWS_KEY, JSON.stringify(existingAll));
    } catch {
      // Ignore
    }
  };

  // Compute Authentic Rating Distribution
  const approvedReviews = useMemo(() => {
    return reviews.filter(r => r.moderationStatus === 'approved' || !r.moderationStatus);
  }, [reviews]);

  const totalReviewsCount = approvedReviews.length;
  const averageRating = useMemo(() => {
    if (totalReviewsCount === 0) return 0;
    const sum = approvedReviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / totalReviewsCount).toFixed(1);
  }, [approvedReviews, totalReviewsCount]);

  const ratingCounts = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    approvedReviews.forEach(r => {
      const star = Math.max(1, Math.min(5, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
      counts[star] = (counts[star] || 0) + 1;
    });
    return counts;
  }, [approvedReviews]);

  // Dimension Averages
  const dimensionalAverages = useMemo(() => {
    let easeSum = 0, easeCount = 0;
    let qualSum = 0, qualCount = 0;
    let valSum = 0, valCount = 0;
    let relSum = 0, relCount = 0;

    approvedReviews.forEach(r => {
      if (r.dimensionalRatings?.easeOfUse) { easeSum += r.dimensionalRatings.easeOfUse; easeCount++; }
      if (r.dimensionalRatings?.featureQuality) { qualSum += r.dimensionalRatings.featureQuality; qualCount++; }
      if (r.dimensionalRatings?.valueForMoney) { valSum += r.dimensionalRatings.valueForMoney; valCount++; }
      if (r.dimensionalRatings?.reliability) { relSum += r.dimensionalRatings.reliability; relCount++; }
    });

    return {
      easeOfUse: easeCount > 0 ? (easeSum / easeCount).toFixed(1) : null,
      featureQuality: qualCount > 0 ? (qualSum / qualCount).toFixed(1) : null,
      valueForMoney: valCount > 0 ? (valSum / valCount).toFixed(1) : null,
      reliability: relCount > 0 ? (relSum / relCount).toFixed(1) : null,
    };
  }, [approvedReviews]);

  // Filter & Sort Logic
  const filteredAndSortedReviews = useMemo(() => {
    let result = [...approvedReviews];

    // Filter by Rating
    if (filterRating !== 'all') {
      const targetStar = parseInt(filterRating, 10);
      result = result.filter(r => Math.round(r.rating) === targetStar);
    }

    // Filter by Evidence
    if (filterEvidence === 'with_evidence') {
      result = result.filter(r => !!r.evidenceAttachment);
    } else if (filterEvidence === 'reviewed_evidence') {
      result = result.filter(r => r.evidenceAttachment?.verificationStatus === 'reviewed');
    }

    // Filter by Plan
    if (filterPlan !== 'all') {
      result = result.filter(r => r.planUsed && r.planUsed.toLowerCase().includes(filterPlan.toLowerCase()));
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === 'oldest') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === 'highest') return b.rating - a.rating;
      if (sortBy === 'lowest') return a.rating - b.rating;
      if (sortBy === 'helpful') return b.helpfulVotes - a.helpfulVotes;
      return 0;
    });

    return result;
  }, [approvedReviews, sortBy, filterRating, filterEvidence, filterPlan]);

  // Handle Helpful Vote
  const handleVoteHelpful = (reviewId: string) => {
    if (votedReviews.has(reviewId)) {
      toast.info('You have already marked this review as helpful.');
      return;
    }

    const nextVotes = new Set(votedReviews);
    nextVotes.add(reviewId);
    setVotedReviews(nextVotes);
    try {
      localStorage.setItem(LOCAL_STORAGE_VOTES_KEY, JSON.stringify(Array.from(nextVotes)));
    } catch {
      // Ignore
    }

    const updated = reviews.map(r => {
      if (r.id === reviewId) {
        return { ...r, helpfulVotes: (r.helpfulVotes || 0) + 1 };
      }
      return r;
    });
    setReviews(updated);
    saveReviewsToStorage(updated);
    toast.success('Thank you! Helpful vote recorded.');
  };

  // Save or Update Review Handler
  const handleSaveReview = (review: ProductUserReview) => {
    let updated: ProductUserReview[];
    const exists = reviews.some(r => r.id === review.id);
    if (exists) {
      updated = reviews.map(r => (r.id === review.id ? review : r));
      toast.success('Your review has been updated successfully!');
    } else {
      updated = [review, ...reviews];
      toast.success('Thank you! Your verified review has been published.');
    }
    setReviews(updated);
    saveReviewsToStorage(updated);
  };

  const openSubmitDialog = (reviewToEdit?: ProductUserReview) => {
    setEditingReview(reviewToEdit || null);
    setIsSubmitOpen(true);
  };

  // Submit Report
  const handleSubmitReport = () => {
    if (!reportReviewId) return;
    if (!reportDetails.trim()) {
      toast.error('Please explain why this review violates platform integrity standards.');
      return;
    }

    const report: ReviewReport = {
      id: `rep_${Date.now()}`,
      reviewId: reportReviewId,
      productId,
      reason: reportReason,
      details: reportDetails.trim(),
      reportedAt: new Date().toISOString().split('T')[0],
      status: 'pending',
    };

    try {
      const existingReports = JSON.parse(localStorage.getItem(LOCAL_STORAGE_REPORTS_KEY) || '[]');
      localStorage.setItem(LOCAL_STORAGE_REPORTS_KEY, JSON.stringify([...existingReports, report]));
    } catch {
      // Ignore
    }

    toast.success('Review reported to AIDetector.cx moderation team for review.');
    setReportReviewId(null);
    setReportDetails('');
  };

  return (
    <div id="reviews" className="space-y-6 scroll-mt-24">
      {/* Header & Write Review Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-foreground">
              Verified Community Reviews & Ratings
            </h2>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-muted-foreground">
              Direct first-party ratings with evidence inspection and conflict disclosures.
            </p>
            <span>•</span>
            <button
              type="button"
              onClick={() => setMethodologyOpen(true)}
              className="text-xs text-primary hover:underline flex items-center gap-1 font-medium cursor-pointer"
            >
              <span>How Reviews Work</span>
              <HelpCircle className="w-3 h-3" />
            </button>
          </div>
        </div>

        <Button
          size="sm"
          onClick={() => openSubmitDialog()}
          className="h-9 text-xs bg-primary text-primary-foreground font-semibold gap-1.5 shrink-0 shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Write a Review</span>
        </Button>
      </div>

      {/* Methodology Transparency Modal */}
      <ProductReviewMethodologyModal
        open={methodologyOpen}
        onOpenChange={setMethodologyOpen}
      />

      {/* Rating Distribution Card */}
      <Card className="bg-card border-border rounded-2xl p-5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Overall Score */}
          <div className="text-center md:border-r md:border-border md:pr-6 space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
              Authentic Community Rating
            </span>
            {totalReviewsCount > 0 ? (
              <>
                <div className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                  {averageRating}
                  <span className="text-sm font-normal text-muted-foreground ml-1">/ 5.0</span>
                </div>
                <div className="flex justify-center items-center gap-1 text-amber-500">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        parseFloat(averageRating as string) >= star
                          ? 'fill-amber-500'
                          : parseFloat(averageRating as string) >= star - 0.5
                          ? 'fill-amber-500/50'
                          : 'text-muted-foreground/30'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Based on <strong>{totalReviewsCount}</strong> verified review{totalReviewsCount !== 1 ? 's' : ''}
                </p>
              </>
            ) : (
              <div className="py-2 space-y-1">
                <div className="text-xs font-semibold text-foreground">No user reviews yet</div>
                <p className="text-[11px] text-muted-foreground text-pretty">
                  Be the first verified practitioner to submit an evidence-backed review for {productName}.
                </p>
              </div>
            )}
          </div>

          {/* Star Distribution Bars */}
          <div className="space-y-1.5 text-xs">
            {[5, 4, 3, 2, 1].map(star => {
              const count = ratingCounts[star as 1 | 2 | 3 | 4 | 5] || 0;
              const percent = totalReviewsCount > 0 ? Math.round((count / totalReviewsCount) * 100) : 0;
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFilterRating(filterRating === star.toString() ? 'all' : star.toString())}
                  className={`w-full flex items-center gap-2 p-1 rounded-lg transition-colors cursor-pointer text-left ${
                    filterRating === star.toString() ? 'bg-primary/10 ring-1 ring-primary/30' : 'hover:bg-muted/40'
                  }`}
                >
                  <span className="w-8 text-[11px] font-medium text-foreground">{star} star</span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-300"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="w-8 text-[11px] text-muted-foreground text-right">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Granular Dimension Averages */}
          <div className="md:border-l md:border-border md:pl-6 space-y-2 text-xs">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
              Dimension Averages
            </span>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-muted-foreground">Ease of Use</span>
                <span className="font-semibold text-foreground">{dimensionalAverages.easeOfUse ? `${dimensionalAverages.easeOfUse} / 5.0` : '—'}</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-muted-foreground">Feature Quality</span>
                <span className="font-semibold text-foreground">{dimensionalAverages.featureQuality ? `${dimensionalAverages.featureQuality} / 5.0` : '—'}</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-muted-foreground">Value for Money</span>
                <span className="font-semibold text-foreground">{dimensionalAverages.valueForMoney ? `${dimensionalAverages.valueForMoney} / 5.0` : '—'}</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-muted-foreground">Reliability & Uptime</span>
                <span className="font-semibold text-foreground">{dimensionalAverages.reliability ? `${dimensionalAverages.reliability} / 5.0` : '—'}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Filter and Sorting Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-muted/30 border border-border rounded-xl text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-foreground flex items-center gap-1 text-[11px]">
            <SlidersHorizontal className="w-3 h-3" />
            Filter:
          </span>

          {/* Rating Filter */}
          <Select value={filterRating} onValueChange={setFilterRating}>
            <SelectTrigger className="h-7 text-xs bg-background w-[110px]">
              <SelectValue placeholder="Rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stars</SelectItem>
              <SelectItem value="5">5 Stars Only</SelectItem>
              <SelectItem value="4">4 Stars Only</SelectItem>
              <SelectItem value="3">3 Stars Only</SelectItem>
              <SelectItem value="2">2 Stars Only</SelectItem>
              <SelectItem value="1">1 Star Only</SelectItem>
            </SelectContent>
          </Select>

          {/* Evidence Filter */}
          <Select value={filterEvidence} onValueChange={setFilterEvidence}>
            <SelectTrigger className="h-7 text-xs bg-background w-[140px]">
              <SelectValue placeholder="Evidence" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Submissions</SelectItem>
              <SelectItem value="with_evidence">With Evidence</SelectItem>
              <SelectItem value="reviewed_evidence">Evidence Reviewed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort Control */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-muted-foreground text-[11px]">Sort:</span>
          <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
            <SelectTrigger className="h-7 text-xs bg-background w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="highest">Highest Rating</SelectItem>
              <SelectItem value="lowest">Lowest Rating</SelectItem>
              <SelectItem value="helpful">Most Helpful</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredAndSortedReviews.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-card border border-border space-y-2">
            <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto" />
            <h3 className="text-xs font-bold text-foreground">No matching reviews found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Try adjusting your rating or evidence filters, or be the first to share your experience with this product.
            </p>
          </div>
        ) : (
          filteredAndSortedReviews.map(rev => {
            const hasVoted = votedReviews.has(rev.id);
            return (
              <Card
                key={rev.id}
                className="bg-card border-border rounded-2xl p-5 shadow-sm space-y-4"
              >
                {/* Review Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-border">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <div className="flex items-center gap-0.5 text-amber-500">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star
                            key={star}
                            className={`w-3.5 h-3.5 ${
                              rev.rating >= star ? 'fill-amber-500' : 'text-muted-foreground/30'
                            }`}
                          />
                        ))}
                      </div>
                      <h3 className="text-xs sm:text-sm font-bold text-foreground">{rev.title}</h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">{rev.authorName}</span>
                      <span>•</span>
                      <span>{rev.roleOrProfession}</span>
                      {rev.companyOrSchool && <span>({rev.companyOrSchool})</span>}
                      <span>•</span>
                      <span>Used: {rev.usageDuration}</span>
                      {rev.planUsed && (
                        <>
                          <span>•</span>
                          <span className="text-foreground/90 font-medium">{rev.planUsed}</span>
                        </>
                      )}
                    </div>
                  </div>

                    {/* Status Badges & Timestamps */}
                    <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                      {rev.evidenceAttachment ? (
                        <Badge
                          variant="outline"
                          className={`text-[10px] py-0.5 flex items-center gap-1 ${
                            rev.evidenceAttachment.verificationStatus === 'reviewed'
                              ? 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5'
                              : 'border-primary/40 text-primary bg-primary/5'
                          }`}
                        >
                          <FileCheck className="w-3 h-3" />
                          <span>
                            {rev.evidenceAttachment.verificationStatus === 'reviewed'
                              ? 'Evidence Reviewed'
                              : 'Evidence Submitted'}
                          </span>
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] py-0.5 text-muted-foreground">
                          User Review
                        </Badge>
                      )}

                      <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 ml-1">
                        <span>Originally reviewed: {rev.date}</span>
                        {rev.lastEditedDate && (
                          <>
                            <span>•</span>
                            <span className="text-primary font-medium">Updated: {rev.lastEditedDate}</span>
                          </>
                        )}
                      </div>
                    </div>
                </div>

                {/* Conflict of Interest Disclosure Banner */}
                {rev.conflictDisclosure && rev.conflictDisclosure.hasConflict && (
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-start gap-2 text-amber-800 dark:text-amber-300">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-semibold">Conflict Disclosure:</strong> Reviewer disclosed relationship (
                      {rev.conflictDisclosure.relationshipType.replace('_', ' ')}).
                      {rev.conflictDisclosure.details && ` "${rev.conflictDisclosure.details}"`}
                    </div>
                  </div>
                )}

                {/* Granular Dimension Ratings if available */}
                {rev.dimensionalRatings && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] p-2.5 rounded-xl bg-muted/25 border border-border/60">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Ease of Use</span>
                      <strong className="text-foreground">{rev.dimensionalRatings.easeOfUse || '—'} / 5</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Feature Quality</span>
                      <strong className="text-foreground">{rev.dimensionalRatings.featureQuality || '—'} / 5</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Value for Money</span>
                      <strong className="text-foreground">{rev.dimensionalRatings.valueForMoney || '—'} / 5</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Reliability</span>
                      <strong className="text-foreground">{rev.dimensionalRatings.reliability || '—'} / 5</strong>
                    </div>
                  </div>
                )}

                {/* Review Body */}
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed text-pretty">
                  {rev.reviewText}
                </p>

                {/* Pros & Cons */}
                {((rev.pros && rev.pros.length > 0) || (rev.cons && rev.cons.length > 0)) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                    {rev.pros && rev.pros.length > 0 && (
                      <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15 space-y-1">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 text-[10px] uppercase tracking-wider block">
                          Verified Pros
                        </span>
                        <ul className="space-y-0.5 text-muted-foreground">
                          {rev.pros.map((p, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                              <span>{p}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {rev.cons && rev.cons.length > 0 && (
                      <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/15 space-y-1">
                        <span className="font-bold text-amber-600 dark:text-amber-400 text-[10px] uppercase tracking-wider block">
                          Operational Cons
                        </span>
                        <ul className="space-y-0.5 text-muted-foreground">
                          {rev.cons.map((c, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Vendor Response Component */}
                {rev.vendorResponse && (
                  <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-primary">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>Official Response from {rev.vendorResponse.companyName}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{rev.vendorResponse.date}</span>
                    </div>
                    <p className="text-muted-foreground leading-relaxed text-xs">
                      {rev.vendorResponse.responseText}
                    </p>
                    <div className="text-[10px] text-muted-foreground">
                      — {rev.vendorResponse.responderName}, {rev.vendorResponse.responderRole}
                    </div>
                  </div>
                )}

                {/* Review Footer Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-border text-xs">
                  <div className="flex items-center gap-2">
                    <Button
                      variant={hasVoted ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => handleVoteHelpful(rev.id)}
                      className="h-7 text-xs gap-1.5"
                    >
                      <ThumbsUp className={`w-3 h-3 ${hasVoted ? 'text-primary fill-primary' : ''}`} />
                      <span>Helpful ({rev.helpfulVotes || 0})</span>
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openSubmitDialog(rev)}
                      className="h-7 text-[11px] text-muted-foreground hover:text-foreground"
                    >
                      Edit Review
                    </Button>
                    <button
                      type="button"
                      onClick={() => setReportReviewId(rev.id)}
                      className="text-muted-foreground hover:text-destructive text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Flag className="w-3 h-3" />
                      <span>Report</span>
                    </button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Multi-Step Review Wizard Modal */}
      <ProductUserReviewModal
        isOpen={isSubmitOpen}
        onClose={() => {
          setIsSubmitOpen(false);
          setEditingReview(null);
        }}
        productId={productId}
        productName={productName}
        onSaveReview={handleSaveReview}
        editingReview={editingReview}
      />

      {/* Report Review Modal */}

      {/* Report Review Modal */}
      <Dialog open={!!reportReviewId} onOpenChange={open => !open && setReportReviewId(null)}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md bg-card border-border">
          <DialogHeader className="pb-2 border-b border-border">
            <DialogTitle className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <Flag className="w-4 h-4 text-destructive" />
              Report Review to Moderation
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Help maintain directory authenticity by reporting spam, conflicts, or abusive behavior.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-3 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-foreground block">Reason for Report</label>
              <Select value={reportReason} onValueChange={(val: any) => setReportReason(val)}>
                <SelectTrigger className="h-8 text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spam">Spam or Promotional Solicitation</SelectItem>
                  <SelectItem value="conflict_of_interest">Undisclosed Conflict of Interest</SelectItem>
                  <SelectItem value="abusive_content">Abusive or Harassing Content</SelectItem>
                  <SelectItem value="privacy_issue">Exposes Sensitive/Private Info</SelectItem>
                  <SelectItem value="misleading_information">Factual Fabrication</SelectItem>
                  <SelectItem value="other">Other Violation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-foreground block">Explanation / Details *</label>
              <Textarea
                value={reportDetails}
                onChange={e => setReportDetails(e.target.value)}
                placeholder="Describe the violation..."
                className="min-h-[70px] text-xs bg-background"
                required
              />
            </div>
          </div>

          <DialogFooter className="pt-2 border-t border-border flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setReportReviewId(null)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSubmitReport}
              className="text-xs bg-destructive text-destructive-foreground font-semibold"
            >
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
