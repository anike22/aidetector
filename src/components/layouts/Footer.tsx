import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bot, Twitter, Linkedin, Github, Mail, Shield, CheckCircle2,
  Instagram, Facebook, Youtube, Send, Globe, Lock, ExternalLink
} from 'lucide-react';
import { supabase } from '@/db/supabase';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

const footerColumns = [
  {
    title: 'Tools',
    links: [
      { label: 'AI Detector', href: '/detector' },
      { label: 'Word Counter', href: '/word-counter' },
      { label: 'AI Summarizer', href: '/ai-summarizer' },
      { label: 'AI Humanizer', href: '/humanizer' },
      { label: 'Plagiarism Checker', href: '/plagiarism-checker' },
      { label: 'AI Image Detector', href: '/ai-image-detector' },
      { label: 'AI Video Detector', href: '/ai-video-detector' },
      { label: 'Essay Studio', href: '/essay-studio' },
      { label: 'SEO Assistant', href: '/seo-assistant' },
      { label: 'Content Studio', href: '/content-studio' },
      { label: 'Browse AI Tools Directory', href: '/tools' },
    ],
  },
  {
    title: 'Solutions & Services',
    links: [
      { label: 'All Services', href: '/services' },
      { label: 'SEO Consulting', href: '/services/seo-consulting' },
      { label: 'AI Consulting', href: '/services/ai-consulting' },
      { label: 'Conversion Optimization', href: '/services/conversion-optimization' },
      { label: 'Growth Marketing', href: '/services/growth-marketing' },
      { label: 'Website Development', href: '/services/website-development' },
      { label: 'Hire an Expert', href: '/hire-expert' },
    ],
  },
  {
    title: 'Verification',
    links: [
      { label: 'Verified Authorship', href: '/authorship' },
      { label: 'Verification Portal', href: '/verified-authorship/verify' },
      { label: 'Register Authorship Claim', href: '/verified-authorship/register' },
      { label: 'Author Public Profile', href: '/verified-authorship/profile' },
      { label: 'C2PA & Provenance Standards', href: '/authorship' },
    ],
  },
  {
    title: 'Integrations & API',
    links: [
      { label: 'Enterprise REST API', href: '/api' },
      { label: 'API Documentation', href: '/api/docs' },
      { label: 'API Dashboard', href: '/api/dashboard' },
      { label: 'WordPress Plugin', href: '/wordpress-plugin' },
      { label: 'Chrome Extension', href: '/chrome-extension' },
      { label: 'Integration Hub', href: '/integrations' },
      { label: 'Apps Marketplace', href: '/apps' },
      { label: 'Developer Portal', href: '/developer' },
    ],
  },
  {
    title: 'Resources & Studies',
    links: [
      { label: 'Educational Guides', href: '/guides' },
      { label: 'Research & Benchmarks', href: '/research' },
      { label: 'Tool Comparisons', href: '/comparisons' },
      { label: 'TikTok Detection Guide', href: '/studies/why-tiktok-flagged-my-real-video' },
      { label: 'WhatsApp Compression Study', href: '/studies/whatsapp-compression-ai-video' },
      { label: 'Authentic Video False Positives', href: '/studies/authentic-video-false-positives' },
      { label: 'Official Blog & News', href: '/blog' },
      { label: 'Case Studies', href: '/case-studies' },
      { label: 'Affiliate Hub', href: '/affiliate-hub' },
      { label: 'Community Forum', href: '/community' },
      { label: 'Weekly Newsletter', href: '/newsletter' },
    ],
  },
  {
    title: 'Company & Legal',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Contact Support', href: '/contact' },
      { label: 'Careers', href: '/careers' },
      { label: 'Press & Media', href: '/press' },
      { label: 'Pricing Plans', href: '/pricing' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Cookie Policy', href: '/cookies' },
      { label: 'All Pages Directory', href: '/all-pages', isHighlight: true },
    ],
  },
];

export default function Footer() {
  const [socialLinks, setSocialLinks] = useState<any[]>([]);
  const { isFeatureVisible: checkFeatureVisible } = useFeatureFlags();

  const visibleColumns = footerColumns
    .map(col => ({
      ...col,
      links: col.links.filter(link => checkFeatureVisible(link.href, 'footer')),
    }))
    .filter(col => col.links.length > 0);

  useEffect(() => {
    async function loadSocialLinks() {
      try {
        const { data } = await supabase
          .from('social_links')
          .select('*')
          .eq('enabled', true)
          .order('display_order', { ascending: true });
        if (data) setSocialLinks(data);
      } catch (err) {
        console.error('Error fetching social links:', err);
      }
    }
    loadSocialLinks();
  }, []);

  const renderIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return <Instagram className="w-4 h-4" />;
      case 'facebook': return <Facebook className="w-4 h-4" />;
      case 'x':
      case 'twitter': return <Twitter className="w-4 h-4" />;
      case 'linkedin': return <Linkedin className="w-4 h-4" />;
      case 'youtube': return <Youtube className="w-4 h-4" />;
      case 'github': return <Github className="w-4 h-4" />;
      case 'discord': return <Send className="w-4 h-4" />;
      default: return <Bot className="w-4 h-4" />;
    }
  };

  return (
    <footer className="bg-card border-t border-border mt-32 relative overflow-hidden">
      {/* Decorative gradient blur in background */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
      
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-20">
        {/* Brand & Intro Banner */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-12 mb-12 border-b border-border/60">
          <div className="max-w-xl">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <img 
                src="/brand/aidetector-icon.png" 
                alt="AIDetector.cx Logo" 
                className="w-10 h-10 object-contain rounded-xl shadow-sm border border-border bg-background"
              />
              <span className="font-extrabold text-2xl tracking-tight text-foreground">
                AIDetector<span className="text-primary">.cx</span>
              </span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed text-pretty">
              The world's standard for AI text, image, and video detection, humanization, and cryptographic authorship verification. Built for creators, researchers, publishers, and enterprise teams.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              to="/all-pages"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary text-sm font-semibold transition-colors"
            >
              <Globe className="w-4 h-4" />
              <span>Browse All Pages Directory</span>
            </Link>
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-2.5">
                {socialLinks.map(link => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Follow us on ${link.platform}`}
                    className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white transition-all"
                  >
                    {renderIcon(link.platform)}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 5-Column Navigation Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-6 mb-16">
          {visibleColumns.map((col) => (
            <div key={col.title}>
              <h3 className="font-bold text-sm mb-5 text-foreground uppercase tracking-wider text-xs font-mono text-muted-foreground">
                {col.title}
              </h3>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      to={link.href}
                      className={`text-sm transition-colors ${
                        link.isHighlight
                          ? 'text-primary font-semibold hover:underline flex items-center gap-1.5'
                          : 'text-muted-foreground hover:text-primary font-medium'
                      }`}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border/70 pt-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-muted-foreground">
          <p className="font-medium">
            © {new Date().getFullYear()} AIDetector.cx. All rights reserved. Provenance and attribution guaranteed.
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-500" /> SOC-2 Type II Certified
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> GDPR & CCPA Compliant
            </span>
            <Link to="/all-pages" className="hover:text-primary transition-colors font-medium underline">
              Site Directory
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
