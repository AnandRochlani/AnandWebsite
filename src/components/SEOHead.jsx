import React, { useEffect, useMemo, useContext } from 'react';
import { SiteSettingsContext } from '@/context/SiteSettingsContext';

const truncateAtWord = (value, maxLength) => {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (text.length <= maxLength) return text;
  const slice = text.slice(0, Math.max(1, maxLength - 1));
  const lastSpace = slice.lastIndexOf(' ');
  return `${(lastSpace > maxLength * 0.6 ? slice.slice(0, lastSpace) : slice).trim()}…`;
};

const buildTitle = (title, siteName) => {
  const raw = String(title || '').trim();
  if (raw.includes(siteName)) return truncateAtWord(raw, 60);
  const suffix = ` | ${siteName}`;
  return `${truncateAtWord(raw, 60 - suffix.length)}${suffix}`;
};

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
  const fullTitle = title ? buildTitle(title, siteName) : truncateAtWord(defaultTitle, 60);
  const fullDescription = truncateAtWord(description || defaultDescription, 160);
  const fullKeywords = keywords || defaultKeywords;
  const isArticle = type === 'article';
  const ogType = isArticle ? 'article' : 'website';

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
      : fullUrl === siteUrl || fullUrl === `${siteUrl}/`
        ? {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "@id": `${siteUrl}/#website`,
          "name": siteName,
          "description": fullDescription,
          "url": siteUrl,
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
          "@type": "WebPage",
          "@id": fullUrl,
          "url": fullUrl,
          "name": fullTitle,
          "description": fullDescription,
          "isPartOf": {
            "@type": "WebSite",
            "@id": `${siteUrl}/#website`,
            "name": siteName,
            "url": siteUrl
          },
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
  }, [authorName, fullDescription, fullTitle, fullUrl, isArticle, logoUrl, modifiedTime, publishedTime, resolvedImage, siteName, siteUrl]);

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

    const removeMeta = ({ name, property }) => {
      const selector = name
        ? `meta[name="${CSS.escape(name)}"]`
        : `meta[property="${CSS.escape(property)}"]`;
      document.head.querySelectorAll(selector).forEach((el) => el.remove());
    };

    const removeLink = (rel) => {
      document.head
        .querySelectorAll(`link[rel="${CSS.escape(rel)}"]`)
        .forEach((el) => el.remove());
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
    else removeMeta({ name: 'keywords' });

    // A noindex page should not simultaneously claim to be the canonical version.
    if (noindex) removeLink('canonical');
    else ensureLink({ rel: 'canonical', href: fullUrl });

    // Open Graph
    ensureMeta({ property: 'og:type', content: ogType });
    if (noindex) removeMeta({ property: 'og:url' });
    else ensureMeta({ property: 'og:url', content: fullUrl });
    ensureMeta({ property: 'og:title', content: fullTitle });
    ensureMeta({ property: 'og:description', content: fullDescription });
    ensureMeta({ property: 'og:image', content: resolvedImage });
    ensureMeta({ property: 'og:site_name', content: siteName });
    ensureMeta({ property: 'og:locale', content: 'en_US' });

    // Twitter
    ensureMeta({ name: 'twitter:card', content: 'summary_large_image' });
    if (noindex) removeMeta({ name: 'twitter:url' });
    else ensureMeta({ name: 'twitter:url', content: fullUrl });
    ensureMeta({ name: 'twitter:title', content: fullTitle });
    ensureMeta({ name: 'twitter:description', content: fullDescription });
    ensureMeta({ name: 'twitter:image', content: resolvedImage });

    if (isArticle) {
      if (publishedTime) ensureMeta({ property: 'article:published_time', content: publishedTime });
      else removeMeta({ property: 'article:published_time' });
      if (modifiedTime) ensureMeta({ property: 'article:modified_time', content: modifiedTime });
      else removeMeta({ property: 'article:modified_time' });
      if (authorName) ensureMeta({ property: 'article:author', content: authorName });
      else removeMeta({ property: 'article:author' });
    } else {
      removeMeta({ property: 'article:published_time' });
      removeMeta({ property: 'article:modified_time' });
      removeMeta({ property: 'article:author' });
    }

    // Keep rich prerendered JSON-LD on the route it belongs to, but remove it
    // after client-side navigation so stale Home/Article schema cannot leak into
    // the next page. The client fallback is then injected for the new route.
    const prerenderedBlocks = Array.from(
      document.head.querySelectorAll('script[type="application/ld+json"][id^="ld-prerender-"]')
    );
    const matchingPrerender = prerenderedBlocks.filter(
      (el) => el.getAttribute('data-page-url') === fullUrl
    );
    prerenderedBlocks
      .filter((el) => !matchingPrerender.includes(el))
      .forEach((el) => el.remove());

    if (noindex) {
      document.getElementById('seohead-jsonld')?.remove();
    } else if (!matchingPrerender.length) {
      ensureJsonLd({ id: 'seohead-jsonld', json: schemaJson });
    } else {
      document.getElementById('seohead-jsonld')?.remove();
    }
  }, [authorName, fullDescription, fullTitle, fullUrl, fullKeywords, isArticle, modifiedTime, noindex, ogType, publishedTime, resolvedImage, schemaJson, siteName]);

  return null;
};

export default SEOHead;
