
import Follow from "@/models/Follow";
import User from "@/models/User";
import { requireUser, handleRouteError, validObjectId } from "@/lib/route-utils";
import { followRequestActionSchema } from "@/lib/validators";
import { success, failure, validationFailure } from "@/lib/api-response";
import { createNotification } from "@/lib/social";

export async function PATCH(request, { params }) {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;

    const { requestId } = await params;
    if (!validObjectId(requestId)) return failure("Invalid request ID", 400);

    const parsed = followRequestActionSchema.safeParse(await request.json());
    if (!parsed.success) return validationFailure(parsed.error);

    const relationship = await Follow.findOneAndUpdate({
      _id: requestId,
      following: auth.userId,
      status: "pending",
      isDeleted: { $ne: true },
    }, {
      $set: { status: parsed.data.action === "reject" ? "rejected" : "accepted" },
    }, { new: false });

    if (!relationship) {
      return failure("Pending request not found", 404);
    }

    if (parsed.data.action === "reject") {
      return success({ status: "rejected" });
    }

    await Promise.all([
      User.updateOne(
        { _id: relationship.follower },
        { $inc: { followingCount: 1 } }
      ),
      User.updateOne(
        { _id: relationship.following },
        { $inc: { followersCount: 1 } }
      ),
      createNotification({
        recipient: relationship.follower,
        actor: auth.userId,
        type: "follow_accepted",
        follow: relationship._id,
      }),
    ]);

    return success({ status: "accepted" });
  } catch (error) {
    return handleRouteError(error);
  }
}