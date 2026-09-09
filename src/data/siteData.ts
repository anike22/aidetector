// Shared data and types for AIDetector.cx

import { articleContentHtml, faqData } from './articles/can-universities-detect-chatgpt';

export interface AiTool {
  id: string;
  name: string;
  category: string;
  description: string;
  rating: number;
  reviewCount: number;
  pricing: string;
  pricingType: 'free' | 'freemium' | 'paid';
  logo: string;
  tags: string[];
  url: string;
  featured?: boolean;
}

export type ContentHub = 'guides' | 'research' | 'comparisons' | 'blog';

export interface BlogPostFaqItem {
  question: string;
  answer: string;
}

export interface BlogPost {
  id: string;
  slug?: string;
  hub: ContentHub;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  authorAvatar: string;
  date: string;
  readTime: string;
  image?: string | null;
  featured?: boolean;
  content?: string;
  contentHtml?: string;
  faq?: BlogPostFaqItem[];
}

export interface ForumPost {
  id: string;
  title: string;
  author: string;
  authorAvatar: string;
  category: string;
  replies: number;
  views: number;
  lastActivity: string;
  reputation: number;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  avatar: string;
  quote: string;
  rating: number;
}

export interface MarketplaceProduct {
  id: string;
  name: string;
  creator: string;
  creatorAvatar: string;
  category: string;
  price: number;
  rating: number;
  reviewCount: number;
  image: string;
  description: string;
  badge?: string;
}

