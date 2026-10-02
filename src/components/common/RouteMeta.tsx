import { useLocation } from 'react-router-dom';
import PageMeta from './PageMeta';

export default function RouteMeta({ name }: { name: string }) {
  const { pathname } = useLocation();
  return <PageMeta
    title={`${name} | AIDetector.cx`}
    description={`${name}. Explore AIDetector.cx tools, guidance and resources for content integrity.`}
    canonicalUrl={`https://www.aidetector.cx${pathname}`}
  />;
}
