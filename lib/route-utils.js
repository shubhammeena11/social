
import mongoose from "mongoose";
import { connectDB } from "./mongodb";
import { getCurrentUserId } from "./auth";
import { failure } from "./api-response";

export async function requireUser() {
  const userId = await getCurrentUserId();

  if (!userId) {
    return {
      userId: null,
      response: failure("Authentication required", 401),
    };
  }

  await connectDB();

  return { userId, response: null };
}

export function validObjectId(id) {
  return mongoose.isValidObjectId(id);
}

export function handleRouteError(error) {
  if (error?.code === 11000) {
    return failure("A record with these details already exists", 409);
  }

  console.error("API error:", error);

  return failure("Internal server error", 500);
}