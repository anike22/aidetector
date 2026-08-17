import { Link } from 'react-router-dom';
import MainLayout from '@/components/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import PageMeta from '@/components/common/PageMeta';
import { FileX } from 'lucide-react';

export default function GonePage() {
  return (
    <MainLayout>
      <PageMeta
        title="410 Gone — Page Removed"
        description="This page has been permanently removed from AIDetector.cx."
        noindex
      />
      <div className="flex min-h-[60vh] items-center justify-center px-4 md:px-6 py-16">
        <div className="max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 text-destructive mb-6">
            <FileX className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-navy text-balance mb-3">410 Gone</h1>
          <p className="text-muted-foreground text-pretty mb-6">
            This page has been permanently removed from AIDetector.cx. It is not coming back, and no redirect is available yet.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link to="/blog">Explore Content</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/">Go Home</Link>
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