export const AI_TOOLS: AiTool[] = [
  {
    id: 'aidetector-core',
    name: 'AIDetector.cx Multi-Engine AI Detector',
    category: 'Writing',
    description: 'Enterprise multi-engine AI text detection with probability scoring and sentence breakdown.',
    rating: 4.9,
    reviewCount: 38400,
    pricing: 'Free / $19/mo',
    pricingType: 'freemium',
    logo: '🔍',
    tags: ['AI Detection', 'Originality', 'Education'],
    url: '/detector',
    featured: true,
  },
  {
    id: 'aihumanizer-core',
    name: 'AIDetector.cx AI Humanizer',
    category: 'Writing',
    description: 'Paraphrase and restructure AI drafts to achieve 100% natural, undetectable human writing flow.',
    rating: 4.9,
    reviewCount: 29500,
    pricing: 'Free / $19/mo',
    pricingType: 'freemium',
    logo: '✍️',
    tags: ['Humanizer', 'Paraphrasing', 'SEO'],
    url: '/humanizer',
    featured: true,
  },
  {
    id: 'ai-image-detector-core',
    name: 'AIDetector.cx AI Image Detector',
    category: 'Design',
    description: 'Detect Midjourney, DALL-E, Stable Diffusion, and Flux synthetic imagery with pixel frequency analysis.',
    rating: 4.8,
    reviewCount: 14200,
    pricing: 'Free / $19/mo',
    pricingType: 'freemium',
    logo: '🖼️',
    tags: ['Image Forensics', 'Diffusion Detection', 'Media'],
    url: '/ai-image-detector',
    featured: true,
  },
  {
    id: 'ai-video-detector-core',
    name: 'AIDetector.cx AI Video Detector',
    category: 'Video',
    description: 'Multi-modal optical flow, temporal coherence, and C2PA provenance analysis for Sora, Runway & deepfakes.',
    rating: 4.9,
    reviewCount: 16800,
    pricing: 'Free / $29/mo',
    pricingType: 'freemium',
    logo: '🎥',
    tags: ['Video Forensics', 'Deepfake Detection', 'Optical Flow'],
    url: '/ai-video-detector',
    featured: true,
  },
  {
    id: 'verified-authorship-core',
    name: 'AIDetector.cx Verified Authorship',
    category: 'Writing',
    description: 'Cryptographic proof of human authorship, immutable timestamps, and verifiable public certificates.',
    rating: 4.9,
    reviewCount: 9600,
    pricing: 'Free / $15/mo',
    pricingType: 'freemium',
    logo: '🛡️',
    tags: ['Authorship', 'Certificates', 'Blockchain'],
    url: '/authorship',
    featured: true,
  },
  {
    id: 'plagiarism-checker-core',
    name: 'AIDetector.cx Plagiarism Checker',
    category: 'Writing',
    description: 'Scan billions of academic papers, publications, and web sources for verbatim and paraphrased matches.',
    rating: 4.8,
    reviewCount: 18100,
    pricing: 'Free / $19/mo',
    pricingType: 'freemium',
    logo: '📄',
    tags: ['Plagiarism', 'Academic Integrity', 'Research'],
    url: '/plagiarism-checker',
    featured: true,
  },
  {
    id: 'essay-studio-core',
    name: 'AIDetector.cx Essay Studio',
    category: 'Writing',
    description: 'Guided academic essay builder with step-by-step drafting history and humanized verification.',
    rating: 4.8,
    reviewCount: 11200,
    pricing: 'Free / $15/mo',
    pricingType: 'freemium',
    logo: '🎓',
    tags: ['Academic', 'Essay Writing', 'Student'],
    url: '/essay-studio',
    featured: true,
  },
  {
    id: '1',
    name: 'ChatGPT',
    category: 'Writing',
    description: 'Advanced AI language model for writing, coding, analysis, and creative tasks.',
    rating: 4.8,
    reviewCount: 12400,
    pricing: 'Free / $20/mo',
    pricingType: 'freemium',
    logo: '🤖',
    tags: ['Writing', 'Coding', 'Analysis'],
    url: '#',
    featured: true,
  },
  {
    id: '2',
    name: 'Midjourney',
    category: 'Design',
    description: 'Create stunning AI-generated artwork, illustrations and designs from text prompts.',
    rating: 4.7,
    reviewCount: 8300,
    pricing: '$10/mo',
    pricingType: 'paid',
    logo: '🎨',
    tags: ['Design', 'Art', 'Images'],
    url: '#',
    featured: true,
  },
  {
    id: '3',
    name: 'Copy.ai',
    category: 'Marketing',
    description: 'AI-powered marketing copy, ad headlines, email campaigns, and sales scripts.',
    rating: 4.5,
    reviewCount: 3200,
    pricing: 'Free / $36/mo',
    pricingType: 'freemium',
    logo: '✍️',
    tags: ['Marketing', 'Copywriting'],
    url: '#',
  },
  {
    id: '4',
    name: 'GitHub Copilot',
    category: 'Coding',
    description: 'AI pair programmer that suggests code completions and helps debug faster.',
    rating: 4.6,
    reviewCount: 6700,
    pricing: '$10/mo',
    pricingType: 'paid',
    logo: '💻',
    tags: ['Coding', 'Development'],
    url: '#',
    featured: true,
  },
  {
    id: '5',
    name: 'Synthesia',
    category: 'Video',
    description: 'Create professional AI videos with realistic avatars without cameras or studios.',
    rating: 4.4,
    reviewCount: 2100,
    pricing: '$22/mo',
    pricingType: 'paid',
    logo: '🎬',
    tags: ['Video', 'Marketing'],
    url: '#',
  },
  {
    id: '6',
    name: 'Zapier',
    category: 'Automation',
    description: 'Connect 6000+ apps and automate workflows without writing code.',
    rating: 4.7,
    reviewCount: 15200,
    pricing: 'Free / $19.99/mo',
    pricingType: 'freemium',
    logo: '⚡',
    tags: ['Automation', 'Productivity'],
    url: '#',
    featured: true,
  },
  {
    id: '7',
    name: 'Jasper',
    category: 'Writing',
    description: 'AI content platform for teams. Generate blogs, ads, emails at scale.',
    rating: 4.3,
    reviewCount: 4800,
    pricing: '$49/mo',
    pricingType: 'paid',
    logo: '📝',
    tags: ['Writing', 'Marketing'],
    url: '#',
  },
  {
    id: '8',
    name: 'Beautiful.ai',
    category: 'Design',
    description: 'Smart presentation software that designs beautiful slides automatically.',
    rating: 4.4,
    reviewCount: 1900,
    pricing: 'Free / $12/mo',
    pricingType: 'freemium',
    logo: '📊',
    tags: ['Design', 'Presentations'],
    url: '#',
  },
  {
    id: '9',
    name: 'Surfer SEO',
    category: 'Marketing',
    description: 'AI-driven SEO optimization tool to rank higher on Google.',
    rating: 4.5,
    reviewCount: 3600,
    pricing: '$49/mo',
    pricingType: 'paid',
    logo: '🌊',
    tags: ['SEO', 'Marketing'],
    url: '#',
  },
];

