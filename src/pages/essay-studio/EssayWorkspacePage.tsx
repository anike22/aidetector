// EssayWorkspacePage — routes to the correct phase sub-component.
// URL: /essay-studio/:essayId/:phase
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { EssayStudioProvider } from '@/contexts/EssayStudioContext';
import { essayService } from '@/lib/essay/essayService';
import type { EssayPhase } from '@/types/essay';
import { PHASE_LABELS } from '@/types/essay';
import EssayNavbar from './components/EssayNavbar';
import EssayPlanPage from './EssayPlanPage';
import EssayOutlinePage from './EssayOutlinePage';
import EssayWritePage from './EssayWritePage';
import EssayVerifyPage from './EssayVerifyPage';
import EssayImprovePage from './EssayImprovePage';
import EssayCitePage from './EssayCitePage';
import EssaySourcesPage from './EssaySourcesPage';
import EssayHistoryPage from './EssayHistoryPage';
import EssaySubmitPage from './EssaySubmitPage';
import { Skeleton } from '@/components/ui/skeleton';

const PHASE_COMPONENTS: Record<EssayPhase, React.ComponentType> = {
  plan: EssayPlanPage,
  outline: EssayOutlinePage,
  write: EssayWritePage,
  verify: EssayVerifyPage,
  improve: EssayImprovePage,
  cite: EssayCitePage,
  sources: EssaySourcesPage,
  history: EssayHistoryPage,
  submit: EssaySubmitPage,
};

export default function EssayWorkspacePage() {
  const { essayId, phase } = useParams<{ essayId: string; phase: string }>();
  const navigate = useNavigate();
  const [essayExists, setEssayExists] = useState<boolean | null>(null);

  const currentPhase = (phase as EssayPhase) || 'plan';
  const PhaseComponent = PHASE_COMPONENTS[currentPhase] || EssayPlanPage;

  useEffect(() => {
    if (!essayId) { navigate('/essay-studio'); return; }
    essayService.getEssay(essayId).then(e => {
      if (!e) { navigate('/essay-studio'); }
      else setEssayExists(true);
    }).catch(() => navigate('/essay-studio'));
  }, [essayId, navigate]);

  if (essayExists === null) {
    return (
      <div className="flex min-h-screen flex-col">
        <Skeleton className="h-14 w-full" />
        <div className="flex-1 p-6"><Skeleton className="h-64 w-full rounded-xl" /></div>
      </div>
    );
  }

  const handlePhaseChange = (p: EssayPhase) => {
    navigate(`/essay-studio/${essayId}/${p}`);
  };

  return (
    <EssayStudioProvider essayId={essayId!} onPhaseChange={handlePhaseChange}>
      <div className="flex flex-col min-h-screen bg-background">
        <EssayNavbar
          essayId={essayId!}
          currentPhase={currentPhase}
          onPhaseChange={handlePhaseChange}
        />
        <main className="flex-1 min-w-0">
          <PhaseComponent />
        </main>
      </div>
    </EssayStudioProvider>
  );
}
