import User from "@/models/User";
import { connectDB } from "@/lib/mongodb";
import { requireUser, handleRouteError } from "@/lib/route-utils";
import { success } from "@/lib/api-response";

export async function GET(request) {
  try {
    await connectDB();

    const auth = await requireUser();
    if (auth.response) return auth.response;

    const query = new URL(request.url).searchParams.get("q")?.trim().slice(0, 50) || "";
    if (!query) return success({ users: [] });

    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const users = await User.find({
      $or: [
        { username: { $regex: escapedQuery, $options: "i" } },
        { name: { $regex: escapedQuery, $options: "i" } },
      ],
    })
      .select("name username avatar isPrivate")
      .sort({ username: 1 })
      .limit(20);

    return success({ users });
  } catch (error) {
    return handleRouteError(error);
  }
}