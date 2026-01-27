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
    try {
      const routesToPrefetch = ['/courses', '/blog'];
      routesToPrefetch.forEach(route => {
        try {
          // Only prefetch if not already in cache
          // Check if sessionStorage is available (may not be in private browsing)
          if (typeof sessionStorage !== 'undefined' && !sessionStorage.getItem(`prefetched_${route}`)) {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = route;
            link.as = 'document';
            document.head.appendChild(link);
            sessionStorage.setItem(`prefetched_${route}`, 'true');
          } else if (typeof sessionStorage === 'undefined') {
            // Fallback: prefetch without sessionStorage check
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = route;
            link.as = 'document';
            document.head.appendChild(link);
          }
        } catch (e) {
          // Silently fail for individual routes
        }
      });
    } catch (error) {
      // Silently fail - prefetching should not break the site
    }
  });
};
