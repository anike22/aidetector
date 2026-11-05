import { useLocation } from 'react-router-dom';
import PageMeta from './PageMeta';

const essayStudioMetadata: Record<string, { title: string; description: string }> = {
  '/essay-studio': {
    title: 'Essay Studio: Plan, Write & Improve Academic Essays | AIDetector.cx',
    description: 'Plan, outline, write, verify, improve and cite academic essays with AIDetector.cx Essay Studio. Start with structured academic writing templates.',
  },
  '/essay-studio/templates': {
    title: 'Essay Templates: 12 Structured Academic Essay Examples | AIDetector.cx',
    description: 'Browse 12 structured academic essay templates, including argumentative, analytical, research, reflective and scholarship essays. Preview outlines before you start writing.',
  },
};

export default function RouteMeta({ name }: { name: string }) {
  const { pathname } = useLocation();
  const metadata = essayStudioMetadata[pathname];
  return <PageMeta
    title={metadata?.title || `${name} | AIDetector.cx`}
    description={metadata?.description || `${name}. Explore AIDetector.cx tools, guidance and resources for content integrity.`}
    canonicalUrl={`https://www.aidetector.cx${pathname}`}
  />;
}
