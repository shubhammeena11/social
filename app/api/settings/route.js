import User from "@/models/User";
import { connectDB } from "@/lib/mongodb";
import { requireUser, handleRouteError } from "@/lib/route-utils";
import { success, failure, validationFailure } from "@/lib/api-response";
import { postSettingsSchema } from "@/lib/validators";
import { isAcceptedFollowerAudience } from "@/lib/social";

export async function GET() {
  try {
    await connectDB();

    const auth = await requireUser();
    if (auth.response) return auth.response;

    const user = await User.findById(auth.userId).select("postVisibility postAudience");
    if (!user) return failure("User not found", 404);

    return success({
      settings: {
        postVisibility: user.postVisibility || "everyone",
        postAudience: (user.postAudience || []).map(String),
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request) {
  try {
    await connectDB();

    const auth = await requireUser();
    if (auth.response) return auth.response;

    const parsed = postSettingsSchema.safeParse(await request.json());
    if (!parsed.success) return validationFailure(parsed.error);

    const { postVisibility, postAudience } = parsed.data;
    const uniqueAudience = [...new Set(postAudience)];

    if (postVisibility === "custom" && !(await isAcceptedFollowerAudience(auth.userId, uniqueAudience))) {
      return failure("Custom audience must contain only current followers", 400);
    }

    const user = await User.findByIdAndUpdate(
      auth.userId,
      {
        $set: {
          postVisibility,
          postAudience: postVisibility === "custom" ? uniqueAudience : [],
        },
      },
      { new: true, runValidators: true }
    ).select("postVisibility postAudience");

    if (!user) return failure("User not found", 404);

    return success({
      settings: {
        postVisibility: user.postVisibility || "everyone",
        postAudience: (user.postAudience || []).map(String),
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}