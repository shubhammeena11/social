'use client';

import { useState } from 'react';
import { api, extractApiData } from '@/lib/api/client';
import PostMedia from './PostMedia';

export default function PostComposer({ onPosted }) {
  const [caption, setCaption] = useState('');
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [media, setMedia] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const uploadFile = async (file) => {
    const resourceType = file.type.startsWith('video/') ? 'video' : 'image';
    const signatureResponse = await api.post('/api/uploads/signature', { resourceType });
    const signatureData = extractApiData(signatureResponse);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', signatureData.apiKey);
    formData.append('timestamp', String(signatureData.timestamp));
    formData.append('signature', signatureData.signature);
    formData.append('folder', signatureData.folder);
    formData.append('resource_type', resourceType);

    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/${resourceType}/upload`,
      { method: 'POST', body: formData }
    );

    const uploadData = await uploadResponse.json();

    if (!uploadResponse.ok) {
      throw new Error(uploadData?.error?.message || 'Upload failed');
    }

    return {
      url: uploadData.secure_url,
      publicId: uploadData.public_id,
      type: resourceType,
      width: uploadData.width,
      height: uploadData.height,
      altText: file.name,
    };
  };

  const handleFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    setUploading(true);
    setError('');

    try {
      const uploaded = await Promise.all(files.map(uploadFile));
      setMedia((prev) => [...prev, ...uploaded].slice(0, 10));
    } catch (uploadErr) {
      setError(uploadErr.message || 'Media upload failed');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!caption.trim() && !media.length) {
      setError('Add a caption or media before publishing.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await api.post('/api/posts', {
        caption: caption.trim(),
        media,
        commentsEnabled,
      });

      setCaption('');
      setMedia([]);
      setCommentsEnabled(true);
      if (onPosted) onPosted();
    } catch (error) {
      setError(error.message || 'Could not create the post.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 text-lg font-semibold text-slate-900">Create a post</div>
      {error ? <div className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

      <textarea
        rows={4}
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="What’s on your mind?"
        className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-400"
      />

      {media.length ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {media.map((item, index) => (
            <div key={`${item.publicId}-${index}`} className="relative overflow-hidden rounded-2xl border border-slate-200">
              <PostMedia media={item} className="h-40 w-full" />
              <button
                type="button"
                onClick={() => setMedia((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}
                className="absolute right-2 top-2 rounded-full bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
          <input type="file" multiple accept="image/*,video/*" className="hidden" disabled={uploading} onChange={handleFiles} />
          {uploading ? 'Uploading...' : 'Add media'}
        </label>

        <label className="inline-flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={commentsEnabled}
            onChange={(e) => setCommentsEnabled(e.target.checked)}
          />
          Enable comments
        </label>
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitting || uploading}
        className="mt-4 w-full rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? 'Publishing...' : 'Publish post'}
      </button>
    </div>
  );
}
