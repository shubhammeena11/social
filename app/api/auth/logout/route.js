
import { cookies } from "next/headers";
import { success } from "@/lib/api-response";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return success({ message: "Logged out successfully" });
}