import React, { useEffect, useMemo } from 'react';

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
  const siteUrl = 'https://www.anandrochlani.com';
  
  // Build canonical URL - always match the current page to prevent SEO errors
  // Normalize pathname: remove trailing slash except for root
  let pathname = '/';
  try {
    if (typeof window !== 'undefined' && window.location && window.location.pathname) {
      pathname = window.location.pathname;
    }
  } catch (e) {
    // ignore
  }
  if (pathname !== '/' && pathname.endsWith('/')) {
    pathname = pathname.slice(0, -1);
  }
  const currentUrl = `${siteUrl}${pathname || '/'}`;
  
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
    // No canonical provided - use current page URL when available
    fullUrl = currentUrl || siteUrl;
  }
  // Only append brand name if title doesn't already contain it
  const fullTitle = title 
    ? (title.includes('AnandRochlani') ? title : `${title} | AnandRochlani`)
    : 'Courses & Tech Blog | AnandRochlani';
  const fullDescription = description || 'Master web development, design, and data science with expert-led courses and tech blog posts. Join thousands learning new skills.';
  const isArticle = type === 'article';

  const schemaJson = useMemo(() => {
    const schema = isArticle
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
        };

    return JSON.stringify(schema);
  }, [authorName, fullDescription, fullTitle, fullUrl, image, isArticle, modifiedTime, publishedTime]);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const ensureMeta = ({ name, property, content }) => {
      const selector = name
        ? `meta[name="${CSS.escape(name)}"]`
        : `meta[property="${CSS.escape(property)}"]`;

      let el = document.head.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        if (name) el.setAttribute('name', name);
        if (property) el.setAttribute('property', property);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    const ensureLink = ({ rel, href }) => {
      let el = document.head.querySelector(`link[rel="${CSS.escape(rel)}"]`);
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        document.head.appendChild(el);
      }
      el.setAttribute('href', href);
    };

    const ensureJsonLd = ({ id, json }) => {
      let el = document.getElementById(id);
      if (!el) {
        el = document.createElement('script');
        el.id = id;
        el.type = 'application/ld+json';
        document.head.appendChild(el);
      }
      el.textContent = json;
    };

    // Primary
    document.title = fullTitle;
    ensureMeta({ name: 'title', content: fullTitle });
    ensureMeta({ name: 'description', content: fullDescription });
    ensureMeta({ name: 'robots', content: 'index, follow' });
    if (keywords) ensureMeta({ name: 'keywords', content: keywords });

    // Canonical
    ensureLink({ rel: 'canonical', href: fullUrl });

    // Open Graph
    ensureMeta({ property: 'og:type', content: type });
    ensureMeta({ property: 'og:url', content: fullUrl });
    ensureMeta({ property: 'og:title', content: fullTitle });
    ensureMeta({ property: 'og:description', content: fullDescription });
    ensureMeta({ property: 'og:image', content: image });
    ensureMeta({ property: 'og:site_name', content: 'AnandRochlani' });
    ensureMeta({ property: 'og:locale', content: 'en_US' });

    // Twitter
    ensureMeta({ name: 'twitter:card', content: 'summary_large_image' });
    ensureMeta({ name: 'twitter:url', content: fullUrl });
    ensureMeta({ name: 'twitter:title', content: fullTitle });
    ensureMeta({ name: 'twitter:description', content: fullDescription });
    ensureMeta({ name: 'twitter:image', content: image });

    // Structured data
    ensureJsonLd({ id: 'seohead-jsonld', json: schemaJson });
  }, [fullDescription, fullTitle, fullUrl, image, keywords, schemaJson, type]);

  return null;
};

export default SEOHead;
