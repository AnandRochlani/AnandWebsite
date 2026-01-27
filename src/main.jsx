import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';
import '@/static-content.css';
import { initAnalytics } from '@/utils/analytics';
import { preloadCriticalResources } from '@/utils/preload';

// Remove static content from DOM when React loads to prevent duplicate H1 tags and reduce rendering percentage
const removeStaticContent = () => {
  // Hide immediately to prevent visual flash and reduce rendering percentage
  // Include blog content and blog post content in removal
  const staticElements = document.querySelectorAll('#static-header, #static-content, #static-footer, #static-blog-content, #static-blog-post-content');
  staticElements.forEach(el => {
    if (el && el.parentNode) {
      el.style.display = 'none'; // Hide first for instant visual removal
    }
  });
  
  // Remove from DOM after React has started rendering (double RAF for better timing)
  if (typeof requestAnimationFrame !== 'undefined') {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        staticElements.forEach(el => {
          if (el && el.parentNode) {
            el.remove(); // Remove from DOM
          }
        });
      });
    });
  } else {
    // Fallback for older browsers
    setTimeout(() => {
      staticElements.forEach(el => {
        if (el && el.parentNode) {
          el.remove();
        }
      });
    }, 0);
  }
};

// Render React app immediately (highest priority)
try {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
      <App />
    );
  } else {
    // Only log in development
    if (import.meta.env.DEV) {
      console.error('Root element not found');
    }
  }
} catch (error) {
  // Only log in development
  if (import.meta.env.DEV) {
    console.error('Failed to render React app:', error);
  }
}

// Remove static content after React starts rendering (non-blocking)
try {
  removeStaticContent();
} catch (error) {
  // Static content removal errors should not break the site
}

// Defer non-critical operations to avoid blocking initial render
if (typeof requestIdleCallback !== 'undefined') {
  requestIdleCallback(() => {
    // Initialize analytics (non-blocking)
    try {
      initAnalytics();
    } catch (error) {
      // Analytics errors should not break the site
    }

    // Preload critical resources (non-blocking)
    try {
      preloadCriticalResources();
    } catch (error) {
      // Preload errors should not break the site
    }
  }, { timeout: 2000 });
} else {
  // Fallback: use setTimeout for older browsers
  setTimeout(() => {
    try {
      initAnalytics();
    } catch (error) {
      // Analytics errors should not break the site
    }

    try {
      preloadCriticalResources();
    } catch (error) {
      // Preload errors should not break the site
    }
  }, 100);
}