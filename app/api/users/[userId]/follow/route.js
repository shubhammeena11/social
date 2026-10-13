
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

    const alreadyAccepted = await Follow.exists({
      follower: auth.userId,
      following: userId,
      status: "accepted",
      isDeleted: { $ne: true },
    });

    if (alreadyAccepted) {
      return success({ status: "accepted", message: "Already following" });
    }

    const followFilter = { follower: auth.userId, following: userId };
    const activateFollow = {
      $set: { status, isDeleted: false, deletedAt: null },
      $setOnInsert: { follower: auth.userId, following: userId },
    };
    let previous;
    try {
      previous = await Follow.findOneAndUpdate(followFilter, activateFollow, {
        upsert: true,
        new: false,
      });
    } catch (error) {
      if (error?.code !== 11000) throw error;
      previous = await Follow.findOneAndUpdate(followFilter, activateFollow, {
        new: false,
      });
    }
    const transitionedToAccepted = status === "accepted" &&
      (!previous || previous.isDeleted === true || previous.status !== "accepted");
    const createdPendingRequest = status === "pending" &&
      (!previous || previous.isDeleted === true || previous.status !== "pending");
    const relationshipId = previous?._id ||
      (await Follow.findOne({ follower: auth.userId, following: userId }))._id;

    if (transitionedToAccepted) {
      await Promise.all([
        User.updateOne({ _id: auth.userId }, { $inc: { followingCount: 1 } }),
        User.updateOne({ _id: userId }, { $inc: { followersCount: 1 } }),
      ]);

      await createNotification({
        recipient: userId,
        actor: auth.userId,
        type: "new_follower",
        follow: relationshipId,
      });
    } else if (createdPendingRequest) {
      await createNotification({
        recipient: userId,
        actor: auth.userId,
        type: "follow_request",
        follow: relationshipId,
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

    const relationship = await Follow.findOneAndUpdate(
      {
        follower: auth.userId,
        following: userId,
        isDeleted: { $ne: true },
      },
      { $set: { isDeleted: true, deletedAt: new Date() } },
      { new: false }
    );

    if (!relationship) {
      return success({ message: "Relationship already removed" });
    }

    if (relationship.status === "accepted") {
      await Promise.all([
        User.updateOne(
          { _id: auth.userId },
          { $inc: { followingCount: -1 } }
        ),
        User.updateOne(
          { _id: userId },
          { $inc: { followersCount: -1 } }
        ),
      ]);
    }

    return success({ message: "Unfollowed or request cancelled" });
  } catch (error) {
    return handleRouteError(error);
  }
}