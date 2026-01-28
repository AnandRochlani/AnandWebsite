import React from 'react';
import { Helmet } from 'react-helmet';
import { useLocation } from 'react-router-dom';

const SEOHead = ({ 
  title, 
  description, 
  image = 'https://www.anandrochlani.com/og-image.jpg',
  type = 'website',
  canonical,
  keywords
}) => {
  const location = useLocation();
  const siteUrl = 'https://www.ritvikwebsite.com';
  
  // Build canonical URL - always match the current page to prevent SEO errors
  // Normalize pathname: remove trailing slash except for root
  let pathname = location.pathname;
  if (pathname !== '/' && pathname.endsWith('/')) {
    pathname = pathname.slice(0, -1);
  }
  const currentUrl = `${siteUrl}${pathname}`;
  
  // Use canonical if provided, but ensure it matches current page
  // If canonical points to a different page, use current URL instead
  // This prevents "canonical points to different page" SEO errors
  let fullUrl;
  if (canonical) {
    // Normalize provided canonical for comparison
    const normalizedCanonical = canonical.replace(/\/$/, '') || canonical;
    const normalizedCurrent = currentUrl.replace(/\/$/, '') || currentUrl;
    
    // If canonical matches current page (allowing for trailing slash differences), use it
    // Otherwise, use current URL to prevent SEO errors
    if (normalizedCanonical === normalizedCurrent || canonical === currentUrl) {
      fullUrl = canonical;
    } else {
      // Canonical points to different page - use current URL to fix SEO error
      fullUrl = currentUrl;
    }
  } else {
    // No canonical provided - use current page URL
    fullUrl = currentUrl;
  }
  // Only append brand name if title doesn't already contain it
  const fullTitle = title 
    ? (title.includes('RitvikWebsite') ? title : `${title} | RitvikWebsite`)
    : 'Professional Services & Solutions | RitvikWebsite';
  const fullDescription = description || 'Master web development, design, and data science with expert-led courses and tech blog posts. Join thousands learning new skills.';

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={fullDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content="index, follow" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={fullUrl} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={fullDescription} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="RitvikWebsite" />
      <meta property="og:locale" content="en_US" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={fullDescription} />
      <meta name="twitter:image" content={image} />
      
      {/* Schema.org Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": type === 'article' ? 'Article' : 'WebSite',
          "name": fullTitle,
          "description": fullDescription,
          "url": fullUrl,
          "image": image,
          "publisher": {
            "@type": "Organization",
            "name": "RitvikWebsite",
            "logo": {
              "@type": "ImageObject",
              "url": "https://www.ritvikwebsite.com/logo.png"
            }
          }
        })}
      </script>
    </Helmet>
  );
};

export default SEOHead;
