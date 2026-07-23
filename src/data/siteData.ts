// Shared data and types for AIDetector.cx

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

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  authorAvatar: string;
  date: string;
  readTime: string;
  image: string;
  featured?: boolean;
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
    id: 'best-ai-detector',
    title: 'Best AI Detector in 2026: Definitive Comparison',
    excerpt: 'We tested AIDetector.cx, GPTZero, Originality.ai, Copyleaks, Winston AI, and ZeroGPT against GPT-5.5 and Gemini. See which detector wins for SEO, academic, and enterprise use.',
    category: 'SEO',
    author: 'AIDetector.cx Research Team',
    authorAvatar: '🔍',
    date: 'June 1, 2026',
    readTime: '18 min read',
    image: 'https://miaoda-site-img.s3cdn.medo.dev/app-icons/app_icon_128c0c18-8557-4863-9f08-5ec933ee3619.png',
    featured: true,
  },
  {
    id: 'turnitin-vs-aidetector-cx',
    title: 'Turnitin vs AIDetector.cx: 2026 Comparison',
    excerpt: 'A detailed comparison of Turnitin and AIDetector.cx for universities, publishers, SEO agencies, and recruiters. Accuracy, pricing, workflows, and final verdicts by audience.',
    category: 'AI Detection',
    author: 'AIDetector.cx Research Team',
    authorAvatar: '🎓',
    date: 'June 1, 2026',
    readTime: '22 min read',
    image: 'https://miaoda-site-img.s3cdn.medo.dev/app-icons/app_icon_128c0c18-8557-4863-9f08-5ec933ee3619.png',
  },
  {
    id: 'how-ai-detection-works',
    title: 'How AI Detection Works: The Complete Technical Guide',
    excerpt: 'Learn how AI detectors identify machine-generated text through perplexity, burstiness, entropy, neural classifiers, and ensemble models.',
    category: 'AI Detection',
    author: 'AIDetector.cx Research Team',
    authorAvatar: '🧠',
    date: 'June 1, 2026',
    readTime: '24 min read',
    image: 'https://miaoda-site-img.s3cdn.medo.dev/app-icons/app_icon_128c0c18-8557-4863-9f08-5ec933ee3619.png',
  },
  {
    id: 'ai-detection-accuracy-tests',
    title: 'AI Detection Accuracy Tests: Transparent Benchmark',
    excerpt: 'Independent benchmark of AIDetector.cx, Turnitin, GPTZero, Originality.ai, Copyleaks, Winston AI, and ZeroGPT across 400 documents.',
    category: 'AI Detection',
    author: 'AIDetector.cx Research Team',
    authorAvatar: '📊',
    date: 'June 1, 2026',
    readTime: '26 min read',
    image: 'https://miaoda-site-img.s3cdn.medo.dev/app-icons/app_icon_128c0c18-8557-4863-9f08-5ec933ee3619.png',
  },
  {
    id: 'chatgpt-detector-comparison',
    title: 'ChatGPT Detector Comparison: GPT-4 vs GPT-5.5',
    excerpt: 'Compare how top AI detectors handle raw and edited ChatGPT outputs from GPT-4, GPT-4o, and GPT-5.5 across academic, SEO, and marketing use cases.',
    category: 'AI Detection',
    author: 'AIDetector.cx Research Team',
    authorAvatar: '💬',
    date: 'June 1, 2026',
    readTime: '14 min read',
    image: 'https://miaoda-site-img.s3cdn.medo.dev/app-icons/app_icon_128c0c18-8557-4863-9f08-5ec933ee3619.png',
  },
  {
    id: 'gpt-5-vs-gemini-detection',
    title: 'GPT-5.5 vs Gemini Detection: Algorithmic Differences',
    excerpt: 'Understand why GPT-5.5 and Gemini produce different AI detection scores and how modern detectors analyze their writing patterns.',
    category: 'AI Detection',
    author: 'AIDetector.cx Research Team',
    authorAvatar: '⚖️',
    date: 'June 1, 2026',
    readTime: '12 min read',
    image: 'https://miaoda-site-img.s3cdn.medo.dev/app-icons/app_icon_128c0c18-8557-4863-9f08-5ec933ee3619.png',
  },
  {
    id: '1',
    title: 'How to Build a $10K/Month SaaS Business Using AI in 2026',
    excerpt: 'A step-by-step guide to launching a profitable software business leveraging the latest AI tools and automation strategies.',
    category: 'AI Business',
    author: 'Alex Chen',
    authorAvatar: '👨‍💻',
    date: 'May 28, 2026',
    readTime: '12 min read',
    image: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_1bbf72ee-ffb3-450e-a7f8-d5eb512a9f5c.jpg',
  },
  {
    id: '2',
    title: '10 AI Automation Workflows That Save 20+ Hours Per Week',
    excerpt: 'Discover the most powerful automation setups using n8n, Zapier, and AI to eliminate repetitive tasks from your workflow.',
    category: 'Automation',
    author: 'Sarah Kim',
    authorAvatar: '👩‍💼',
    date: 'May 24, 2026',
    readTime: '8 min read',
    image: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_6c03fd38-871b-4013-810f-dbbc601b71c4.jpg',
  },
  {
    id: '3',
    title: 'The Founder\'s Guide to AI-Powered Content Marketing',
    excerpt: 'How early-stage startups are using AI content tools to compete with established brands on a fraction of the budget.',
    category: 'Marketing',
    author: 'Marcus Johnson',
    authorAvatar: '👨‍🎯',
    date: 'May 20, 2026',
    readTime: '10 min read',
    image: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_2308d570-655d-4dc2-aaef-bd9e27d45607.jpg',
  },
  {
    id: '4',
    title: 'SEO in the Age of AI: What Still Works in 2026',
    excerpt: 'With AI-generated content flooding search engines, here is what real SEO strategies look like now.',
    category: 'SEO',
    author: 'Emma Rivera',
    authorAvatar: '👩‍💻',
    date: 'May 17, 2026',
    readTime: '9 min read',
    image: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_9f2eb21e-b6c6-4809-b939-49597af9111f.jpg',
  },
  {
    id: '5',
    title: 'Monetizing AI Skills: 7 Proven Ways to Earn with Prompts',
    excerpt: 'From prompt marketplaces to consulting, here is how to turn your AI knowledge into consistent income streams.',
    category: 'Monetization',
    author: 'David Park',
    authorAvatar: '👨‍💰',
    date: 'May 14, 2026',
    readTime: '7 min read',
    image: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_8258ef97-1b5f-4953-9904-caf8cebcbfcc.jpg',
  },
  {
    id: '6',
    title: 'From Zero to Funded: How AI Helped This Startup in 90 Days',
    excerpt: 'A real founder story about using AI to accelerate product development, pitch decks, and go-to-market strategy.',
    category: 'Startups',
    author: 'Priya Sharma',
    authorAvatar: '👩‍🚀',
    date: 'May 10, 2026',
    readTime: '11 min read',
    image: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_3e4294e1-8cf7-45f2-9273-c40ceea80dd8.jpg',
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
