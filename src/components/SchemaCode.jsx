import React, { useEffect, useMemo } from 'react';

const SchemaCode = ({ 
  type = 'Service',
  name,
  description,
  url,
  image,
  ratingValue = 4.5,
  bestRating = 5,
  worstRating = 1,
  ratingCount = 100,
  reviewCount = 85,
  price = null,
  priceCurrency = 'USD',
  availability = 'https://schema.org/InStock',
  serviceType = null
}) => {
  const baseSchemaJson = useMemo(() => {
    const baseSchema = {
      "@context": "https://schema.org",
      "@type": type,
      "name": name,
      "description": description,
      "url": url,
      "image": image
    };

    // Add offer if price is available
    if (price) {
      baseSchema.offers = {
        "@type": "Offer",
        "price": price,
        "priceCurrency": priceCurrency,
        "availability": availability
      };
    }

    // Add service type if provided
    if (serviceType) {
      baseSchema.serviceType = serviceType;
    }

    return JSON.stringify(baseSchema);
  }, [availability, description, image, name, price, priceCurrency, serviceType, type, url]);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    // Optional: allow overrides from localStorage
    let finalRatingValue = ratingValue;
    let finalBestRating = bestRating;
    let finalWorstRating = worstRating;
    let finalRatingCount = ratingCount;
    let finalReviewCount = reviewCount;

    try {
      const schemaData = localStorage.getItem('schemaData');
      if (schemaData) {
        const data = JSON.parse(schemaData);
        if (data.ratingValue !== undefined) finalRatingValue = data.ratingValue;
        if (data.bestRating !== undefined) finalBestRating = data.bestRating;
        if (data.worstRating !== undefined) finalWorstRating = data.worstRating;
        if (data.ratingCount !== undefined) finalRatingCount = data.ratingCount;
        if (data.reviewCount !== undefined) finalReviewCount = data.reviewCount;
      }
    } catch (e) {
      // ignore
    }

    let schema;
    try {
      schema = JSON.parse(baseSchemaJson);
    } catch (e) {
      schema = {};
    }

    if (finalRatingValue && finalRatingCount) {
      schema.aggregateRating = {
        "@type": "AggregateRating",
        "ratingValue": parseFloat(finalRatingValue),
        "bestRating": parseFloat(finalBestRating),
        "worstRating": parseFloat(finalWorstRating),
        "ratingCount": parseInt(finalRatingCount),
        "reviewCount": parseInt(finalReviewCount)
      };
    }

    const id = 'schemacode-jsonld';
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement('script');
      el.id = id;
      el.type = 'application/ld+json';
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(schema);
  }, [baseSchemaJson, bestRating, ratingCount, ratingValue, reviewCount, worstRating]);

  return null;
};

export default SchemaCode;
