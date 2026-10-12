
import Notification from "@/models/Notification";
import { requireUser, handleRouteError } from "@/lib/route-utils";
import { paginationSchema } from "@/lib/validators";
import { success, validationFailure } from "@/lib/api-response";

export async function GET(request) {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;

    const url = new URL(request.url);
    const parsed = paginationSchema.safeParse(
      Object.fromEntries(url.searchParams)
    );
    if (!parsed.success) return validationFailure(parsed.error);

    const { page, limit } = parsed.data;
    const filter = { recipient: auth.userId };

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .populate("actor", "name username avatar")
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Notification.countDocuments(filter),
      Notification.countDocuments({ ...filter, isRead: false }),
    ]);

    return success({
      notifications,
      unreadCount,
      page,
      limit,
      total,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}