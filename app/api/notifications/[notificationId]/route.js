
import Notification from "@/models/Notification";
import { requireUser, handleRouteError, validObjectId } from "@/lib/route-utils";
import { notificationUpdateSchema } from "@/lib/validators";
import { success, failure, validationFailure } from "@/lib/api-response";

export async function PATCH(request, { params }) {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;

    const { notificationId } = await params;
    if (!validObjectId(notificationId)) {
      return failure("Invalid notification ID", 400);
    }

    const parsed = notificationUpdateSchema.safeParse(await request.json());
    if (!parsed.success) return validationFailure(parsed.error);

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: auth.userId },
      { $set: { isRead: parsed.data.isRead } },
      { new: true }
    );

    if (!notification) return failure("Notification not found", 404);

    return success({ notification });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;

    const { notificationId } = await params;
    if (!validObjectId(notificationId)) {
      return failure("Invalid notification ID", 400);
    }

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: auth.userId,
      isRead: true,
    });

    if (!notification) return failure("Read notification not found", 404);

    return success({ message: "Notification deleted" });
  } catch (error) {
    return handleRouteError(error);
  }
}