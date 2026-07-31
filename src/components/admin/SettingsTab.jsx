import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Save, Loader2, RotateCcw, Undo2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { adminFetchSiteSettings, adminUpdateSiteSettings } from '@/data/dbApi';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { getDefaultSettingsMap } from '@/data/siteSettings';

const CATEGORY_LABELS = {
  hero: 'Home — Hero Section',
  features: 'Home — Feature Cards',
  footer: 'Footer',
  social: 'Social Links',
  seo: 'SEO Defaults',
  general: 'General',
};

// Order categories for display. Anything not listed falls to the bottom.
const CATEGORY_ORDER = ['hero', 'features', 'footer', 'social', 'seo', 'general'];

// Icons supported by Footer.jsx — kept in sync there. Surfaced in the admin
// description for `social.links` so admins know which strings work.
const SUPPORTED_SOCIAL_ICONS = ['Youtube', 'Linkedin', 'Github', 'Twitter', 'Mail'];

function deepEqual(a, b) {
  // JSON.stringify with a sorted-key replacer so object key order doesn't
  // produce false-positive "dirty" reports on otherwise-equal payloads.
  const sorter = (_k, v) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.keys(v).sort().reduce((acc, kk) => { acc[kk] = v[kk]; return acc; }, {})
      : v;
  try {
    return JSON.stringify(a, sorter) === JSON.stringify(b, sorter);
  } catch (_) {
    return a === b;
  }
}

function safePrettyJson(value) {
  try {
    return JSON.stringify(value ?? null, null, 2);
  } catch (_) {
    return '';
  }
}

