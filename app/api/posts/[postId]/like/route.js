
import Like from "@/models/Like";
import Post from "@/models/Post";
import User from "@/models/User";
import { requireUser, handleRouteError, validObjectId } from "@/lib/route-utils";
import { success, failure } from "@/lib/api-response";
import { getVisiblePost, createNotification } from "@/lib/social";

export async function POST(request, { params }) {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;

    const { postId } = await params;
    if (!validObjectId(postId)) return failure("Invalid post ID", 400);

    const post = await getVisiblePost(postId, auth.userId);
    if (!post) return failure("Post not found", 404);

    const result = await Like.updateOne(
      { user: auth.userId, post: postId },
      { $setOnInsert: { user: auth.userId, post: postId } },
      { upsert: true }
    );

    if (result.upsertedCount) {
      await Post.updateOne({ _id: postId }, { $inc: { likesCount: 1 } });

      await createNotification({
        recipient: post.author._id,
        actor: auth.userId,
        type: "like",
        post: postId,
      });
    }

    return success({ liked: true });
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

    const result = await Like.deleteOne({
      user: auth.userId,
      post: postId,
    });

    if (result.deletedCount) {
      await Post.updateOne(
        { _id: postId, likesCount: { $gt: 0 } },
        { $inc: { likesCount: -1 } }
      );
    }

    return success({ liked: false });
  } catch (error) {
    return handleRouteError(error);
  }
}