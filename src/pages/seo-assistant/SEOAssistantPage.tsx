import MainLayout from '@/components/layouts/MainLayout';
import { SEOAssistantWorkspace } from '@/components/seo-assistant/SEOAssistantWorkspace';

export default function SEOAssistantPage() {
  return (
    <MainLayout showFooter={false}>
      <SEOAssistantWorkspace
        enableBloggerOptimization={true}
        showHeaderControls={true}
      />
    </MainLayout>
  );
}
