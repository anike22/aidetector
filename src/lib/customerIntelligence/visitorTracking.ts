export { getVisitorId } from '../visitorId';
import { DeviceCategory, TrafficChannel, UTMParams, VisitorSession } from '@/types/customerIntelligence';

export function parseUTMParams(urlStr?: string): UTMParams {
  try {
    const url = new URL(urlStr || (typeof window !== 'undefined' ? window.location.href : 'https://aidetector.cx'));
    return {
      utm_source: url.searchParams.get('utm_source') || undefined,
      utm_medium: url.searchParams.get('utm_medium') || undefined,
      utm_campaign: url.searchParams.get('utm_campaign') || undefined,
      utm_content: url.searchParams.get('utm_content') || undefined,
      utm_term: url.searchParams.get('utm_term') || undefined,
    };
  } catch {
    return {};
  }
}

export function detectDeviceCategory(ua?: string): DeviceCategory {
  const userAgent = ua || (typeof navigator !== 'undefined' ? navigator.userAgent : '');
  if (/iPad|Tablet|Kindle|PlayBook/i.test(userAgent)) return 'tablet';
  if (/Mobi|Android|iPhone|iPod/i.test(userAgent)) return 'mobile';
  return 'desktop';
}

export function detectBrowser(ua?: string): string {
  const userAgent = ua || (typeof navigator !== 'undefined' ? navigator.userAgent : '');
  if (/Edge\//i.test(userAgent) || /Edg\//i.test(userAgent)) return 'Microsoft Edge';
  if (/Chrome\//i.test(userAgent)) return 'Google Chrome';
  if (/Safari\//i.test(userAgent) && /Apple Computer/.test(userAgent)) return 'Apple Safari';
  if (/Firefox\//i.test(userAgent)) return 'Mozilla Firefox';
  if (/Opera|OPR\//i.test(userAgent)) return 'Opera';
  return 'Browser';
}

export function detectOS(ua?: string): string {
  const userAgent = ua || (typeof navigator !== 'undefined' ? navigator.userAgent : '');
  if (/Windows/i.test(userAgent)) return 'Windows';
  if (/Mac OS X|macOS/i.test(userAgent)) return 'macOS';
  if (/Android/i.test(userAgent)) return 'Android';
  if (/iPhone|iPad|iOS/i.test(userAgent)) return 'iOS';
  if (/Linux/i.test(userAgent)) return 'Linux';
  return 'OS';
}

export function detectChannel(referrer: string, utm: UTMParams): TrafficChannel {
  if (utm.utm_medium === 'cpc' || utm.utm_medium === 'ppc' || utm.utm_medium === 'paid' || utm.utm_source?.includes('ad')) {
    return 'paid';
  }
  if (utm.utm_medium === 'email' || utm.utm_source === 'newsletter') {
    return 'email';
  }
  if (utm.utm_medium === 'affiliate') {
    return 'affiliate';
  }
  if (!referrer || referrer.trim() === '') {
    return 'direct';
  }
  try {
    const refHost = new URL(referrer).hostname.toLowerCase();
    if (refHost.includes('google') || refHost.includes('bing') || refHost.includes('duckduckgo') || refHost.includes('yahoo') || refHost.includes('baidu')) {
      return 'organic';
    }
    if (refHost.includes('twitter') || refHost.includes('x.com') || refHost.includes('facebook') || refHost.includes('linkedin') || refHost.includes('reddit') || refHost.includes('instagram') || refHost.includes('threads')) {
      return 'social';
    }
    if (refHost.includes('aidetector.cx') || refHost.includes('localhost')) {
      return 'direct';
    }
    return 'referral';
  } catch {
    return 'other';
  }
}

/**
 * Mask and truncate IP address for authorized admin security and privacy compliance (GDPR/CCPA).
 * e.g., 198.51.100.45 -> 198.51.100.***
 */
export function maskIpAddress(ip?: string): string {
  if (!ip) return '192.0.2.***';
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.${parts[2]}.***`;
  }
  // IPv6
  if (ip.includes(':')) {
    const v6Parts = ip.split(':');
    return `${v6Parts.slice(0, 3).join(':')}::****`;
  }
  return '***.***.***.***';
}

/**
 * Current session ID storage
 */
const SESSION_KEY = 'aicx_current_sid';

export function getCurrentSessionId(): string {
  if (typeof window === 'undefined') return 'sess_default';
  try {
    let sid = window.sessionStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      window.sessionStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  } catch {
    return `sess_${Date.now()}`;
  }
}
