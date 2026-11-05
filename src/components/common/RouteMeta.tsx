import { useLocation } from 'react-router-dom';
import PageMeta from './PageMeta';

const routeMetadata: Record<string, { title: string; description: string; schemas?: Record<string, unknown>[] }> = {
  '/essay-studio': {
    title: 'Essay Studio: Plan, Write & Improve Academic Essays | AIDetector.cx',
    description: 'Plan, outline, write, verify, improve and cite academic essays with AIDetector.cx Essay Studio. Start with structured academic writing templates.',
  },
  '/essay-studio/templates': {
    title: 'Essay Templates: 12 Structured Academic Essay Examples | AIDetector.cx',
    description: 'Browse 12 structured academic essay templates, including argumentative, analytical, research, reflective and scholarship essays. Preview outlines before you start writing.',
  },
  '/reports/shared': {
    title: 'Shared AI Detection Reports & Team Collaboration | AIDetector.cx',
    description: 'Organize AI detection, humanization, and plagiarism reports in a team workspace. Discuss findings with comments and manage report approvals in AIDetector.cx.',
    schemas: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Shared AI Detection Reports & Team Collaboration',
        description: 'A workspace feature for organizing AI detection, humanization, and plagiarism reports, discussing findings, and managing approvals.',
        url: 'https://www.aidetector.cx/reports/shared',
        isPartOf: { '@type': 'WebSite', name: 'AIDetector.cx', url: 'https://www.aidetector.cx/' },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.aidetector.cx/' },
          { '@type': 'ListItem', position: 2, name: 'Shared Reports', item: 'https://www.aidetector.cx/reports/shared' },
        ],
      },
    ],
  },
};

export default function RouteMeta({ name }: { name: string }) {
  const { pathname } = useLocation();
  const metadata = routeMetadata[pathname];
  return <PageMeta
    title={metadata?.title || `${name} | AIDetector.cx`}
    description={metadata?.description || `${name}. Explore AIDetector.cx tools, guidance and resources for content integrity.`}
    canonicalUrl={`https://www.aidetector.cx${pathname}`}
    schemas={metadata?.schemas || []}
  />;
}
