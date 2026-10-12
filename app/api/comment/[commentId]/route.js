
import Comment from "@/models/Comment";
import Post from "@/models/Post";
import { requireUser, handleRouteError, validObjectId } from "@/lib/route-utils";
import { success, failure } from "@/lib/api-response";

export async function DELETE(request, { params }) {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;

    const { commentId } = await params;
    if (!validObjectId(commentId)) return failure("Invalid comment ID", 400);

    const comment = await Comment.findById(commentId);
    if (!comment) return failure("Comment not found", 404);

    const post = await Post.findById(comment.post);
    if (!post) return failure("Post not found", 404);

    const isAuthor = String(comment.author) === String(auth.userId);
    const isPostOwner = String(post.author) === String(auth.userId);

    if (!isAuthor && !isPostOwner) {
      return failure("Not authorized to delete this comment", 403);
    }

    // Delete this comment and its direct replies.
    const ids = [
      comment._id,
      ...(await Comment.find({ parentComment: comment._id }).distinct("_id")),
    ];

    await Comment.deleteMany({ _id: { $in: ids } });

    await Post.updateOne(
      { _id: post._id, commentsCount: { $gte: ids.length } },
      { $inc: { commentsCount: -ids.length } }
    );

    return success({ message: "Comment deleted" });
  } catch (error) {
    return handleRouteError(error);
  }
}