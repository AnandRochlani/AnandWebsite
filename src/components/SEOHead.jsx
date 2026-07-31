import React, { useEffect, useMemo, useContext } from 'react';
import { SiteSettingsContext } from '@/context/SiteSettingsContext';

const SEOHead = ({
  title,
  description,
  image,
  type = 'website',
  canonical,
  keywords,
  // Set on not-found / empty states. The SPA rewrite makes Vercel answer 200 for
  // any unknown path, so without this Google indexes "Post Not Found" as a soft 404.
  noindex = false,
  // Article-specific (optional)
  authorName,
  publishedTime,
  modifiedTime
}) => {
  // Pull DB-backed defaults if the provider is mounted; otherwise fall back
  // to the same hardcoded values that lived here before. Warn (once) in
  // dev so a missing provider doesn't silently regress page metadata.
  const ctx = useContext(SiteSettingsContext);
  if (!ctx && typeof window !== 'undefined' && !window.__SEOHEAD_NO_PROVIDER_WARNED__) {
    window.__SEOHEAD_NO_PROVIDER_WARNED__ = true;
    // eslint-disable-next-line no-console
    console.warn(
      '[SEOHead] SiteSettingsProvider is not mounted; falling back to hardcoded SEO defaults.'
    );
  }
  const get = ctx?.get || ((_k, fb) => fb);

  // Apex domain only: www.anandrochlani.com is not attached in Vercel (connection
  // refused), so canonicals must never point at it.
  const siteUrl = get('seo.site_url', 'https://anandrochlani.com');
  const siteName = get('seo.site_name', 'AnandRochlani');
  const defaultTitle = get('seo.default_title', 'Courses & Tech Blog | AnandRochlani');
  const defaultDescription = get(
    'seo.default_description',
    'Master web development, design, and data science with expert-led courses and tech blog posts. Join thousands learning new skills.'
  );
  const defaultKeywords = get('seo.default_keywords', null);
  const defaultOgImage = get(
    'seo.default_og_image',
    'https://anandrochlani.com/og-image.jpg'
  );
  const logoUrl = get('seo.logo_url', `${siteUrl}/logo.png`);
  const resolvedImage = image || defaultOgImage;
  
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
    ? (title.includes(siteName) ? title : `${title} | ${siteName}`)
    : defaultTitle;
  const fullDescription = description || defaultDescription;
  const fullKeywords = keywords || defaultKeywords;
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
          "image": resolvedImage,
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
            "name": siteName,
            "logo": {
              "@type": "ImageObject",
              "url": logoUrl
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
            "name": siteName,
            "logo": {
              "@type": "ImageObject",
              "url": logoUrl
            }
          }
        };

    return JSON.stringify(schema);
  }, [authorName, fullDescription, fullTitle, fullUrl, isArticle, logoUrl, modifiedTime, publishedTime, resolvedImage, siteName]);

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
    ensureMeta({
      name: 'robots',
      content: noindex
        ? 'noindex, follow'
        : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    });
    if (fullKeywords) ensureMeta({ name: 'keywords', content: fullKeywords });

    // Canonical
    ensureLink({ rel: 'canonical', href: fullUrl });

    // Open Graph
    ensureMeta({ property: 'og:type', content: type });
    ensureMeta({ property: 'og:url', content: fullUrl });
    ensureMeta({ property: 'og:title', content: fullTitle });
    ensureMeta({ property: 'og:description', content: fullDescription });
    ensureMeta({ property: 'og:image', content: resolvedImage });
    ensureMeta({ property: 'og:site_name', content: siteName });
    ensureMeta({ property: 'og:locale', content: 'en_US' });

    // Twitter
    ensureMeta({ name: 'twitter:card', content: 'summary_large_image' });
    ensureMeta({ name: 'twitter:url', content: fullUrl });
    ensureMeta({ name: 'twitter:title', content: fullTitle });
    ensureMeta({ name: 'twitter:description', content: fullDescription });
    ensureMeta({ name: 'twitter:image', content: resolvedImage });

    // Structured data. Prerendered pages (seo-pipeline/prerender.mjs) already ship a
    // richer, route-specific JSON-LD graph — BlogPosting plus BreadcrumbList — so only
    // inject this thinner client-side fallback when no prerendered block is present.
    const prerenderedLd = document.head.querySelector(
      'script[type="application/ld+json"][id^="ld-prerender-"]'
    );
    if (!prerenderedLd) {
      ensureJsonLd({ id: 'seohead-jsonld', json: schemaJson });
    }
  }, [fullDescription, fullTitle, fullUrl, fullKeywords, noindex, resolvedImage, schemaJson, siteName, type]);

  return null;
};

export default SEOHead;
