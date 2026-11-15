import { useEffect } from 'react';
import AITextDetector from './detector/AITextDetector';

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
    <main className="mx-auto min-h-screen w-full max-w-[800px] bg-white px-3 py-3 text-slate-900 sm:px-4">
      <div className="aidetector-embed-widget">
        <AITextDetector />
      </div>
      <footer className="border-t border-slate-100 pt-3 text-center text-[11px] leading-5 text-slate-500">
        Powered by <a href="https://www.aidetector.cx" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 underline">AIDetector.cx</a>
        {' '}|{' '}
        <a href="https://www.aidetector.cx/chrome-extension" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 underline">Get our Chrome Extension</a>
      </footer>
    </main>
  );
}
