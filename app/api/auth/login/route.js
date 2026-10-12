
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import User from "@/models/User";
import { connectDB } from "@/lib/mongodb";
import { loginSchema } from "@/lib/validators";
import { success, failure, validationFailure } from "@/lib/api-response";
import { handleRouteError } from "@/lib/route-utils";

export async function POST(request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return validationFailure(parsed.error);
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }

    await connectDB();

    const user = await User.findOne({
      email: parsed.data.email,
    }).select("+password");

    if (
      !user ||
      !(await bcrypt.compare(parsed.data.password, user.password))
    ) {
      return failure("Invalid email or password", 401);
    }

    const token = jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: "1d", algorithm: "HS256" }
    );

    const cookieStore = await cookies();

    cookieStore.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return success({
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}