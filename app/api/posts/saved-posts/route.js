import SavedPost from "@/models/SavedPost";
import { connectDB } from "@/lib/mongodb";
import { requireUser, handleRouteError } from "@/lib/route-utils";
import { success } from "@/lib/api-response";

export async function GET() {
try {
await connectDB();

const auth = await requireUser();
if (auth.response) return auth.response;

const savedPosts = await SavedPost.find({
  user: auth.userId,
})
  .populate({
    path: "post",
    populate: {
      path: "author",
      select: "name username avatar isPrivate",
    },
  })
  .sort({ createdAt: -1 });

// Exclude saved-post records whose original post no longer exists.
const posts = savedPosts
  .filter((item) => item.post != null)
  .map((item) => item.post);

return success({
  posts,
  total: posts.length,
});


} catch (error) {
return handleRouteError(error);
}
}