export const BLOG_POSTS: BlogPost[] = [
  {
    id: 'can-universities-detect-chatgpt',
    hub: 'guides',
    title: 'Can Universities Detect ChatGPT? Complete 2026 Guide',
    excerpt: 'Universities do not detect ChatGPT directly. Learn how AI detectors, stylometry, draft history, citations, and human judgment are used, what the limits are, and how to use AI responsibly in academic work.',
    category: 'AI Detection',
    author: 'AIDetector.cx Research Team',
    authorAvatar: '🎓',
    date: 'August 1, 2026',
    readTime: '24 min read',
    image: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_2725f082-7956-4e46-9f29-42f125b920fe.jpg',
    featured: true,
    contentHtml: articleContentHtml,
    faq: faqData,
  },
  {
    id: 'best-ai-detector',
    hub: 'guides',
    title: 'Best AI Detector in 2026: Definitive Comparison',
    excerpt: 'We tested AIDetector.cx, GPTZero, Originality.ai, Copyleaks, Winston AI, and ZeroGPT against GPT-5.5 and Gemini. See which detector wins for SEO, academic, and enterprise use.',
    category: 'AI Detection',
    author: 'AIDetector.cx Research Team',
    authorAvatar: '🔍',
    date: 'June 1, 2026',
    readTime: '18 min read',
    image: 'https://hzjnrmxwzkeaodvusszx.supabase.co/storage/v1/object/public/images/uploads/acxhgj25i5r.webp',
    featured: true,
  },
  {
    id: 'why-was-my-essay-flagged-as-ai',
    hub: 'guides',
    title: 'Why Was My Essay Flagged as AI? Complete Guide 2026',
    excerpt: 'Discover why AI detectors flag human essays, how detection works, and what to do if your writing is incorrectly identified as AI-generated. Evidence-based guide with original research.',
    category: 'AI Detection',
    author: 'Dr. Elena Voss',
    authorAvatar: '🎓',
    date: 'July 27, 2026',
    readTime: '14 min read',
    image: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_dd277352-e1ee-463e-8d0c-ed3988d35393.jpg',
  },
  {
    id: 'words-that-trigger-ai-detection',
    hub: 'guides',
    title: 'List of Words That Trigger AI Detection: What Actually Makes Text Look AI-Generated',
    excerpt: 'No magic list of forbidden words exists. Learn what AI detectors really analyze, which phrases are commonly associated with AI output, and how to write more naturally.',
    category: 'AI Detection',
    author: 'Dr. Elena Voss',
    authorAvatar: '✍️',
    date: 'June 1, 2026',
    readTime: '14 min read',
    image: null,
  },
  {
    id: 'turnitin-vs-aidetector-cx',
    hub: 'comparisons',
    title: 'Turnitin vs AIDetector.cx: 2026 Comparison',
    excerpt: 'A detailed comparison of Turnitin and AIDetector.cx for universities, publishers, SEO agencies, and recruiters. Accuracy, pricing, workflows, and final verdicts by audience.',
    category: 'AI Detection',
    author: 'AIDetector.cx Research Team',
    authorAvatar: '🎓',
    date: 'June 1, 2026',
    readTime: '22 min read',
    image: 'https://hzjnrmxwzkeaodvusszx.supabase.co/storage/v1/object/public/images/uploads/kx2xvfnoq7e.webp',
  },
  {
    id: 'how-ai-detection-works',
    hub: 'guides',
    title: 'How AI Detection Works: A Technical Guide',
    excerpt: 'Learn how AI text detectors use classifiers and statistical signals, how detection scores are evaluated, and why false positives and false negatives occur.',
    category: 'AI Detection',
    author: 'AIDetector.cx Research Team',
    authorAvatar: '🧠',
    date: 'June 1, 2026',
    readTime: '14 min read',
    image: 'https://hzjnrmxwzkeaodvusszx.supabase.co/storage/v1/object/public/images/uploads/zrk7ui8pebr.png',
  },
  {
    id: 'ai-detection-accuracy-tests',
    hub: 'research',
    title: 'AI Detection Accuracy Tests: Transparent Benchmark',
    excerpt: 'Independent benchmark of AIDetector.cx, Turnitin, GPTZero, Originality.ai, Copyleaks, Winston AI, and ZeroGPT across 400 documents.',
    category: 'AI Detection',
    author: 'AIDetector.cx Research Team',
    authorAvatar: '📊',
    date: 'June 1, 2026',
    readTime: '26 min read',
    image: 'https://hzjnrmxwzkeaodvusszx.supabase.co/storage/v1/object/public/images/uploads/z3xhjuonmp.webp',
  },
  {
    id: 'chatgpt-detector-comparison',
    hub: 'comparisons',
    title: 'ChatGPT Detector Comparison: GPT-4 vs GPT-5.5',
    excerpt: 'Compare how top AI detectors handle raw and edited ChatGPT outputs from GPT-4, GPT-4o, and GPT-5.5 across academic, SEO, and marketing use cases.',
    category: 'AI Detection',
    author: 'AIDetector.cx Research Team',
    authorAvatar: '💬',
    date: 'June 1, 2026',
    readTime: '14 min read',
    image: 'https://hzjnrmxwzkeaodvusszx.supabase.co/storage/v1/object/public/images/uploads/0mhkot6e6g8s.webp',
  },
  {
    id: 'gpt-5-vs-gemini-detection',
    hub: 'research',
    title: 'GPT-5.5 vs Gemini Detection: Algorithmic Differences',
    excerpt: 'Understand why GPT-5.5 and Gemini produce different AI detection scores and how modern detectors analyze their writing patterns.',
    category: 'AI Detection',
    author: 'AIDetector.cx Research Team',
    authorAvatar: '⚖️',
    date: 'June 1, 2026',
    readTime: '12 min read',
    image: 'https://hzjnrmxwzkeaodvusszx.supabase.co/storage/v1/object/public/images/uploads/xbr1cs6frn8.webp',
  },
  {
    id: 'why-tiktok-flagged-my-real-video',
    slug: 'why-tiktok-flagged-my-real-video',
    hub: 'guides',
    title: 'Why Did TikTok Flag My Real Video as AI? Creator Troubleshooting Guide (2026)',
    excerpt: 'Step-by-step diagnostic guide for content creators falsely flagged by TikTok AI detection algorithms. Learn how compression, frame interpolation, and lighting trigger false positives.',
    category: 'Video Detection',
    author: 'AIDetector.cx Research Team',
    authorAvatar: '🎬',
    date: 'August 15, 2026',
    readTime: '16 min read',
    image: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_2725f082-7956-4e46-9f29-42f125b920fe.jpg',
    featured: true,
  },
  {
    id: 'whatsapp-compression-ai-video',
    slug: 'whatsapp-compression-ai-video',
    hub: 'research',
    title: 'WhatsApp Video Compression & AI Detection: Macroblocking and Temporal Artifacts',
    excerpt: 'Technical study on how WhatsApp video encoding, bitrate quantization, and GOP structure trigger false alarms in neural video detectors.',
    category: 'Video Forensics',
    author: 'AIDetector.cx Forensics Lab',
    authorAvatar: '🔬',
    date: 'August 20, 2026',
    readTime: '18 min read',
    image: 'https://hzjnrmxwzkeaodvusszx.supabase.co/storage/v1/object/public/images/uploads/z3xhjuonmp.webp',
    featured: true,
  },
  {
    id: 'authentic-video-false-positives',
    slug: 'authentic-video-false-positives',
    hub: 'guides',
    title: 'Authentic Video False Positive Guide: Why Pristine Footage Triggers AI Detectors',
    excerpt: 'Comprehensive analysis of optical flow artifacts, electronic image stabilization, and HDR tone mapping in authentic smartphone and cinema video.',
    category: 'Video Forensics',
    author: 'AIDetector.cx Research Team',
    authorAvatar: '📹',
    date: 'August 28, 2026',
    readTime: '14 min read',
    image: 'https://hzjnrmxwzkeaodvusszx.supabase.co/storage/v1/object/public/images/uploads/acxhgj25i5r.webp',
  },
];

