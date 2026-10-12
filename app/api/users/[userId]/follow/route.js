
import User from "@/models/User";
import Follow from "@/models/Follow";
import { requireUser, handleRouteError, validObjectId } from "@/lib/route-utils";
import { success, failure } from "@/lib/api-response";
import { createNotification } from "@/lib/social";

export async function POST(request, { params }) {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;

    const { userId } = await params;
    if (!validObjectId(userId)) return failure("Invalid user ID", 400);
    if (String(userId) === String(auth.userId)) {
      return failure("You cannot follow yourself", 400);
    }

    const target = await User.findById(userId).select("_id isPrivate");
    if (!target) return failure("User not found", 404);

    const status = target.isPrivate ? "pending" : "accepted";

    let relationship = await Follow.findOne({
      follower: auth.userId,
      following: userId,
    });

    if (relationship?.status === "accepted") {
      return success({ status: "accepted", message: "Already following" });
    }

    if (relationship) {
      relationship.status = status;
      await relationship.save();
    } else {
      relationship = await Follow.create({
        follower: auth.userId,
        following: userId,
        status,
      });
    }

    if (status === "accepted") {
      await Promise.all([
        User.updateOne({ _id: auth.userId }, { $inc: { followingCount: 1 } }),
        User.updateOne({ _id: userId }, { $inc: { followersCount: 1 } }),
      ]);

      await createNotification({
        recipient: userId,
        actor: auth.userId,
        type: "new_follower",
        follow: relationship._id,
      });
    } else {
      await createNotification({
        recipient: userId,
        actor: auth.userId,
        type: "follow_request",
        follow: relationship._id,
      });
    }

    return success({ status }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;

    const { userId } = await params;
    if (!validObjectId(userId)) return failure("Invalid user ID", 400);

    const relationship = await Follow.findOneAndDelete({
      follower: auth.userId,
      following: userId,
    });

    if (!relationship) {
      return success({ message: "Relationship already removed" });
    }

    if (relationship.status === "accepted") {
      await Promise.all([
        User.updateOne(
          { _id: auth.userId, followingCount: { $gt: 0 } },
          { $inc: { followingCount: -1 } }
        ),
        User.updateOne(
          { _id: userId, followersCount: { $gt: 0 } },
          { $inc: { followersCount: -1 } }
        ),
      ]);
    }

    return success({ message: "Unfollowed or request cancelled" });
  } catch (error) {
    return handleRouteError(error);
  }
}