
import Post from "@/models/Post";
import User from "@/models/User";
import { requireUser, handleRouteError, validObjectId } from "@/lib/route-utils";
import { postSchema } from "@/lib/validators";
import { success, failure, validationFailure } from "@/lib/api-response";
import { attachLikeState, getVisiblePost, isValidOwnedMedia } from "@/lib/social";
import cloudinary from "@/lib/cloudinary";

export async function GET(request, { params }) {
  try {
    const { postId } = await params;
    if (!validObjectId(postId)) return failure("Invalid post ID", 400);

    const viewerId = await (async () => {
      const auth = await requireUser();
      return auth.userId;
    })();

    const post = await getVisiblePost(postId, viewerId);
    if (!post) return failure("Post not found", 404);
    const [postWithLikeState] = await attachLikeState([post], viewerId);

    return success({ post: postWithLikeState });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request, { params }) {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;

    const { postId } = await params;
    if (!validObjectId(postId)) return failure("Invalid post ID", 400);

    const post = await Post.findById(postId);
    if (!post) return failure("Post not found", 404);
    if (String(post.author) !== String(auth.userId)) {
      return failure("Not authorized to edit this post", 403);
    }

    const parsed = postSchema.safeParse(await request.json());
    if (!parsed.success) return validationFailure(parsed.error);

    if (!(await isValidOwnedMedia(auth.userId, parsed.data.media))) {
      return failure("Invalid or unowned media asset", 400);
    }

    post.caption = parsed.data.caption;
    post.media = parsed.data.media;
    post.commentsEnabled = parsed.data.commentsEnabled;
    await post.save();

    return success({ post });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;

    const { postId } = await params;
    if (!validObjectId(postId)) return failure("Invalid post ID", 400);

    const post = await Post.findById(postId);
    if (!post) return failure("Post not found", 404);
    if (String(post.author) !== String(auth.userId)) {
      return failure("Not authorized to delete this post", 403);
    }

    // Remove associated documents and uploaded Cloudinary assets.
    const Like = (await import("@/models/Like")).default;
    const Comment = (await import("@/models/Comment")).default;
    const Notification = (await import("@/models/Notification")).default;

    await Promise.all([
      Like.updateMany(
        { post: post._id, isDeleted: { $ne: true } },
        { $set: { isDeleted: true, deletedAt: new Date() } }
      ),
      Comment.deleteMany({ post: post._id }),
      Notification.deleteMany({ post: post._id }),
      User.updateOne(
        { _id: auth.userId, postsCount: { $gt: 0 } },
        { $inc: { postsCount: -1 } }
      ),
    ]);

    for (const media of post.media) {
      try {
        await cloudinary.uploader.destroy(media.publicId, {
          resource_type: media.type === "video" ? "video" : "image",
        });
      } catch (error) {
        console.error("Cloudinary cleanup failed:", error);
      }
    }

    await post.deleteOne();

    return success({ message: "Post deleted" });
  } catch (error) {
    return handleRouteError(error);
  }
}