export const FORUM_POSTS: ForumPost[] = [
  {
    id: '1',
    title: 'Just hit $5k MRR with my AI content agency — here\'s everything I did',
    author: 'TechFounder_Alex',
    authorAvatar: '👨‍💻',
    category: 'Success Stories',
    replies: 87,
    views: 4200,
    lastActivity: '2h ago',
    reputation: 1240,
  },
  {
    id: '2',
    title: 'Best AI tools for solopreneurs in 2026 - comprehensive list',
    author: 'AIEnthusiast',
    authorAvatar: '🤖',
    category: 'AI Tools',
    replies: 64,
    views: 3800,
    lastActivity: '4h ago',
    reputation: 890,
  },
  {
    id: '3',
    title: 'How I automated my entire client onboarding with n8n',
    author: 'AutomationGuru',
    authorAvatar: '⚡',
    category: 'Automation',
    replies: 52,
    views: 2900,
    lastActivity: '6h ago',
    reputation: 675,
  },
  {
    id: '4',
    title: 'ChatGPT vs Claude vs Gemini for business writing — honest review',
    author: 'ContentCreator',
    authorAvatar: '✍️',
    category: 'AI Tools',
    replies: 45,
    views: 2400,
    lastActivity: '8h ago',
    reputation: 420,
  },
  {
    id: '5',
    title: 'Profitable niche ideas for AI-powered businesses in 2026',
    author: 'StartupHunter',
    authorAvatar: '🚀',
    category: 'Business Ideas',
    replies: 38,
    views: 1900,
    lastActivity: '12h ago',
    reputation: 310,
  },
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: '1',
    name: 'Jessica Wu',
    role: 'Content Director',
    company: 'GrowthLabs',
    avatar: '👩‍💼',
    quote: 'AIDetector.cx transformed how our team validates content. We cut our QA time by 70% and our publishing risk dropped to near zero.',
    rating: 5,
  },
  {
    id: '2',
    name: 'Marcus Thompson',
    role: 'Founder & CEO',
    company: 'Contentify',
    avatar: '👨‍🚀',
    quote: 'The AI tools directory alone saved us 40+ hours of research. We found our entire tech stack in one afternoon.',
    rating: 5,
  },
  {
    id: '3',
    name: 'Priya Sharma',
    role: 'SEO Manager',
    company: 'ScaleUp Agency',
    avatar: '👩‍💻',
    quote: 'The business guides are next level. I went from 0 to $8k/month implementing just 3 of the monetization strategies.',
    rating: 5,
  },
  {
    id: '4',
    name: 'Daniel Kim',
    role: 'Indie Hacker',
    company: 'SoloBuilder',
    avatar: '👨‍💡',
    quote: 'The community here is unlike anything else. Real builders sharing real results. No fluff.',
    rating: 5,
  },
];

