
import User from "@/models/User";
import Follow from "@/models/Follow";
import { connectDB } from "@/lib/mongodb";
import { requireUser, handleRouteError, validObjectId } from "@/lib/route-utils";
import { paginationSchema } from "@/lib/validators";
import { success, failure, validationFailure } from "@/lib/api-response";

export async function GET(request, { params }) {
  try {
    await connectDB();

    const { userId } = await params;
    if (!validObjectId(userId)) return failure("Invalid user ID", 400);

    const target = await User.findById(userId).select("_id isPrivate");
    if (!target) return failure("User not found", 404);

    const auth = await requireUser();

    if (target.isPrivate && String(auth.userId) !== String(userId)) {
      const allowed = auth.userId && await Follow.exists({
        follower: auth.userId,
        following: userId,
        status: "accepted",
        isDeleted: { $ne: true },
      });

      if (!allowed) return failure("This account is private", 403);
    }

    const url = new URL(request.url);
    const parsed = paginationSchema.safeParse(
      Object.fromEntries(url.searchParams)
    );
    if (!parsed.success) return validationFailure(parsed.error);

    const { page, limit } = parsed.data;
    const filter = {
      following: userId,
      status: "accepted",
      isDeleted: { $ne: true },
    };

    const [relationships, total] = await Promise.all([
      Follow.find(filter)
        .populate("follower", "name username avatar")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Follow.countDocuments(filter),
    ]);

    return success({
      followers: relationships.map((item) => item.follower),
      page,
      limit,
      total,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}