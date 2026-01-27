import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';
import { initAnalytics } from '@/utils/analytics';
import { preloadCriticalResources } from '@/utils/preload';

// Remove static content from DOM when React loads to prevent duplicate H1 tags and reduce rendering percentage
const removeStaticContent = () => {
  // Remove immediately to prevent any rendering conflicts
  const staticElements = document.querySelectorAll('#static-header, #static-content, #static-footer');
  staticElements.forEach(el => {
    if (el) {
      el.style.display = 'none'; // Hide first for instant visual removal
      setTimeout(() => el.remove(), 0); // Then remove from DOM
    }
  });
};

// Initialize analytics
initAnalytics();

// Preload critical resources
preloadCriticalResources();

// Remove static content before React renders to prevent duplicate H1 tags
removeStaticContent();

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
);