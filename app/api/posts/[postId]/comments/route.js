
import Comment from "@/models/Comment";
import Post from "@/models/Post";
import { requireUser, handleRouteError, validObjectId } from "@/lib/route-utils";
import { paginationSchema, commentSchema } from "@/lib/validators";
import { success, failure, validationFailure } from "@/lib/api-response";
import { getVisiblePost, createNotification } from "@/lib/social";

export async function GET(request, { params }) {
  try {
    const { postId } = await params;
    if (!validObjectId(postId)) return failure("Invalid post ID", 400);

    const auth = await requireUser();
    const viewerId = auth.userId;

    const post = await getVisiblePost(postId, viewerId);
    if (!post) return failure("Post not found", 404);

    const url = new URL(request.url);
    const parsed = paginationSchema.safeParse(
      Object.fromEntries(url.searchParams)
    );
    if (!parsed.success) return validationFailure(parsed.error);

    const { page, limit } = parsed.data;
    const filter = { post: postId, parentComment: null };

    const [comments, total] = await Promise.all([
      Comment.find(filter)
        .populate("author", "name username avatar")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Comment.countDocuments(filter),
    ]);

    return success({ comments, page, limit, total });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request, { params }) {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;

    const { postId } = await params;
    if (!validObjectId(postId)) return failure("Invalid post ID", 400);

    const post = await getVisiblePost(postId, auth.userId);
    if (!post) return failure("Post not found", 404);
    if (!post.commentsEnabled) return failure("Comments are disabled", 403);

    const parsed = commentSchema.safeParse(await request.json());
    if (!parsed.success) return validationFailure(parsed.error);

    if (parsed.data.parentComment) {
      const parent = await Comment.findOne({
        _id: parsed.data.parentComment,
        post: postId,
      });

      if (!parent) return failure("Parent comment not found", 404);
    }

    const comment = await Comment.create({
      author: auth.userId,
      post: postId,
      text: parsed.data.text,
      parentComment: parsed.data.parentComment || null,
    });

    await Post.updateOne({ _id: postId }, { $inc: { commentsCount: 1 } });

    await createNotification({
      recipient: post.author._id,
      actor: auth.userId,
      type: parsed.data.parentComment ? "comment_reply" : "comment",
      post: postId,
      comment: comment._id,
    });

    return success({ comment }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}