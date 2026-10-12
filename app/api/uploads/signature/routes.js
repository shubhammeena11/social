
import { requireUser, handleRouteError } from "@/lib/route-utils";
import { success, failure, validationFailure } from "@/lib/api-response";
import cloudinary from "@/lib/cloudinary";
import { z } from "zod";

const schema = z.object({
  resourceType: z.enum(["image", "video"]),
}).strict();

export async function POST(request) {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return validationFailure(parsed.error);

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = `social-media/${auth.userId}`;

    const params = {
      timestamp,
      folder,
    };

    const signature = cloudinary.utils.api_sign_request(
      params,
      process.env.CLOUDINARY_API_SECRET
    );

    return success({
      timestamp,
      folder,
      signature,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      resourceType: parsed.data.resourceType,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}