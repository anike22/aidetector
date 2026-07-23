import React from 'react';
import MainLayout from '@/components/layouts/MainLayout';
import HeroSection from '@/components/home/HeroSection';
import TrustStats from '@/components/home/TrustStats';
import LogoWall from '@/components/home/LogoWall';
import FeatureGrid from '@/components/home/FeatureGrid';
import WhoUsesThis from '@/components/home/WhoUsesThis';
import ComparisonTable from '@/components/home/ComparisonTable';
import Testimonials from '@/components/home/Testimonials';
import CTASection from '@/components/home/CTASection';
import { NewsletterComponent } from '@/components/home/NewsletterComponent';
import PageMeta from '@/components/common/PageMeta';

export default function HomePage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "AIDetector.cx",
    "applicationCategory": "BusinessApplication",
    "description": "Enterprise-grade AI Detector and Content Humanizer to bypass detection and verify originality.",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  return (
    <MainLayout>
      <PageMeta 
        title="AI Detector, Humanizer & Plagiarism Checker | AIDetector.cx"
        description="The world's most advanced AI detection and humanization platform. Pinpoint AI content with 99.8% accuracy and bypass AI detectors effortlessly."
        canonicalUrl="https://aidetector.cx"
        schemas={[schema]}
      />
      <div className="flex flex-col w-full">
        <HeroSection />
        <TrustStats />
        <LogoWall />
        <FeatureGrid />
        <WhoUsesThis />
        <ComparisonTable />
        <Testimonials />
        <NewsletterComponent />
        <CTASection />
      </div>
    </MainLayout>
  );
}
