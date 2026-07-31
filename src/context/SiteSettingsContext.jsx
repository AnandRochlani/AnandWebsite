import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { fetchSiteSettings } from '@/data/dbApi';
import { getDefaultSettingsMap } from '@/data/siteSettings';

// Export the raw context too so consumers (e.g. SEOHead) can opt out of the
// throw-if-missing behavior of useSiteSettings.
export const SiteSettingsContext = createContext(null);

const LS_KEY = 'siteSettings.lastGood.v1';

// Memoize the bundled defaults so we're not rebuilding the same object on
// every render / refresh.
const STATIC_DEFAULTS = getDefaultSettingsMap();

function readLastGoodFromStorage() {
  try {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (_) {
    return null;
  }
}

function writeLastGoodToStorage(map) {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(LS_KEY, JSON.stringify(map));
  } catch (_) {
    // Quota / privacy mode — best effort.
  }
}

/**
 * Hook to read site-wide settings sourced from the `site_settings` DB table.
 *
 *   const { get, isLoading } = useSiteSettings();
 *   const heroTitle = get('home.hero.title.line1', 'Courses &');
 *
 * The provider seeds itself with hardcoded defaults from siteSettings.js
 * synchronously, so components render correctly on first paint and then
 * upgrade to DB values as soon as /api/public/settings resolves.
 */
export const useSiteSettings = () => {
  const ctx = useContext(SiteSettingsContext);
  if (!ctx) {
    throw new Error('useSiteSettings must be used within a SiteSettingsProvider');
  }
  return ctx;
};

export const SiteSettingsProvider = ({ children }) => {
  // Initial state preference: last-good cached values from a previous DB
  // fetch, falling back to bundled defaults. This means on a DB outage the
  // user keeps seeing whatever they saw last time — not a regression to
  // hardcoded copy.
  const [settings, setSettings] = useState(() => ({
    ...STATIC_DEFAULTS,
    ...(readLastGoodFromStorage() || {}),
  }));
  const [isLoading, setIsLoading] = useState(true);

  const applyRemote = useCallback((remote) => {
    if (!remote || typeof remote !== 'object') return;
    const merged = { ...STATIC_DEFAULTS, ...remote };
    setSettings(merged);
    writeLastGoodToStorage(remote);
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const remote = await fetchSiteSettings();
      applyRemote(remote);
    } finally {
      setIsLoading(false);
    }
  }, [applyRemote]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const remote = await fetchSiteSettings();
      if (!mounted) return;
      applyRemote(remote);
      setIsLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [applyRemote]);

  const value = useMemo(() => {
    const get = (key, fallback) => {
      const v = settings ? settings[key] : undefined;
      if (v === undefined || v === null || v === '') return fallback;
      return v;
    };
    return { settings, get, isLoading, refresh };
  }, [settings, isLoading, refresh]);

  return (
    <SiteSettingsContext.Provider value={value}>
      {children}
    </SiteSettingsContext.Provider>
  );
};
