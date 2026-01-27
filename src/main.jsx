import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';
import { initAnalytics } from '@/utils/analytics';
import { preloadCriticalResources } from '@/utils/preload';

// Hide static content immediately when React loads
const hideStaticContent = () => {
  const staticElements = document.querySelectorAll('#static-header, #static-content, #static-footer');
  staticElements.forEach(el => {
    if (el) el.style.display = 'none';
  });
};

// Initialize analytics
initAnalytics();

// Preload critical resources
preloadCriticalResources();

// Hide static content before React renders
hideStaticContent();

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
);