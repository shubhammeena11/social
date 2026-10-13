'use client';

import { useState } from 'react';
import { ImageOff } from 'lucide-react';

export default function PostMedia({ media, className = '' }) {
  const [failed, setFailed] = useState(false);
  const isVideo = media?.type === 'video';
  const aspectRatio = media?.width && media?.height
    ? `${media.width} / ${media.height}`
    : '4 / 3';

  return (
    <div
      className={`relative overflow-hidden bg-slate-100 ${className}`}
      style={{ aspectRatio }}
    >
      {failed ? (
        <div className="flex min-h-40 w-full flex-col items-center justify-center gap-2 p-4 text-sm text-slate-500">
          <ImageOff size={20} aria-hidden="true" />
          <span>Media could not be loaded</span>
        </div>
      ) : isVideo ? (
        <video
          src={media.url}
          controls
          playsInline
          preload="metadata"
          onError={() => setFailed(true)}
          className="h-full max-h-[min(75vh,720px)] w-full object-contain"
        />
      ) : (
        <img
          src={media?.url}
          alt={media?.altText || 'Post media'}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="h-full max-h-[min(75vh,720px)] w-full object-contain"
        />
      )}
    </div>
  );
}
