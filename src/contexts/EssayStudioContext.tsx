// Essay Studio context — provides the active essay and actions to all child pages.
import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { essayService } from '@/lib/essay/essayService';
import type { Essay, EssayOutlineSection, EssayPhase } from '@/types/essay';

interface EssayStudioContextType {
  essay: Essay | null;
  setEssay: (e: Essay | null) => void;
  outlineSections: EssayOutlineSection[];
  setOutlineSections: (s: EssayOutlineSection[]) => void;
  content: string;
  setContent: (c: string) => void;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  saveNow: () => Promise<void>;
  goToPhase: (phase: EssayPhase) => void;
  refreshEssay: () => Promise<void>;
}

const EssayStudioContext = createContext<EssayStudioContextType | undefined>(undefined);

export function useEssayStudio() {
  const ctx = useContext(EssayStudioContext);
  if (!ctx) throw new Error('useEssayStudio must be used inside EssayStudioProvider');
  return ctx;
}

interface Props {
  essayId: string;
  onPhaseChange: (phase: EssayPhase) => void;
  children: ReactNode;
}

export function EssayStudioProvider({ essayId, onPhaseChange, children }: Props) {
  const [essay, setEssay] = useState<Essay | null>(null);
  const [outlineSections, setOutlineSections] = useState<EssayOutlineSection[]>([]);
  const [content, setContent] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const contentRef = useRef(content);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionStartRef = useRef<Date>(new Date());

  contentRef.current = content;

  const refreshEssay = useCallback(async () => {
    try {
      const e = await essayService.getEssay(essayId);
      if (e) {
        setEssay(e);
        setContent(e.content || '');
      }
    } catch (err) {
      console.error('Failed to load essay:', err);
    }
  }, [essayId]);

  useEffect(() => {
    refreshEssay();
    essayService.listOutlineSections(essayId).then(setOutlineSections).catch(console.error);
    // Log session start
    sessionStartRef.current = new Date();
    essayService.logEvent(essayId, 'writing_session_start', 'Writing session started', {}, 0);
    return () => {
      // Log session end on unmount
      essayService.logEvent(essayId, 'writing_session_end', 'Writing session ended', {
        duration_ms: Date.now() - sessionStartRef.current.getTime(),
      }, 0);
    };
  }, [essayId, refreshEssay]);

  const saveNow = useCallback(async () => {
    if (!essay) return;
    setSaveStatus('saving');
    try {
      await essayService.updateContent(essay.id, contentRef.current);
      await essayService.saveVersion(essay.id, contentRef.current);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, [essay]);

  // Autosave: 3s debounce after content change
  useEffect(() => {
    if (!essay) return;
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      saveNow();
    }, 3000);
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [content, essay, saveNow]);

  // Periodic autosave every 30s
  useEffect(() => {
    const interval = setInterval(() => { saveNow(); }, 30000);
    return () => clearInterval(interval);
  }, [saveNow]);

  const goToPhase = useCallback((phase: EssayPhase) => {
    if (essay) essayService.updatePhase(essay.id, phase).catch(console.error);
    onPhaseChange(phase);
  }, [essay, onPhaseChange]);

  return (
    <EssayStudioContext.Provider value={{
      essay, setEssay, outlineSections, setOutlineSections,
      content, setContent, saveStatus, saveNow, goToPhase, refreshEssay,
    }}>
      {children}
    </EssayStudioContext.Provider>
  );
}
