import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

// Public Essay Studio landing and template pages are crawlable. Individual essays,
// teacher workspaces, submissions and archived records remain outside the index.
const privateRoute = /^\/(admin|dashboard|account|settings|auth|login|signup|register|reset-password|payment-success|payment-cancel|content-studio|document-workspace|seo-dashboard|seo-projects|seo-agent|prospecting|organizations|workspaces|reports|notifications|activity|classrooms|referrals|affiliates|partner|rewards|webhooks)(\/|$)|^\/humanizer\/(history|processing|alternatives|result)(\/|$)|^\/api\/dashboard(\/|$)|^\/authorship\/(dashboard|profile|records)(\/|$)|^\/verified-authorship\/(register|profile|[^/]+\/(manage|certificate))(\/|$)/;
const privateEssayRoute = /^\/essay-studio\/(?!templates(?:\/|$)).+/;

export default function RouteIndexing() {
  const { pathname } = useLocation();
  return privateRoute.test(pathname) || privateEssayRoute.test(pathname) ? (
    <Helmet><meta name="robots" content="noindex, follow" /></Helmet>
  ) : null;
}
