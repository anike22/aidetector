import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

// Workspaces and user-specific records are accessible application routes, not search inventory.
const privateRoute = /^\/(admin|dashboard|account|settings|auth|login|signup|register|reset-password|payment-success|payment-cancel|essay-studio|essay-template|content-studio|document-workspace|seo-dashboard|seo-projects|seo-agent|prospecting|organizations|workspaces|reports|notifications|activity|classrooms|referrals|affiliates|partner|rewards|webhooks)(\/|$)|^\/humanizer\/(history|processing|alternatives|result)(\/|$)|^\/api\/dashboard(\/|$)|^\/authorship\/(dashboard|profile|records)(\/|$)|^\/verified-authorship\/(register|profile|[^/]+\/(manage|certificate))(\/|$)/;
export default function RouteIndexing() {
  const { pathname } = useLocation();
  return privateRoute.test(pathname) ? (
    <Helmet><meta name="robots" content="noindex, follow" /></Helmet>
  ) : null;
}
