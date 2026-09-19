import MainLayout from '@/components/layouts/MainLayout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Bot, FileText, Image, Newspaper } from 'lucide-react';

const products = [
  'AI text detection',
  'Plagiarism checking',
  'SEO and content optimization tools',
  'AI image and video analysis tools',
  'Authorship and content-integrity workflows',
];

const mediaResources = [
  {
    icon: FileText,
    title: 'Company information',
    desc: 'Use this page and the About page for current public information about AIDetector.cx and its product focus.',
  },
  {
    icon: Image,
    title: 'Product visuals',
    desc: 'Current product screenshots can be prepared for legitimate editorial and media requests.',
  },
  {
    icon: Bot,
    title: 'Product access',
    desc: 'Journalists and researchers can evaluate the publicly available AIDetector.cx tools directly on the platform.',
  },
];

export default function PressPage() {
  return (
    <MainLayout>
      <section className="bg-navy text-white py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
          <Badge className="bg-primary/20 text-primary border-primary/30 mb-5">Press &amp; Media</Badge>
          <h1 className="text-3xl md:text-5xl font-bold mb-6 text-balance">
            AIDetector.cx Media Resources
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto text-pretty leading-relaxed">
            Background information and resources for journalists, researchers, publishers, and others covering AIDetector.cx.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="border-border shadow-card h-full">
              <CardContent className="p-6 md:p-8">
                <Badge className="bg-primary/10 text-primary border-primary/20 mb-4">About</Badge>
                <h2 className="text-2xl font-bold text-navy mb-4 text-balance">About AIDetector.cx</h2>
                <p className="text-muted-foreground leading-relaxed text-pretty">
                  AIDetector.cx is a content-analysis platform founded by Anike Tobechukwu. It develops tools for AI-content analysis, plagiarism checking, content optimization, and related content-integrity workflows.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border shadow-card h-full">
              <CardContent className="p-6 md:p-8">
                <Badge className="bg-primary/10 text-primary border-primary/20 mb-4">Products</Badge>
                <h2 className="text-2xl font-bold text-navy mb-4 text-balance">Product areas</h2>
                <ul className="space-y-3">
                  {products.map((product) => (
                    <li key={product} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                      <span>{product}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/30 border-y border-border">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="text-center mb-10">
            <Badge className="bg-primary/10 text-primary border-primary/20 mb-4">Coverage</Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-navy mb-3 text-balance">Verified Press Coverage</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-pretty">
              Press coverage will be added here as independently published articles become available and can be linked to their original sources.
            </p>
          </div>
          <Card className="border-border shadow-card max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Newspaper className="w-6 h-6 text-primary" />
              </div>
              <p className="font-medium text-navy mb-2">No verified coverage listed yet</p>
              <p className="text-sm text-muted-foreground leading-relaxed text-pretty">
                Only genuine third-party coverage with a verifiable source link will be listed on this page.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="text-center mb-10">
            <Badge className="bg-primary/10 text-primary border-primary/20 mb-4">Media Resources</Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-navy mb-3 text-balance">Resources for coverage</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-pretty">
              Media materials should reflect the current product and verified company information.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {mediaResources.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} className="border-border shadow-card h-full">
                  <CardContent className="p-6">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-navy mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed text-pretty">{item.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 bg-navy text-white">
        <div className="max-w-3xl mx-auto px-4 md:px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-balance">Press inquiries</h2>
          <p className="text-white/65 text-pretty">
            For interviews, product information, or media resources, please use AIDetector.cx's published contact channels. A dedicated press address will be listed here once it is confirmed for public use.
          </p>
        </div>
      </section>
    </MainLayout>
  );
}
