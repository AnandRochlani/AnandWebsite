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
      // Prefetch key routes (keep lightweight to avoid redirects with slugs)
      let blogPostRoutes = ['/courses', '/blog'];
      
      // Try to get blog posts from localStorage (includes custom posts)
      try {
        const localPosts = localStorage.getItem('customBlogPosts');
        let slugs = [];
        if (localPosts) {
          try {
            const customPosts = JSON.parse(localPosts);
            slugs = customPosts
              .map(p => p.slug || p.title || p.id)
              .filter(Boolean)
              .slice(0, 3)
              .map(v => String(v)
                .toLowerCase()
                .trim()
                .replace(/[’']/g, '')
                .replace(/[–—]/g, '-')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '')
                .replace(/-+/g, '-')
              );
          } catch (e) {
            // If parsing fails, use default posts only
          }
        }
        
        // Prefetch a few custom post slugs if available
        if (slugs.length > 0) {
          blogPostRoutes = [...blogPostRoutes, ...slugs.map(s => `/blog/${s}`)];
        }
      } catch (e) {
        // If localStorage access fails, just prefetch blog list
      }
      
      blogPostRoutes.forEach(route => {
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
