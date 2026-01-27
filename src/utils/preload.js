// Preload critical resources for faster initial render
export const preloadCriticalResources = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  // Use requestIdleCallback for non-critical prefetching
  const schedulePrefetch = (callback) => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(callback, { timeout: 2000 });
    } else {
      setTimeout(callback, 100);
    }
  };

  // Prefetch routes on idle (non-blocking)
  schedulePrefetch(() => {
    const routesToPrefetch = ['/courses', '/blog'];
    routesToPrefetch.forEach(route => {
      // Only prefetch if not already in cache
      if (!sessionStorage.getItem(`prefetched_${route}`)) {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = route;
        link.as = 'document';
        document.head.appendChild(link);
        sessionStorage.setItem(`prefetched_${route}`, 'true');
      }
    });
  });
};
