
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

    const author = await User.findById(auth.userId).select("postVisibility postAudience");
    if (!author) return failure("User not found", 404);

    const visibility = author.postVisibility || "everyone";
    let audience = [];
    if (visibility === "custom" && author.postAudience.length) {
      audience = await Follow.find({
        follower: { $in: author.postAudience },
        following: auth.userId,
        status: "accepted",
        isDeleted: { $ne: true },
      }).distinct("follower");
    }

    const post = await Post.create({
      ...parsed.data,
      visibility,
      audience,
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
      $or: [
        { visibility: "everyone" },
        { visibility: { $exists: false } },
        { author: auth.userId },
        { visibility: "followers", author: { $in: followedIds } },
        { visibility: "custom", author: { $in: followedIds }, audience: auth.userId },
      ],
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
