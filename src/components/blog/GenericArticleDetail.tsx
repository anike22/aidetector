import { useMemo, useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import ArticleImage from './ArticleImage';
import { BLOG_POSTS, type BlogPost, type ContentHub } from '@/data/siteData';
import {
  ArrowLeft,
  Clock,
  Calendar,
  Share2,
  BookOpen,
  ArrowRight,
  Twitter,
  Linkedin,
  Facebook,
  Link as LinkIcon,
  Check,
  Mail,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import PageMeta from '@/components/common/PageMeta';

const hubLabels: Record<ContentHub, string> = {
  guides: 'Guides',
  research: 'Research',
  comparisons: 'Comparisons',
  blog: 'Blog',
};

const categoryColors: Record<string, string> = {
  'AI Detection': 'bg-primary/10 text-primary border-primary/20',
  SEO: 'bg-warning/10 text-warning border-warning/20',
  'AI Business': 'bg-primary/10 text-primary border-primary/20',
  Automation: 'bg-success/10 text-success border-success/20',
  Marketing: 'bg-info/10 text-info border-info/20',
  Startups: 'bg-destructive/10 text-destructive border-destructive/20',
  Monetization: 'bg-success/10 text-success border-success/20',
  Productivity: 'bg-primary/10 text-primary border-primary/20',
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function estimateReadTime(text?: string) {
  if (!text) return 5;
  const plain = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const words = plain.split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

function buildToc(post: BlogPost) {
  const headings: { id: string; text: string; level: number }[] = [];
  if (post.contentHtml) {
    const matches = post.contentHtml.matchAll(/<(h[23])(?:[^>]*)?\s+id=["']([^"']+)["'][^>]*>([\s\S]*?)<\/\1>/gi);
    for (const match of matches) {
      const level = match[1] === 'h2' ? 2 : 3;
      const id = match[2].trim();
      const text = match[3].replace(/<[^>]+>/g, '').trim();
      headings.push({ id, text, level });
    }
    return headings;
  }
  if (!post.content) return [];
  const lines = post.content.split('\n');
  for (const line of lines) {
    const match = line.match(/^(#{2,3})\s+(.+)$/);
    if (match) {
      const text = match[2].trim();
      headings.push({ id: slugify(text), text, level: match[1].length });
    }
  }
  return headings;
}

function isHtmlContent(content: string): boolean {
  const trimmed = content.trim();
  if (/^<!DOCTYPE html>/i.test(trimmed)) return true;
  if (/^<html[>\s]/i.test(trimmed)) return true;
  return /^\s*<(?:h[1-6]|p|div|ul|ol|li|blockquote|pre|table|article|section|header|footer|main|aside|nav|br|img|a|strong|em|b|i|span|code|hr)\b[^>]*>/i.test(trimmed);
}

function markdownToHtml(content: string): string {
  let html = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // fenced code blocks
  html = html.replace(/```(?:\w+)?\n([\s\S]*?)\n```/g, '<pre><code>$1</code></pre>');

  // inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // headings
  html = html.replace(/^(#{1,6})\s+(.+)$/gm, (_, hashes, text) => {
    const level = Math.min(hashes.length, 6);
    const id = slugify(text.trim());
    return `<h${level} id="${id}">${text.trim()}</h${level}>`;
  });

  // images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');

  // links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // bold / italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');

  // horizontal rules
  html = html.replace(/^---$/gm, '<hr/>');

  // blockquotes
  html = html.replace(/^>(.+)$/gm, '<blockquote>$1</blockquote>');

  // unordered lists
  html = html.replace(/^(?:[-*])\s+(.+)$/gm, '<li>$1</li>');
  // ordered lists
  html = html.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');

  // wrap consecutive list items in a single list
  html = html.replace(/(<li>[\s\S]*?<\/li>\n*)+/g, (match) => {
    const hasOrderedMarker = /^\d+\.\s/m.test(content);
    const cleaned = match.replace(/\n/g, '');
    return hasOrderedMarker ? `<ol>${cleaned}</ol>` : `<ul>${cleaned}</ul>`;
  });

  // paragraphs
  html = html.replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>');

  return `<p>${html}</p>`;
}

function enrichContentHtml(post: BlogPost) {
  if (post.contentHtml) return post.contentHtml;
  if (!post.content) return '';

  const content = post.content;

  // HTML content is published as-is so tags are rendered, not displayed as text.
  if (isHtmlContent(content)) {
    return content;
  }

  // Markdown-aware formatting; falls back to plain-text escaping if no Markdown syntax is present.
  return markdownToHtml(content);
}

function SocialShare({ title, url }: { title: string; url: string }) {
  const shareLinks = [
    {
      name: 'Twitter',
      icon: Twitter,
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
    {
      name: 'Facebook',
      icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
  ];

  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex items-center gap-2">
      {shareLinks.map((s) => (
        <a
          key={s.name}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-border bg-background hover:bg-muted transition-colors"
          aria-label={`Share on ${s.name}`}
        >
          <s.icon className="w-4 h-4 text-foreground/70" />
        </a>
      ))}
      <Button
        variant="outline"
        size="icon"
        className="rounded-full w-9 h-9"
        onClick={copy}
        aria-label="Copy link"
      >
        {copied ? <Check className="w-4 h-4 text-success" /> : <LinkIcon className="w-4 h-4" />}
      </Button>
    </div>
  );
}

function NewsletterSignup() {
  const [email, setEmail] = useState('');
  return (
    <Card className="border-primary/20 bg-primary/5 my-10">
      <CardContent className="p-6 md:p-8">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary mb-4">
          <Mail className="w-5 h-5" />
        </div>
        <h3 className="text-lg md:text-xl font-bold text-navy mb-2 text-balance">Stay ahead of AI detection trends</h3>
        <p className="text-sm text-muted-foreground text-pretty mb-5 max-w-lg mx-auto">
          Get the latest guides, research, and product updates from AIDetector.cx delivered to your inbox.
        </p>
        <form
          className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto"
          onSubmit={(e) => {
            e.preventDefault();
            toast.success('Thanks for subscribing!');
            setEmail('');
          }}
        >
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1"
            required
          />
          <Button type="submit" className="shrink-0">Subscribe</Button>
        </form>
      </CardContent>
    </Card>
  );
}

function RecommendedTools() {
  const tools = [
    { title: 'AI Detector', href: '/detector', desc: 'Analyze text for AI-generated patterns.' },
    { title: 'AI Humanizer', href: '/humanizer', desc: 'Make AI-generated text sound more human.' },
    { title: 'Plagiarism Checker', href: '/plagiarism-checker', desc: 'Verify originality across billions of sources.' },
  ];
  return (
    <div className="my-10">
      <h3 className="text-lg font-bold text-navy mb-4">Recommended Tools</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {tools.map((t) => (
          <Link key={t.title} to={t.href}>
            <Card className="h-full border-border hover:border-primary/40 transition-colors group">
              <CardContent className="p-4">
                <h4 className="font-semibold text-navy group-hover:text-primary transition-colors mb-1">{t.title}</h4>
                <p className="text-xs text-muted-foreground text-pretty">{t.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function GenericArticleDetail({ post }: { post: BlogPost }) {
  const [activeId, setActiveId] = useState('');
  const articleUrl = typeof window !== 'undefined' ? window.location.href : '';
  const toc = useMemo(() => buildToc(post), [post]);
  const contentRef = useRef<HTMLDivElement>(null);
  const readTime = post.readTime || `${estimateReadTime(post.contentHtml || post.content)} min read`;

  useEffect(() => {
    if (!toc.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = new Map<string, number>();
        entries.forEach((entry) => {
          const id = entry.target.getAttribute('id') || '';
          if (entry.isIntersecting) visible.set(id, entry.intersectionRatio);
        });
        let bestId = toc[0].id;
        let bestRatio = 0;
        visible.forEach((ratio, id) => {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestId = id;
          }
        });
        if (bestId) setActiveId(bestId);
      },
      { rootMargin: '-10% 0px -60% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    const headings = contentRef.current?.querySelectorAll('h2[id], h3[id]');
    headings?.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [toc]);

  const related = useMemo(() => {
    const sameHub = BLOG_POSTS.filter((p) => p.id !== post.id && p.hub === post.hub);
    const fallback = BLOG_POSTS.filter((p) => p.id !== post.id);
    return (sameHub.length ? sameHub : fallback).slice(0, 3);
  }, [post]);

  const schemas = useMemo(() => {
    const articleSchema = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: post.excerpt,
      author: { '@type': 'Person', name: post.author },
      publisher: {
        '@type': 'Organization',
        name: 'AIDetector.cx',
        logo: {
          '@type': 'ImageObject',
          url: 'https://miaoda-site-img.s3cdn.medo.dev/app-icons/app_icon_128c0c18-8557-4863-9f08-5ec933ee3619.png',
        },
      },
      datePublished: post.date,
      image: post.image || undefined,
      url: articleUrl,
    };
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://aidetector.cx/',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: hubLabels[post.hub],
          item: `https://aidetector.cx/${post.hub}`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: post.title,
          item: articleUrl,
        },
      ],
    };
    if (!post.faq || post.faq.length === 0) return [articleSchema, breadcrumbSchema];
    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: post.faq.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    };
    return [articleSchema, breadcrumbSchema, faqSchema];
  }, [post, articleUrl]);

  const handleTocClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <PageMeta
        title={post.title}
        description={post.excerpt}
        canonicalUrl={articleUrl}
        ogTitle={post.title}
        ogDescription={post.excerpt}
        ogImage={post.image || undefined}
        ogType="article"
        schemas={schemas}
      />
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-10">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Desktop TOC */}
          {toc.length > 0 && (
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-24">
                <h3 className="text-sm font-bold text-navy uppercase tracking-wide mb-3">On this page</h3>
                <ScrollArea className="h-[calc(100vh-8rem)]">
                  <ul className="space-y-1 pr-4">
                    {toc.map((h) => (
                      <li key={h.id}>
                        <button
                          type="button"
                          onClick={() => handleTocClick(h.id)}
                          className={`w-full text-left text-sm px-2 py-1.5 rounded-md transition-colors ${
                            activeId === h.id
                              ? 'bg-primary/10 text-primary font-semibold'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          } ${h.level === 3 ? 'pl-4' : ''}`}
                        >
                          {h.text}
                        </button>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </div>
            </aside>
          )}

          <article className="flex-1 min-w-0">
            {/* Breadcrumbs */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
              <Link to="/" className="hover:text-foreground">Home</Link>
              <ChevronRight className="w-4 h-4" />
              <Link to={`/${post.hub}`} className="hover:text-foreground capitalize">
                {hubLabels[post.hub]}
              </Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-foreground truncate max-w-[12rem] md:max-w-xs">{post.title}</span>
            </nav>

            <Link to={`/${post.hub}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to {hubLabels[post.hub]}
            </Link>

            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge variant="outline" className={`text-xs ${categoryColors[post.category] || 'text-muted-foreground border-border'}`}>
                {post.category}
              </Badge>
              {post.featured && <Badge className="text-xs bg-primary text-primary-foreground">Featured</Badge>}
            </div>

            <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-navy text-balance leading-tight mb-6">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8">
              <div className="flex items-center gap-2">
                <span className="text-xl">{post.authorAvatar}</span>
                <span className="font-medium text-foreground/80">{post.author}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>{post.date}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>{readTime}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" />
                <span>{estimateReadTime(post.contentHtml || post.content)} min read</span>
              </div>
              <SocialShare title={post.title} url={articleUrl} />
            </div>

            <div className="aspect-[16/9] rounded-2xl mb-10 shadow-card overflow-hidden">
              <ArticleImage
                src={post.image}
                alt={post.title}
                containerClassName="w-full h-full"
                loading="eager"
                fetchPriority="high"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-10">
              <div>
                <div
                  ref={contentRef}
                  className="prose-container max-w-none text-foreground/80 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: enrichContentHtml(post) }}
                />

                {post.faq && post.faq.length > 0 && (
                  <div className="mt-12">
                    <h2 id="frequently-asked-questions" className="text-2xl font-bold text-navy mb-6">
                      Frequently Asked Questions
                    </h2>
                    <Accordion type="multiple" className="w-full">
                      {post.faq.map((item, index) => (
                        <AccordionItem key={index} value={`faq-${index}`}>
                          <AccordionTrigger className="text-left font-semibold text-navy hover:no-underline">
                            {item.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-foreground/80 leading-relaxed">
                            {item.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                )}

                <Separator className="my-10" />
                <RecommendedTools />
                <NewsletterSignup />

                {related.length > 0 && (
                  <div className="mt-12">
                    <h2 className="text-lg font-bold text-navy mb-5">Related Articles</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {related.map((rel) => (
                        <Link to={`/${rel.hub}/${rel.id}`} key={rel.id}>
                          <Card className="h-full flex flex-col border-border shadow-card hover:shadow-hover transition-shadow group overflow-hidden">
                            <div className="aspect-[16/9]">
                              <ArticleImage src={rel.image} alt={rel.title} containerClassName="w-full h-full" loading="lazy" />
                            </div>
                            <CardContent className="p-4 flex flex-col flex-1">
                              <Badge variant="outline" className={`self-start text-xs mb-2 ${categoryColors[rel.category] || 'text-muted-foreground border-border'}`}>
                                {rel.category}
                              </Badge>
                              <h3 className="font-semibold text-navy text-sm leading-snug text-balance group-hover:text-primary transition-colors flex-1">
                                {rel.title}
                              </h3>
                              <div className="flex items-center gap-1 mt-3 text-xs text-primary font-medium">
                                Read article <ArrowRight className="w-3 h-3" />
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar: author + CTA */}
              <aside className="space-y-6">
                <Card className="border-border">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-2xl shrink-0">
                        {post.authorAvatar}
                      </div>
                      <div>
                        <div className="font-semibold text-navy text-sm">{post.author}</div>
                        <div className="text-xs text-muted-foreground">Contributor at AIDetector.cx</div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground text-pretty">
                      Expert in {post.category}. Helping professionals understand and work with AI-generated content.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-5">
                    <h4 className="font-bold text-navy mb-2">Analyze your content</h4>
                    <p className="text-sm text-muted-foreground text-pretty mb-4">
                      Check whether your text is AI-generated with AIDetector.cx.
                    </p>
                    <Button asChild className="w-full">
                      <Link to="/detector">Open AI Detector</Link>
                    </Button>
                  </CardContent>
                </Card>
              </aside>
            </div>
          </article>
        </div>
      </div>
    </>
  );
}
