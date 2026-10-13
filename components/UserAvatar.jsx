'use client';

import { useEffect, useState } from 'react';

export default function UserAvatar({ user, size = 'md' }) {
  const [imageFailed, setImageFailed] = useState(false);
  const sizeMap = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-base',
    xl: 'h-20 w-20 text-xl',
  };

  const avatarUrl = user?.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user?.name || user?.username || 'U') + '&background=0f172a&color=fff';
  const initials = (user?.name || user?.username || 'U').trim().slice(0, 1).toUpperCase();

  useEffect(() => {
    setImageFailed(false);
  }, [avatarUrl]);

  return (
    <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-200 ${sizeMap[size]}`}>
      {imageFailed ? (
        <span aria-hidden="true" className="font-semibold text-slate-600">{initials}</span>
      ) : (
        <img
          src={avatarUrl}
          alt={user?.username || 'User avatar'}
          loading="lazy"
          decoding="async"
          onError={() => setImageFailed(true)}
          className="h-full w-full object-cover"
        />
      )}
    </div>
  );
}
