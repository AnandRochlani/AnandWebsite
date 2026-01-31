import React from 'react';
import { Helmet } from 'react-helmet';
import { useLocation } from 'react-router-dom';

const SEOHead = ({ 
  title, 
  description, 
  image = 'https://www.anandrochlani.com/og-image.jpg',
  type = 'website',
  canonical,
  keywords,
  // Article-specific (optional)
  authorName,
  publishedTime,
  modifiedTime
}) => {
  const location = useLocation();
  const siteUrl = 'https://www.anandrochlani.com';
  
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
    ? (title.includes('AnandRochlani') ? title : `${title} | AnandRochlani`)
    : 'Courses & Tech Blog | AnandRochlani';
  const fullDescription = description || 'Master web development, design, and data science with expert-led courses and tech blog posts. Join thousands learning new skills.';
  const isArticle = type === 'article';

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
      <meta property="og:site_name" content="AnandRochlani" />
      <meta property="og:locale" content="en_US" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={fullDescription} />
      <meta name="twitter:image" content={image} />
      
      {/* Schema.org Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(
          isArticle
            ? {
                "@context": "https://schema.org",
                "@type": "Article",
                "mainEntityOfPage": {
                  "@type": "WebPage",
                  "@id": fullUrl
                },
                "headline": fullTitle,
                "description": fullDescription,
                "image": image,
                ...(publishedTime ? { "datePublished": publishedTime } : {}),
                ...(modifiedTime ? { "dateModified": modifiedTime } : {}),
                ...(authorName
                  ? {
                      "author": {
                        "@type": "Person",
                        "name": authorName
                      }
                    }
                  : {}),
                "publisher": {
                  "@type": "Organization",
                  "name": "AnandRochlani",
                  "logo": {
                    "@type": "ImageObject",
                    "url": "https://www.anandrochlani.com/logo.png"
                  }
                }
              }
            : {
                "@context": "https://schema.org",
                "@type": "WebSite",
                "name": fullTitle,
                "description": fullDescription,
                "url": fullUrl,
                "publisher": {
                  "@type": "Organization",
                  "name": "AnandRochlani",
                  "logo": {
                    "@type": "ImageObject",
                    "url": "https://www.anandrochlani.com/logo.png"
                  }
                }
              }
        )}
      </script>
    </Helmet>
  );
};

export default SEOHead;
