// Google Analytics and other analytics tracking
// Replace GA_MEASUREMENT_ID with your actual Google Analytics ID

export const initAnalytics = () => {
  try {
    // Google Analytics 4
    const GA_MEASUREMENT_ID = 'G-XXXXXXXXXX'; // Replace with your GA4 ID
    
    // Only initialize if we have a valid ID (not placeholder)
    if (typeof window !== 'undefined' && GA_MEASUREMENT_ID && GA_MEASUREMENT_ID !== 'G-XXXXXXXXXX') {
      // Load Google Analytics script
      const script1 = document.createElement('script');
      script1.async = true;
      script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
      script1.onerror = () => {
        // Silently fail if GA script fails to load
      };
      document.head.appendChild(script1);

      const script2 = document.createElement('script');
      script2.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${GA_MEASUREMENT_ID}');
      `;
      document.head.appendChild(script2);
    }
  } catch (error) {
    // Silently fail - analytics should not break the site
  }
};

// Track page views
export const trackPageView = (url) => {
  try {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', 'G-XXXXXXXXXX', {
        page_path: url,
      });
    }
  } catch (error) {
    // Silently fail - analytics should not break the site
  }
};

// Track events
export const trackEvent = (eventName, eventParams = {}) => {
  try {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, eventParams);
    }
  } catch (error) {
    // Silently fail - analytics should not break the site
  }
};

// Facebook Pixel (optional)
export const initFacebookPixel = () => {
  try {
    const FACEBOOK_PIXEL_ID = 'YOUR_PIXEL_ID'; // Replace with your Pixel ID
    
    // Only initialize if we have a valid ID (not placeholder)
    if (typeof window !== 'undefined' && FACEBOOK_PIXEL_ID && FACEBOOK_PIXEL_ID !== 'YOUR_PIXEL_ID') {
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      
      if (window.fbq) {
        window.fbq('init', FACEBOOK_PIXEL_ID);
        window.fbq('track', 'PageView');
      }
    }
  } catch (error) {
    // Silently fail - analytics should not break the site
  }
};
