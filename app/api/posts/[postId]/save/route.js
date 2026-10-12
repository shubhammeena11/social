
import mongoose from "mongoose";
import SavedPost from "@/models/SavedPost";
import Post from "@/models/Post";
import { connectDB } from "@/lib/mongodb";
import {
  requireUser,
  handleRouteError,
  validObjectId,
} from "@/lib/route-utils";
import { success, failure } from "@/lib/api-response";
import { canViewPost } from "@/lib/social";

// Save a post
export async function POST(request, { params }) {
  try {
    await connectDB();

    const auth = await requireUser();
    if (auth.response) return auth.response;

    const { postId } = await params;

    if (!validObjectId(postId)) {
      return failure("Invalid post ID", 400);
    }

    const post = await Post.findById(postId);

    if (!post) {
      return failure("Post not found", 404);
    }

  const canView = await canViewPost(auth.userId, post);

    if (!canView) {
      return failure("You cannot save this post", 403);
    }

    const savedPost = await SavedPost.findOneAndUpdate(
      { user: auth.userId, post: post._id },
      { $setOnInsert: { user: auth.userId, post: post._id } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return success({ saved: true, savedPost });
  } catch (error) {
    // A concurrent duplicate save can trigger the unique index.
    if (error.code === 11000) {
      return success({ saved: true, message: "Post already saved" });
    }

    return handleRouteError(error);
  }
}

// Unsave a post
export async function DELETE(request, { params }) {
  try {
    await connectDB();

    const auth = await requireUser();
    if (auth.response) return auth.response;

    const { postId } = await params;

    if (!validObjectId(postId)) {
      return failure("Invalid post ID", 400);
    }

    const result = await SavedPost.deleteOne({
      user: auth.userId,
      post: postId,
    });

    if (result.deletedCount === 0) {
      return failure("Post is not saved", 404);
    }

    return success({ saved: false, message: "Post removed from saved posts" });
  } catch (error) {
    return handleRouteError(error);
  }
}
