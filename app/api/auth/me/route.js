
import User from "@/models/User";
import { requireUser, handleRouteError } from "@/lib/route-utils";
import { success, failure } from "@/lib/api-response";

export async function GET() {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;

    const user = await User.findById(auth.userId).select(
      "name username email bio avatar isPrivate followersCount followingCount postsCount createdAt"
    );

    if (!user) return failure("User not found", 404);

    return success({ user });
  } catch (error) {
    return handleRouteError(error);
  }
}