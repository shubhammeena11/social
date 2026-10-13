'use client';

import AuthGuard from '@/components/AuthGuard';
import PostComposer from '@/components/PostComposer';

export default function CreatePage() {
  return (
    <AuthGuard>
      <div className="mx-auto max-w-3xl pb-24">
        <PostComposer />
      </div>
    </AuthGuard>
  );
}
