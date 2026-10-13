
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { objectIdSchema } from "./validators";

export async function getCurrentUserId() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  let cookieStore;

  try {
    cookieStore = await cookies();
  } catch {
    return null;
  }

  const token = cookieStore.get("token")?.value;
  if (!token) return null;

  try {
    const payload = jwt.verify(token, secret);

    if (
      typeof payload !== "object" ||
      !payload.userId ||
      !objectIdSchema.safeParse(payload.userId).success
    ) {
      return null;
    }

    return payload.userId;
  } catch {
    return null;
  }
}