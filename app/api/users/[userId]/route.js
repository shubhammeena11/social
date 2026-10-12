import User from "@/models/User";
import { connectDB } from "@/lib/mongodb";
import { requireUser, handleRouteError } from "@/lib/route-utils";
import { success, failure, validationFailure } from "@/lib/api-response";
import { profileUpdateSchema } from "@/lib/validators";
import { canViewUserPosts } from "@/lib/social";

export async function PATCH(request, { params }) {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;

    const { userId } = await params;

    const parsed = profileUpdateSchema.safeParse(await request.json());
    if (!parsed.success) return validationFailure(parsed.error);

    const user = await User.findOne({
      username: userId.toLowerCase(),
    });

    if (!user) return failure("User not found", 404);

    if (String(user._id) !== String(auth.userId)) {
      return failure("You can only update your own profile", 403);
    }

    Object.assign(user, parsed.data);
    await user.save();

    return success({
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        bio: user.bio,
        avatar: user.avatar,
        isPrivate: user.isPrivate,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
export async function GET(request, { params }) {
  try {
    const { userId } = await params;

    await connectDB();

    const user = await User.findOne({
      username: userId.toLowerCase(),
    }).select(
      "name username bio avatar isPrivate followersCount followingCount postsCount createdAt"
    );

    if (!user) return failure("User not found", 404);

    const auth = await requireUser();
    const viewerId = auth.userId;

    const canViewPosts = await canViewUserPosts(
      viewerId,
      user._id,
      user.isPrivate
    );

    const Follow = (await import("@/models/Follow")).default;

    const isFollowing = viewerId
      ? Boolean(
          await Follow.exists({
            follower: viewerId,
            following: user._id,
            status: "accepted",
          })
        )
      : false;

    return success({
      user,
      isFollowing,
      canViewPosts,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}