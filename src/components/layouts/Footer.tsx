import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bot, Twitter, Linkedin, Github, Mail, Shield, CheckCircle2, Instagram, Facebook, Youtube, Send } from 'lucide-react';
import { supabase } from '@/db/supabase';

const footerLinks = {
  product: [
    { label: 'AI Detector', href: '/detector' },
    { label: 'AI Humanizer', href: '/humanizer' },
    { label: 'SEO Assistant', href: '/seo-assistant' },
    { label: 'Plagiarism Checker', href: '/plagiarism-checker' },
    { label: 'Pricing', href: '/pricing' },
  ],
  integrations: [
    { label: 'Chrome Extension', href: '/chrome-extension' },
    { label: 'WordPress Plugin', href: '/wordpress-plugin' },
    { label: 'Developer API', href: '/api' },
    { label: 'API Documentation', href: '/api/docs' },
    { label: 'Content Studio', href: '/content-studio' },
  ],
  resources: [
    { label: 'Blog & Guides', href: '/blog' },
    { label: 'AI Tools Directory', href: '/tools' },
    { label: 'Community Forum', href: '/community' },
    { label: 'Marketplace', href: '/marketplace' },
  ],
  services: [
    { label: 'All Services', href: '/services' },
    { label: 'SEO Consulting', href: '/services/seo-consulting' },
    { label: 'AI Consulting', href: '/services/ai-consulting' },
    { label: 'Website Dev', href: '/services/website-development' },
    { label: 'Growth Marketing', href: '/services/growth-marketing' },
  ],
  company: [
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ],
};

export default function Footer() {
  const [socialLinks, setSocialLinks] = useState<any[]>([]);

  useEffect(() => {
    async function loadSocialLinks() {
      try {
        const { data } = await supabase.from('social_links').select('*').eq('enabled', true).order('display_order', { ascending: true });
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
      case 'x': return <Twitter className="w-4 h-4" />;
      case 'tiktok': return <Bot className="w-4 h-4" />;
      case 'linkedin': return <Linkedin className="w-4 h-4" />;
      case 'youtube': return <Youtube className="w-4 h-4" />;
      case 'github': return <Github className="w-4 h-4" />;
      case 'discord': return <Send className="w-4 h-4" />;
      default: return <Bot className="w-4 h-4" />;
    }
  };

  return (
    <footer className="bg-white border-t border-border mt-32 relative overflow-hidden">
      {/* Decorative gradient blur in background */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
      
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-20">
        <div className="grid grid-cols-2 md:grid-cols-7 gap-x-8 gap-y-12 mb-16">
          {/* Brand */}
          <div className="col-span-2 md:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-6">
              <img 
                src="https://miaoda-site-img.s3cdn.medo.dev/app-icons/app_icon_128c0c18-8557-4863-9f08-5ec933ee3619.png" 
                alt="Logo" 
                className="w-10 h-10 object-contain rounded-xl shadow-sm border border-border"
              />
              <span className="font-extrabold text-2xl tracking-tight text-foreground">
                AIDetector<span className="text-primary">.cx</span>
              </span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed text-pretty max-w-sm">
              The world's most advanced AI detection and humanization platform. Built for professionals, loved by millions.
            </p>
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-4 mt-8">
                {socialLinks.map(link => (
                  <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white transition-all">
                    {renderIcon(link.platform)}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Product */}
          <div>
            <h4 className="font-bold text-sm mb-6 text-foreground">Product</h4>
            <ul className="space-y-4">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Integrations */}
          <div>
            <h4 className="font-bold text-sm mb-6 text-foreground">Integrations</h4>
            <ul className="space-y-4">
              {footerLinks.integrations.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-bold text-sm mb-6 text-foreground">Resources</h4>
            <ul className="space-y-4">
              {footerLinks.resources.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-bold text-sm mb-6 text-foreground">Services</h4>
            <ul className="space-y-4">
              {footerLinks.services.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-bold text-sm mb-6 text-foreground">Company</h4>
            <ul className="space-y-4">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-muted-foreground text-sm font-medium">
            © {new Date().getFullYear()} AIDetector.cx. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="w-4 h-4 text-primary" /> SOC2 Compliant
            </span>
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-success" /> 99.99% Uptime
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
