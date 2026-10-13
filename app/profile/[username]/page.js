'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { ImagePlus, Lock, PencilLine } from 'lucide-react';
import { api, extractApiData } from '@/lib/api/client';
import AuthGuard from '@/components/AuthGuard';
import UserAvatar from '@/components/UserAvatar';
import FollowButton from '@/components/FollowButton';
import PostCard from '@/components/PostCard';
import EmptyState from '@/components/EmptyState';

async function uploadAvatar(file) {
  const signatureResponse = await api.post('/api/uploads/signature', { resourceType: 'image' });
  const signatureData = extractApiData(signatureResponse);
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', signatureData.apiKey);
  formData.append('timestamp', String(signatureData.timestamp));
  formData.append('signature', signatureData.signature);
  formData.append('folder', signatureData.folder);
  formData.append('resource_type', 'image');

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`,
    { method: 'POST', body: formData }
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || 'Avatar upload failed. Please try again.');
  }

  return data.secure_url;
}

export default function ProfilePage() {
  const { username } = useParams();
  const currentUser = useSelector((state) => state.auth.user);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', bio: '', isPrivate: false, avatar: '' });
  const [loading, setLoading] = useState(true);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => () => {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
  }, [avatarPreview]);

  const fetchProfile = useCallback(async () => {
    try {
      const response = await api.get(`/api/users/${username}`);
      const payload = extractApiData(response);
      const nextProfile = {
        ...payload.user,
        isFollowing: Boolean(payload.isFollowing),
        relationship: payload.relationship || (payload.isFollowing ? 'accepted' : 'not_following'),
        canViewPosts: Boolean(payload.canViewPosts),
      };
      setProfile(nextProfile);
      setForm({
        name: nextProfile.name || '',
        bio: nextProfile.bio || '',
        isPrivate: Boolean(nextProfile.isPrivate),
        avatar: nextProfile.avatar || '',
      });
    } catch (error) {
      console.error(error);
    }
  }, [username]);

  const fetchPosts = useCallback(async () => {
    try {
      const response = await api.get('/api/posts?page=1&limit=50');
      const payload = extractApiData(response);
      const filtered = (payload.posts || []).filter((post) => post.author && post.author.username === username);
      setPosts(filtered);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    if (username) {
      fetchProfile();
      fetchPosts();
    }
  }, [username, fetchProfile, fetchPosts]);

  const isOwner = useMemo(() => {
    if (!currentUser || !profile) return false;
    return String(currentUser.id || currentUser._id) === String(profile._id || profile.id);
  }, [currentUser, profile]);

  const onSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const avatar = avatarFile ? await uploadAvatar(avatarFile) : form.avatar;
      await api.patch(`/api/users/${username}`, {
        name: form.name,
        bio: form.bio,
        avatar: avatar || undefined,
        isPrivate: form.isPrivate,
      });
      setForm((prev) => ({ ...prev, avatar }));
      setAvatarFile(null);
      setAvatarPreview('');
      setEditing(false);
      await fetchProfile();
    } catch (error) {
      console.error(error);
      setSaveError(error.message || 'Could not update your profile.');
    } finally {
      setSaving(false);
    }
  };

  if (!profile && loading) {
    return <AuthGuard><div className="rounded-2xl bg-white p-6 text-sm text-slate-500">Loading profile...</div></AuthGuard>;
  }

  if (!profile) {
    return <AuthGuard><div className="rounded-2xl bg-white p-6 text-sm text-slate-500">Profile not found.</div></AuthGuard>;
  }

  return (
    <AuthGuard>
      <div className="mx-auto max-w-4xl space-y-6 pb-24">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4">
              <UserAvatar user={profile} size="xl" />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-slate-900">{profile.name || profile.username}</h1>
                  {profile.isPrivate ? <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-700"><Lock size={10} /> Private</span> : null}
                </div>
                <div className="text-sm text-slate-500">@{profile.username}</div>
                <div className="mt-4 max-w-md text-sm leading-6 text-slate-600">{profile.bio || 'No bio yet.'}</div>
              </div>
            </div>

            <div className="flex flex-col items-start gap-3">
              {!isOwner ? (
                <FollowButton targetUser={profile} currentUser={currentUser} onChange={() => fetchProfile()} />
              ) : (
                <button onClick={() => setEditing((prev) => !prev)} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                  <PencilLine size={16} />
                  {editing ? 'Cancel' : 'Edit profile'}
                </button>
              )}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 rounded-2xl bg-slate-50 p-3 text-center">
            <div>
              <div className="text-xl font-bold text-slate-900">{profile.postsCount || posts.length}</div>
              <div className="text-xs uppercase tracking-wide text-slate-500">Posts</div>
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900">{profile.followersCount || 0}</div>
              <div className="text-xs uppercase tracking-wide text-slate-500">Followers</div>
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900">{profile.followingCount || 0}</div>
              <div className="text-xs uppercase tracking-wide text-slate-500">Following</div>
            </div>
          </div>
        </section>

        {editing ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-4">
              <label className="block text-sm font-medium text-slate-700">
                Name
                <input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Bio
                <textarea value={form.bio} onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))} rows={3} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Profile photo
                <div className="mt-2 flex flex-wrap items-center gap-4">
                  <UserAvatar user={{ ...profile, avatar: avatarPreview || form.avatar }} size="lg" />
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                    <ImagePlus size={16} />
                    Choose photo
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          setAvatarFile(file);
                          setAvatarPreview(URL.createObjectURL(file));
                          setSaveError('');
                        }
                        event.target.value = '';
                      }}
                    />
                  </label>
                  <span className="text-xs text-slate-500">Choose an image from your device</span>
                </div>
              </label>

              {saveError ? <p role="alert" className="text-sm text-red-700">{saveError}</p> : null}

              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input checked={form.isPrivate} onChange={(e) => setForm((prev) => ({ ...prev, isPrivate: e.target.checked }))} type="checkbox" />
                Private account
              </label>

              <button onClick={onSave} disabled={saving} className="rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
                {saving ? (avatarFile ? 'Uploading and saving...' : 'Saving...') : 'Save changes'}
              </button>
            </div>
          </section>
        ) : null}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading posts...</div>
        ) : posts.length ? (
          <div className="space-y-5">
            {posts.map((post) => <PostCard key={post._id} post={post} currentUser={currentUser} onChanged={fetchPosts} onDeleted={() => fetchPosts()} />)}
          </div>
        ) : (
          <EmptyState title="No posts yet" description="This profile does not have any visible posts." />
        )}
      </div>
    </AuthGuard>
  );
}
