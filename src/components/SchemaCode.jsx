import React from 'react';
import { Helmet } from 'react-helmet';

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
  // Get schema values from localStorage (backend editable)
  const getSchemaValue = (key, defaultValue) => {
    try {
      const schemaData = localStorage.getItem('schemaData');
      if (schemaData) {
        const data = JSON.parse(schemaData);
        return data[key] !== undefined ? data[key] : defaultValue;
      }
    } catch (e) {
      // Ignore errors
    }
    return defaultValue;
  };

  const finalRatingValue = getSchemaValue('ratingValue', ratingValue);
  const finalBestRating = getSchemaValue('bestRating', bestRating);
  const finalWorstRating = getSchemaValue('worstRating', worstRating);
  const finalRatingCount = getSchemaValue('ratingCount', ratingCount);
  const finalReviewCount = getSchemaValue('reviewCount', reviewCount);

  const getSchema = () => {
    const baseSchema = {
      "@context": "https://schema.org",
      "@type": type,
      "name": name,
      "description": description,
      "url": url,
      "image": image
    };

    // Add aggregate rating if rating data is available
    if (finalRatingValue && finalRatingCount) {
      baseSchema.aggregateRating = {
        "@type": "AggregateRating",
        "ratingValue": parseFloat(finalRatingValue),
        "bestRating": parseFloat(finalBestRating),
        "worstRating": parseFloat(finalWorstRating),
        "ratingCount": parseInt(finalRatingCount),
        "reviewCount": parseInt(finalReviewCount)
      };
    }

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

    return baseSchema;
  };

  const schema = getSchema();

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema, null, 2)}
      </script>
    </Helmet>
  );
};

export default SchemaCode;
