
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

    const likeFilter = { user: auth.userId, post: postId };
    const activateLike = {
      $set: { isDeleted: false, deletedAt: null },
      $setOnInsert: { user: auth.userId, post: postId },
    };
    let previous;
    try {
      previous = await Like.findOneAndUpdate(likeFilter, activateLike, {
        upsert: true,
        new: false,
      });
    } catch (error) {
      if (error?.code !== 11000) throw error;
      previous = await Like.findOneAndUpdate(likeFilter, activateLike, {
        new: false,
      });
    }

    const transitionedToActive = !previous || previous.isDeleted === true;

    if (transitionedToActive) {
      await Post.updateOne({ _id: postId }, { $inc: { likesCount: 1 } });

      await createNotification({
        recipient: post.author._id,
        actor: auth.userId,
        type: "like",
        post: postId,
      });
    }

    const likesCount = await Like.countDocuments({
      post: postId,
      isDeleted: { $ne: true },
    });

    return success({ liked: true, changed: transitionedToActive, likesCount });
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

    const previous = await Like.findOneAndUpdate(
      { user: auth.userId, post: postId, isDeleted: { $ne: true } },
      { $set: { isDeleted: true, deletedAt: new Date() } },
      { new: false }
    );

    if (previous) {
      await Post.updateOne(
        { _id: postId },
        [
          {
            $set: {
              likesCount: {
                $max: [
                  0,
                  { $subtract: [{ $ifNull: ["$likesCount", 0] }, 1] },
                ],
              },
            },
          },
        ],
        { updatePipeline: true }
      );
    }

    const likesCount = await Like.countDocuments({
      post: postId,
      isDeleted: { $ne: true },
    });

    return success({ liked: false, changed: Boolean(previous), likesCount });
  } catch (error) {
    return handleRouteError(error);
  }
}