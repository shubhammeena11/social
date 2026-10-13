
import Post from "@/models/Post";
import User from "@/models/User";
import Follow from "@/models/Follow";
import { connectDB } from "@/lib/mongodb";
import { requireUser, handleRouteError } from "@/lib/route-utils";
import { postSchema, paginationSchema } from "@/lib/validators";
import {
  success,
  failure,
  validationFailure,
} from "@/lib/api-response";
import { attachLikeState, isValidOwnedMedia } from "@/lib/social";

// Create a post
export async function POST(request) {
  try {
    await connectDB();

    const auth = await requireUser();
    if (auth.response) return auth.response;

    const parsed = postSchema.safeParse(await request.json());
    if (!parsed.success) {
      return validationFailure(parsed.error);
    }

    const validMedia = await isValidOwnedMedia(
      auth.userId,
      parsed.data.media
    );

    if (!validMedia) {
      return failure("Invalid or unowned media asset", 400);
    }

    const post = await Post.create({
      ...parsed.data,
      author: auth.userId,
    });

    await User.updateOne(
      { _id: auth.userId },
      { $inc: { postsCount: 1 } }
    );

    await post.populate("author", "name username avatar isPrivate");

    return success({ post }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}

// Get posts visible to the logged-in user
export async function GET(request) {
  try {
    await connectDB();

    const auth = await requireUser();
    if (auth.response) return auth.response;

    const url = new URL(request.url);

    const parsed = paginationSchema.safeParse(
      Object.fromEntries(url.searchParams)
    );

    if (!parsed.success) {
      return validationFailure(parsed.error);
    }

    const { page, limit } = parsed.data;

    const [followedIds, publicIds] = await Promise.all([
      Follow.find({
        follower: auth.userId,
        status: "accepted",
        isDeleted: { $ne: true },
      }).distinct("following"),

      User.find({
        isPrivate: false,
      }).distinct("_id"),
    ]);

 
    const authorIds = [
      ...new Set(
        [...followedIds, auth.userId, ...publicIds].map(String)
      ),
    ];

    const filter = {
      author: { $in: authorIds },
    };

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .populate("author", "name username avatar isPrivate")
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit),

      Post.countDocuments(filter),
    ]);
    const postsWithLikeState = await attachLikeState(posts, auth.userId);

    return success({
      posts: postsWithLikeState,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
