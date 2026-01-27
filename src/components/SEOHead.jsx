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
  const siteUrl = 'https://www.anandrochlani.com';
  const fullUrl = canonical || `${siteUrl}${location.pathname}`;
  const fullTitle = title ? `${title} | AnandRochlani` : 'Expert Online Courses & Tech Blog | AnandRochlani';
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
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": type === 'article' ? 'Article' : 'WebSite',
          "name": fullTitle,
          "description": fullDescription,
          "url": fullUrl,
          "image": image,
          "publisher": {
            "@type": "Organization",
            "name": "AnandRochlani",
            "logo": {
              "@type": "ImageObject",
              "url": "https://www.anandrochlani.com/logo.png"
            }
          }
        })}
      </script>
    </Helmet>
  );
};

export default SEOHead;