export const MARKETPLACE_PRODUCTS: MarketplaceProduct[] = [
  {
    id: '1',
    name: 'Ultimate ChatGPT Prompt Pack',
    creator: 'PromptMaster',
    creatorAvatar: '🧠',
    category: 'AI Prompts',
    price: 29,
    rating: 4.8,
    reviewCount: 342,
    image: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_e52096b9-e6de-48c0-b765-497c39543215.jpg',
    description: '500+ battle-tested prompts for business, marketing, and content creation.',
    badge: 'Best Seller',
  },
  {
    id: '2',
    name: 'SaaS Business Plan Template',
    creator: 'StartupOS',
    creatorAvatar: '📋',
    category: 'Business Plans',
    price: 49,
    rating: 4.7,
    reviewCount: 187,
    image: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_f36c530c-0579-4dc5-815f-a1ba3bd5ab93.jpg',
    description: 'Complete Notion-based business planning system used by 500+ founders.',
    badge: 'Popular',
  },
  {
    id: '3',
    name: 'Social Media Automation Workflow',
    creator: 'FlowBuilder',
    creatorAvatar: '⚡',
    category: 'Automation',
    price: 37,
    rating: 4.6,
    reviewCount: 156,
    image: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_e9d79c19-b626-4065-b0b8-ef3f139c6a0c.jpg',
    description: 'Complete n8n workflow for automated social media posting and analytics.',
  },
  {
    id: '4',
    name: 'Freelancer Notion System',
    creator: 'NotionPro',
    creatorAvatar: '📓',
    category: 'Notion Systems',
    price: 24,
    rating: 4.9,
    reviewCount: 428,
    image: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_981d71f8-3d50-45cb-9051-24df2d68ef72.jpg',
    description: 'All-in-one Notion workspace for freelancers — clients, projects, and invoices.',
    badge: 'Top Rated',
  },
];
