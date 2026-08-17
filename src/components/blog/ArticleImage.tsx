import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { ImageOff } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface ArticleImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  containerClassName?: string;
  loading?: 'eager' | 'lazy';
  fetchPriority?: 'high' | 'auto';
}

export default function ArticleImage({
  src,
  alt,
  className,
  containerClassName,
  loading = 'lazy',
  fetchPriority = 'auto',
}: ArticleImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imageUrl = src?.trim() || null;

  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [imageUrl]);

  const handleError = () => {
    if (imageUrl) {
      console.warn(`[ArticleImage] Failed to load image for "${alt}": ${imageUrl}`);
    }
    setHasError(true);
  };

  const showImage = imageUrl && !hasError;
  const showPlaceholder = !imageUrl || hasError;

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-muted',
        containerClassName
      )}
      aria-label={alt}
      role="img"
    >
      {showImage && (
        <img
          key={imageUrl}
          src={imageUrl}
          alt={alt}
          loading={loading}
          fetchPriority={fetchPriority}
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={handleError}
          className={cn(
            'h-full w-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
            className
          )}
        />
      )}

      {!isLoaded && showImage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Skeleton className="h-full w-full rounded-none" />
        </div>
      )}

      {showPlaceholder && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted text-muted-foreground">
          <ImageOff className="h-8 w-8 opacity-60" aria-hidden="true" />
          <span className="text-xs opacity-70">Image unavailable</span>
        </div>
      )}
    </div>
  );
}