const SettingInput = ({
  setting,
  draftValue,
  jsonText,
  jsonError,
  onValueChange,
  onJsonTextChange,
  onRevert,
  canRevert,
}) => {
  const { type, label, key, description } = setting;

  const renderField = () => {
    if (type === 'textarea') {
      return (
        <textarea
          value={draftValue ?? ''}
          onChange={(e) => onValueChange(e.target.value)}
          rows={4}
          className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
        />
      );
    }
    if (type === 'boolean') {
      return (
        <label className="inline-flex items-center cursor-pointer space-x-2">
          <input
            type="checkbox"
            checked={Boolean(draftValue)}
            onChange={(e) => onValueChange(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm text-gray-300">{draftValue ? 'Enabled' : 'Disabled'}</span>
        </label>
      );
    }
    if (type === 'json') {
      return (
        <div className="space-y-1">
          <textarea
            value={jsonText ?? ''}
            onChange={(e) => onJsonTextChange(e.target.value)}
            rows={Math.min(20, Math.max(6, (jsonText || '').split('\n').length))}
            spellCheck={false}
            className={`w-full px-4 py-2 rounded-lg bg-black/30 border text-white font-mono text-xs focus:ring-2 focus:outline-none ${
              jsonError
                ? 'border-red-500/60 focus:ring-red-500'
                : 'border-white/10 focus:ring-purple-500'
            }`}
          />
          {jsonError ? (
            <p className="flex items-start gap-1 text-xs text-red-400">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>{jsonError}</span>
            </p>
          ) : null}
        </div>
      );
    }
    if (type === 'image_url') {
      return (
        <div className="space-y-2">
          <input
            type="url"
            value={draftValue ?? ''}
            onChange={(e) => onValueChange(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
          {draftValue ? (
            <img
              src={draftValue}
              alt={label || key}
              className="h-20 max-w-[12rem] w-auto rounded border border-white/10 object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : null}
        </div>
      );
    }
    // url / text / default
    return (
      <input
        type={type === 'url' ? 'url' : 'text'}
        value={draftValue ?? ''}
        onChange={(e) => onValueChange(e.target.value)}
        className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
      />
    );
  };

  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2">
        <label className="text-sm font-medium text-gray-300">
          {label || key}
        </label>
        <div className="flex items-center gap-2">
          {canRevert ? (
            <button
              type="button"
              onClick={onRevert}
              title="Revert to bundled default"
              className="text-[10px] text-gray-500 hover:text-purple-300 inline-flex items-center gap-1"
            >
              <Undo2 className="w-3 h-3" />
              default
            </button>
          ) : null}
          <span className="text-[10px] text-gray-500 font-mono">{key}</span>
        </div>
      </div>
      {description ? (
        <p className="text-xs text-gray-500">{description}</p>
      ) : null}
      {/* Special-case hint for social.links so admins know which icon names work */}
      {key === 'social.links' ? (
        <p className="text-[11px] text-gray-500">
          Supported <code className="text-gray-400">icon</code> values:{' '}
          {SUPPORTED_SOCIAL_ICONS.map((n, i) => (
            <span key={n}>
              <code className="text-gray-300">{n}</code>
              {i < SUPPORTED_SOCIAL_ICONS.length - 1 ? ', ' : ''}
            </span>
          ))}
          . Unknown icons fall back to Mail.
        </p>
      ) : null}
      {renderField()}
    </div>
  );
};

const SettingsTab = () => {
  const { toast } = useToast();
  const { refresh: refreshPublicSettings } = useSiteSettings();

  const [allSettings, setAllSettings] = useState([]); // full rows from /api/admin/settings
  const [drafts, setDrafts] = useState({}); // key -> staged parsed value
  const [jsonText, setJsonText] = useState({}); // key -> raw textarea contents (json fields only)
  const [jsonErrors, setJsonErrors] = useState({}); // key -> parse error message (json fields only)
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Bundled in-code defaults (last-resort revert target).
  const codeDefaults = useMemo(() => getDefaultSettingsMap(), []);

  const seedFromRows = useCallback((rows) => {
    const initialDrafts = {};
    const initialJsonText = {};
    for (const r of rows) {
      initialDrafts[r.key] = r.value;
      if (r.type === 'json') {
        initialJsonText[r.key] = safePrettyJson(r.value);
      }
    }
    setDrafts(initialDrafts);
    setJsonText(initialJsonText);
    setJsonErrors({});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await adminFetchSiteSettings();
      setAllSettings(rows);
      seedFromRows(rows);
    } catch (e) {
      toast({
        title: 'Error',
        description: e?.message || 'Failed to load settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [seedFromRows, toast]);

  useEffect(() => {
    load();
  }, [load]);

  // The grouping/dirty calculation below uses `allSettings`/`drafts`. We
  // re-register the beforeunload listener after those compute so the handler
  // closes over the latest values.

  const grouped = useMemo(() => {
    const map = new Map();
    for (const s of allSettings) {
      const key = s.category || 'general';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(s);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.key.localeCompare(b.key));
    }
    const orderedKeys = Array.from(map.keys()).sort((a, b) => {
      const ai = CATEGORY_ORDER.indexOf(a);
      const bi = CATEGORY_ORDER.indexOf(b);
      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
    return orderedKeys.map((k) => ({ category: k, items: map.get(k) }));
  }, [allSettings]);

  const dirtyKeys = useMemo(() => {
    const out = [];
    for (const s of allSettings) {
      if (!deepEqual(drafts[s.key], s.value)) out.push(s.key);
    }
    return out;
  }, [allSettings, drafts]);

  const hasJsonErrors = Object.keys(jsonErrors).length > 0;

  // Warn before tab close / hard refresh while there are unsaved edits.
  useEffect(() => {
    if (dirtyKeys.length === 0 && !hasJsonErrors) return undefined;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirtyKeys, hasJsonErrors]);

  const handleValueChange = (key, value) => {
    setDrafts((prev) => ({ ...prev, [key]: value }));
  };

  const handleJsonTextChange = (key, raw) => {
    setJsonText((prev) => ({ ...prev, [key]: raw }));
    // Try to parse on every keystroke so dirty-state and Save validity stay
    // accurate, but ALWAYS keep the raw text in `jsonText` so the editor
    // doesn't reformat under the user's cursor.
    if (raw.trim() === '') {
      setDrafts((prev) => ({ ...prev, [key]: null }));
      setJsonErrors((prev) => {
        const { [key]: _drop, ...rest } = prev;
        return rest;
      });
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      setDrafts((prev) => ({ ...prev, [key]: parsed }));
      setJsonErrors((prev) => {
        const { [key]: _drop, ...rest } = prev;
        return rest;
      });
    } catch (e) {
      setJsonErrors((prev) => ({ ...prev, [key]: e?.message || 'Invalid JSON' }));
    }
  };

  const handleRevertField = (key) => {
    const def = codeDefaults[key];
    setDrafts((prev) => ({ ...prev, [key]: def }));
    const setting = allSettings.find((s) => s.key === key);
    if (setting?.type === 'json') {
      setJsonText((prev) => ({ ...prev, [key]: safePrettyJson(def) }));
      setJsonErrors((prev) => {
        const { [key]: _drop, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleResetAll = () => {
    if (dirtyKeys.length === 0 && !hasJsonErrors) return;
    if (!window.confirm('Discard all unsaved changes?')) return;
    seedFromRows(allSettings);
  };

  const handleSave = async () => {
    if (hasJsonErrors) {
      toast({
        title: 'Fix invalid JSON first',
        description: `${Object.keys(jsonErrors).length} field(s) have parse errors.`,
        variant: 'destructive',
      });
      return;
    }
    if (dirtyKeys.length === 0) {
      toast({ title: 'No changes', description: 'Nothing to save.' });
      return;
    }
    setSaving(true);
    try {
      const updates = dirtyKeys.map((key) => ({ key, value: drafts[key] }));
      const refreshed = await adminUpdateSiteSettings(updates);
      setAllSettings(refreshed);
      seedFromRows(refreshed);
      try { await refreshPublicSettings(); } catch (e) { /* non-fatal */ }
      toast({
        title: 'Saved',
        description: `${updates.length} setting${updates.length === 1 ? '' : 's'} updated.`,
        className: 'bg-green-600 border-green-700 text-white',
      });
    } catch (e) {
      toast({
        title: 'Error',
        description: e?.message || 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin mr-2" />
        <span className="text-sm text-gray-400">Loading settings…</span>
      </div>
    );
  }

  return (
    <motion.div
      key="settings-form"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-white">Site Settings</h2>
          <p className="text-gray-400 text-sm mt-1">
            Edit hero copy, footer, social links, and SEO defaults. Changes are
            saved to the database and reflected across the site after the next
            page load.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleResetAll}
            disabled={(dirtyKeys.length === 0 && !hasJsonErrors) || saving}
            className="border-white/20 text-gray-300 hover:bg-white/10"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={dirtyKeys.length === 0 || saving || hasJsonErrors}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save {dirtyKeys.length > 0 ? `(${dirtyKeys.length})` : ''}
          </Button>
        </div>
      </div>

      {grouped.map(({ category, items }) => (
        <section key={category} className="space-y-4">
          <h3 className="text-lg font-semibold text-purple-300 border-b border-white/10 pb-2">
            {CATEGORY_LABELS[category] || category}
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            {items.map((s) => {
              const def = codeDefaults[s.key];
              const canRevert = def !== undefined && !deepEqual(drafts[s.key], def);
              return (
                <SettingInput
                  key={s.key}
                  setting={s}
                  draftValue={drafts[s.key]}
                  jsonText={jsonText[s.key]}
                  jsonError={jsonErrors[s.key]}
                  onValueChange={(v) => handleValueChange(s.key, v)}
                  onJsonTextChange={(t) => handleJsonTextChange(s.key, t)}
                  onRevert={() => handleRevertField(s.key)}
                  canRevert={canRevert}
                />
              );
            })}
          </div>
        </section>
      ))}
    </motion.div>
  );
};

export default SettingsTab;
