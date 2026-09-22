import { getVisitorId } from '../visitorId';
import { getCurrentSessionId } from './visitorTracking';
import { JourneyEvent, JourneyEventType } from '@/types/customerIntelligence';
import { trackCDPEvent } from '../cdpApi';

export const LOCAL_JOURNEY_KEY = 'aicx_journey_events';

let memoryJourneyEvents: JourneyEvent[] = [];

export function recordJourneyEvent(
  eventType: JourneyEventType,
  details: {
    page?: string;
    toolName?: string;
    planName?: string;
    userId?: string | null;
    metadata?: Record<string, unknown>;
  } = {}
): JourneyEvent {
  const visitorId = getVisitorId();
  const sessionId = getCurrentSessionId();
  const event: JourneyEvent = {
    id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    visitorId,
    userId: details.userId || null,
    sessionId,
    eventType,
    page: details.page || (typeof window !== 'undefined' && window.location ? window.location.pathname : '/'),
    toolName: details.toolName,
    planName: details.planName,
    metadata: details.metadata || {},
    timestamp: new Date().toISOString(),
  };

  memoryJourneyEvents.unshift(event);
  if (memoryJourneyEvents.length > 300) {
    memoryJourneyEvents = memoryJourneyEvents.slice(0, 300);
  }

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem(LOCAL_JOURNEY_KEY);
      const list: JourneyEvent[] = stored ? JSON.parse(stored) : [];
      list.unshift(event);
      // Keep last 300 client events
      window.localStorage.setItem(LOCAL_JOURNEY_KEY, JSON.stringify(list.slice(0, 300)));
    }
  } catch {
    /* noop */
  }

  // Also bridge into existing CDP backend events where appropriate
  try {
    void trackCDPEvent({
      event_type: eventType as any,
      page: event.page,
      metadata: {
        tool: event.toolName,
        plan: event.planName,
        ...details.metadata,
      },
    });
  } catch {
    /* noop */
  }

  return event;
}

export function getLocalJourneyEvents(visitorId?: string): JourneyEvent[] {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem(LOCAL_JOURNEY_KEY);
      if (stored) {
        const list: JourneyEvent[] = JSON.parse(stored);
        if (visitorId) {
          return list.filter(e => e.visitorId === visitorId);
        }
        return list;
      }
    }
  } catch {
    /* noop */
  }
  if (visitorId) {
    return memoryJourneyEvents.filter(e => e.visitorId === visitorId);
  }
  return memoryJourneyEvents;
}
