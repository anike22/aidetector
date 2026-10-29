import { Helmet } from 'react-helmet-async';
import { Link, useLocation } from 'react-router-dom';

export default function NotFoundPage() {
  const { pathname } = useLocation();
  return (
    <main className="min-h-[65vh] flex items-center justify-center px-6 py-20">
      <Helmet>
        <title>Page Not Found | AIDetector.cx</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="max-w-lg text-center space-y-5">
        <p className="text-sm font-semibold text-primary">404 — Page not found</p>
        <h1 className="text-3xl font-extrabold text-foreground">We couldn't find that page</h1>
        <p className="text-muted-foreground">The address {pathname} doesn't match a page on AIDetector.cx. Check the link or return home.</p>
        <Link to="/" className="inline-flex rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground">Go to homepage</Link>
      </div>
    </main>
  );
}
