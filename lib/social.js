
import User from "@/models/User";
import Follow from "@/models/Follow";
import Notification from "@/models/Notification";
import Post from "@/models/Post";


export async function canViewUserPosts(viewerId, ownerId, isPrivate) {
  if (!isPrivate) return true;
  if (!viewerId) return false;
  if (String(viewerId) === String(ownerId)) return true;

  return Boolean(
    await Follow.exists({
      follower: viewerId,
      following: ownerId,
      status: "accepted",
    })
  );
}

export async function canViewPost(viewerId, post) {
if (!post) return false;

const owner = await post.populate("author", "isPrivate");

if (!owner.author) return false;

return canViewUserPosts(
viewerId,
owner.author._id,
owner.author.isPrivate
);
}

export async function createNotification(data) {
  if (String(data.recipient) === String(data.actor)) return null;
  return Notification.create(data);
}


export async function isValidOwnedMedia(userId, media) {
  const prefix = `social-media/${userId}/`;

  for (const item of media) {
    if (!item.publicId?.startsWith(prefix)) return false;

    const resourceType = item.type === "video" ? "video" : "image";

    try {
      const asset = await (
        await import("@/lib/cloudinary")
      ).default.api.resource(item.publicId, {
        resource_type: resourceType,
      });

      if (!asset.public_id.startsWith(prefix)) return false;
      if (asset.secure_url !== item.url) return false;
      if (asset.resource_type !== resourceType) return false;
    } catch {
      return false;
    }
  }

  return true;
}

export async function getVisiblePost(postId, viewerId) {
  const post = await Post.findById(postId).populate(
    "author",
    "username name avatar isPrivate"
  );

  if (!post || !post.author) return null;

  const allowed = await canViewUserPosts(
    viewerId,
    post.author._id,
    post.author.isPrivate
  );

  return allowed ? post : null;
}