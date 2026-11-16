import { useEffect } from 'react';
import StandaloneEmbedDetector from './StandaloneEmbedDetector';

export default function EmbedWidgetPage() {
  useEffect(() => {
    document.documentElement.classList.add('aidetector-embed-document');
    document.body.classList.add('aidetector-embed-body');
    document.body.style.background = '#ffffff';
    return () => {
      document.documentElement.classList.remove('aidetector-embed-document');
      document.body.classList.remove('aidetector-embed-body');
      document.body.style.background = '';
    };
  }, []);

  return (
    <div className="min-h-screen w-full bg-white">
      <StandaloneEmbedDetector />
    </div>
  );
}
