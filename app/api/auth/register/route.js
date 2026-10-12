
import bcrypt from "bcryptjs";
import User from "@/models/User";
import { connectDB } from "@/lib/mongodb";
import { registerSchema } from "@/lib/validators";
import { success, failure, validationFailure } from "@/lib/api-response";
import { handleRouteError } from "@/lib/route-utils";

export async function POST(request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return validationFailure(parsed.error);
    }

    await connectDB();

    const { name, username, email, password } = parsed.data;

    const existing = await User.findOne({
      $or: [{ email }, { username }],
    }).select("_id email username");

    if (existing) {
      return failure("Email or username is already taken", 409);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      username,
      email,
      password: hashedPassword,
    });

    return success({
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
      },
    }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}