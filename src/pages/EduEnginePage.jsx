import React, { useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import LessonRenderer from '@/edu-engine/LessonRenderer';
import { themeList, DEFAULT_THEME_ID } from '@/edu-engine/themes';
import sampleLesson from '@/edu-engine/sampleLesson';

/**
 * Internal preview surface for the edu-engine.
 *
 * Renders one lesson through every registered theme so a theme can be judged on
 * real content. Kept out of the sitemap and noindexed — this is a workbench,
 * not a page for readers.
 */
const EduEnginePage = () => {
  const [themeId, setThemeId] = useState(
    () => new URLSearchParams(window.location.search).get('theme') || DEFAULT_THEME_ID
  );
  const [mode, setMode] = useState('light');

  const selectTheme = (id) => {
    setThemeId(id);
    const url = new URL(window.location.href);
    url.searchParams.set('theme', id);
    window.history.replaceState({}, '', url);
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-20">
      <SEOHead
        title="edu-engine preview"
        description="Internal preview of the edu-engine themeable lesson renderer."
        noindex
      />

      <div className="sticky top-16 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
            edu-engine
          </span>
          <div className="flex flex-wrap gap-2">
            {themeList.map((theme) => (
              <button
                key={theme.id}
                type="button"
                onClick={() => selectTheme(theme.id)}
                aria-pressed={theme.id === themeId}
                className={`px-3 py-1.5 rounded-md text-sm font-semibold border transition-colors ${
                  theme.id === themeId
                    ? 'bg-brand text-white border-brand'
                    : 'bg-white text-slate-700 border-slate-300 hover:border-brand'
                }`}
              >
                {theme.name}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setMode((m) => (m === 'light' ? 'dark' : 'light'))}
            className="ml-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold border border-slate-300 bg-white text-slate-700 hover:border-brand"
          >
            {mode === 'light' ? <Moon size={15} /> : <Sun size={15} />}
            {mode === 'light' ? 'Dark' : 'Light'}
          </button>
        </div>
      </div>

      <LessonRenderer lesson={sampleLesson} themeId={themeId} mode={mode} />
    </div>
  );
};

export default EduEnginePage;
