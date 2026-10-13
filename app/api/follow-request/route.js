
import Follow from "@/models/Follow";
import { requireUser, handleRouteError } from "@/lib/route-utils";
import { paginationSchema } from "@/lib/validators";
import { success, validationFailure } from "@/lib/api-response";

export async function GET(request) {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;

    const parsed = paginationSchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams)
    );
    if (!parsed.success) return validationFailure(parsed.error);

    const { page, limit } = parsed.data;
    const filter = {
      following: auth.userId,
      status: "pending",
      isDeleted: { $ne: true },
    };

    const [requests, total] = await Promise.all([
      Follow.find(filter)
        .populate("follower", "name username avatar")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Follow.countDocuments(filter),
    ]);

    return success({ requests, page, limit, total });
  } catch (error) {
    return handleRouteError(error);
  }
}