import React from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '@/components/SEOHead';
import { Button } from '@/components/ui/button';

/**
 * Catch-all for unmatched routes.
 *
 * Vercel's SPA rewrite answers HTTP 200 for every unknown path, so without an
 * explicit noindex Google treats these as soft 404s and can index them. The
 * `noindex, follow` keeps them out of the index while still letting crawlers
 * follow the links back into the real content.
 */
const NotFoundPage = () => (
  <div className="min-h-screen bg-white pt-24 flex items-center justify-center">
    <SEOHead
      title="Page Not Found"
      description="This page does not exist. Browse the System Design Tutorial series or the course catalog instead."
      noindex
    />
    <div className="text-center px-4">
      <p className="text-6xl font-extrabold text-brand mb-4">404</p>
      <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Page Not Found</h1>
      <p className="text-slate-600 mb-8 max-w-md mx-auto">
        The page you are looking for does not exist or has moved.
      </p>
      <div className="flex flex-wrap gap-4 justify-center">
        <Link to="/blog">
          <Button className="bg-brand hover:bg-brand-dark text-white">
            System Design Tutorials
          </Button>
        </Link>
        <Link to="/courses">
          <Button variant="outline">Browse Courses</Button>
        </Link>
      </div>
    </div>
  </div>
);

export default NotFoundPage;
