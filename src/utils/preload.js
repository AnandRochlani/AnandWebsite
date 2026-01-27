// Preload critical resources for faster initial render
export const preloadCriticalResources = () => {
  if (typeof window === 'undefined') return;

  // Preload critical images
  const criticalImages = [
    'https://images.unsplash.com/photo-1504983875-d3b163aba9e6', // Hero image
  ];

  criticalImages.forEach(src => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
  });

  // Prefetch routes
  const routesToPrefetch = ['/courses', '/blog'];
  routesToPrefetch.forEach(route => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = route;
    document.head.appendChild(link);
  });
};
