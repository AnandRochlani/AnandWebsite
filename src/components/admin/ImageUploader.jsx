import React, { useRef, useState } from 'react';
import { Upload, Trash2, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Reusable image picker for the admin forms.
 *
 * Accepts either a pasted URL or an uploaded file. When a file is selected,
 * it's read into a base64 data URL on the client and passed back to the
 * parent via `onChange`. The stored value is whatever the parent puts in
 * `value` — either a remote URL or a `data:` URL — and the API endpoints
 * already accept either form for the `featuredImage` field.
 *
 * Note on storage: data URLs go straight into the `featured_image` TEXT
 * column. That's fine for small admin images (we cap at MAX_BYTES) but if
 * the catalog grows we'll want to swap to Vercel Blob or Cloudinary so the
 * DB rows don't bloat. The component shape stays the same — only the
 * upload path inside `handleFileChange` would change.
 *
 * Props:
 *   value:        string  — current URL / data URL (or '')
 *   onChange:     (next: string) => void
 *   accentColor:  Tailwind ring color suffix, e.g. 'purple-500'
 *   label:        string  — heading shown above the uploader
 */

const MAX_BYTES = 3 * 1024 * 1024; // 3MB — keeps JSON payloads under Vercel's default 4.5MB body cap.

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

const ImageUploader = ({
  value = '',
  onChange,
  accentColor = 'purple-500',
  label = 'Featured Image',
}) => {
  const fileInputRef = useRef(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    // Reset the input so picking the same file twice still fires onChange.
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!file) return;

    setError('');

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Please choose a JPEG, PNG, WebP, or GIF image.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`Image is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max is 3MB.`);
      return;
    }

    try {
      setBusy(true);
      const dataUrl = await readFileAsDataUrl(file);
      onChange?.(dataUrl);
    } catch (err) {
      setError(err?.message || 'Failed to read image');
    } finally {
      setBusy(false);
    }
  };

  const handleClear = () => {
    setError('');
    onChange?.('');
  };

  const isDataUrl = typeof value === 'string' && value.startsWith('data:');

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
        <ImageIcon className="w-4 h-4" />
        {label}
      </label>

      {/* URL input — paste a remote URL (e.g. Unsplash) */}
      <input
        type="url"
        value={isDataUrl ? '' : value}
        onChange={(e) => {
          setError('');
          onChange?.(e.target.value);
        }}
        placeholder="https://images.unsplash.com/..."
        className={`w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 text-white placeholder-gray-500 focus:ring-2 focus:ring-${accentColor} focus:outline-none`}
      />

      {/* File upload row */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          onChange={handleFileChange}
          className="hidden"
        />
        <Button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          size="sm"
          disabled={busy}
          className="border-white/20 text-white hover:bg-white/10"
        >
          <Upload className="w-4 h-4 mr-2" />
          {busy ? 'Reading…' : value ? 'Replace upload' : 'Upload from device'}
        </Button>
        {value && (
          <Button
            type="button"
            onClick={handleClear}
            variant="ghost"
            size="sm"
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Remove
          </Button>
        )}
        <span className="text-xs text-gray-500">JPEG, PNG, WebP, GIF · up to 3MB</span>
      </div>

      {/* Preview */}
      {value && (
        <div className="mt-2 rounded-lg overflow-hidden border border-white/10 bg-black/20 max-w-sm">
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <img
            src={value}
            alt="Featured image preview"
            className="w-full h-40 object-cover"
            onError={() => setError('Could not load image preview. Check the URL?')}
          />
        </div>
      )}

      {error && (
        <div className="text-red-400 text-sm flex items-center">
          <AlertCircle className="w-3 h-3 mr-1" />
          {error}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
