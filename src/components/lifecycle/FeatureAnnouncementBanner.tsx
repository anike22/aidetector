import { Megaphone, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLifecycle } from '@/contexts/LifecycleContext';
import { Button } from '@/components/ui/button';

export function FeatureAnnouncementBanner() {
  const { announcements, loading, dismissAnnouncementById, viewAnnouncement } = useLifecycle();
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && announcements.length > 0 && !active) {
      setActive(announcements[0].id);
      viewAnnouncement(announcements[0].id);
    }
  }, [announcements, loading, active, viewAnnouncement]);

  const handleDismiss = async () => {
    if (!active) return;
    await dismissAnnouncementById(active);
    setActive(null);
  };

  const announcement = announcements.find((a) => a.id === active);
  if (!announcement) return null;

  return (
    <div className="w-full bg-primary px-3 py-2 text-primary-foreground">
      <div className="mx-auto flex max-w-7xl items-start md:items-center justify-between gap-2">
        <div className="flex min-w-0 items-start md:items-center gap-2 pt-0.5 md:pt-0">
          <Megaphone className="h-3.5 w-3.5 shrink-0 mt-0.5 md:mt-0" />
          <p className="text-xs md:text-sm font-medium leading-tight">{announcement.title}</p>
          {announcement.description && (
            <span className="hidden text-xs opacity-90 md:inline">· {announcement.description}</span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {announcement.cta_url && (
            <Button variant="secondary" size="sm" className="h-6 text-xs px-2 py-0" asChild>
              <a href={announcement.cta_url}>Try Now</a>
            </Button>
          )}
          <button onClick={handleDismiss} className="rounded-full p-1 hover:bg-primary-foreground/10" aria-label="Dismiss">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
