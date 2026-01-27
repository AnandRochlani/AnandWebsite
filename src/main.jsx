import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';
import '@/static-content.css';
import { initAnalytics } from '@/utils/analytics';
import { preloadCriticalResources } from '@/utils/preload';

// Remove static content from DOM when React loads to prevent duplicate H1 tags and reduce rendering percentage
const removeStaticContent = () => {
  // Remove immediately to prevent any rendering conflicts
  // Use requestAnimationFrame to ensure DOM is ready
  if (typeof requestAnimationFrame !== 'undefined') {
    requestAnimationFrame(() => {
      const staticElements = document.querySelectorAll('#static-header, #static-content, #static-footer');
      staticElements.forEach(el => {
        if (el && el.parentNode) {
          el.style.display = 'none'; // Hide first for instant visual removal
          setTimeout(() => {
            if (el.parentNode) el.remove(); // Then remove from DOM
          }, 0);
        }
      });
    });
  } else {
    // Fallback for older browsers
    const staticElements = document.querySelectorAll('#static-header, #static-content, #static-footer');
    staticElements.forEach(el => {
      if (el && el.parentNode) {
        el.style.display = 'none';
        setTimeout(() => {
          if (el.parentNode) el.remove();
        }, 0);
      }
    });
  }
};

// Initialize analytics (with error handling)
try {
  initAnalytics();
} catch (error) {
  // Analytics errors should not break the site
}

// Preload critical resources (with error handling)
try {
  preloadCriticalResources();
} catch (error) {
  // Preload errors should not break the site
}

// Remove static content before React renders to prevent duplicate H1 tags
try {
  removeStaticContent();
} catch (error) {
  // Static content removal errors should not break the site
}

// Render React app with error boundary
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