import { type ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { FeatureAnnouncementBanner } from '@/components/lifecycle/FeatureAnnouncementBanner';

interface MainLayoutProps {
  children: ReactNode;
  showFooter?: boolean;
}

export default function MainLayout({ children, showFooter = true }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen w-full min-w-0 flex-col bg-background overflow-x-clip">
      <div className="sticky top-0 z-50 w-full min-w-0">
        <FeatureAnnouncementBanner />
        <Navbar />
      </div>
      <main className="flex-1 w-full min-w-0">
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  );
}
