import { NextResponse } from "next/server";
import User from "@/models/User";
import { dbConnect } from "@/lib/mongodb";
import { verifyToken } from "@/lib/jwt";
import { cookies } from "next/headers";

export async function PATCH(req: Request) {
  await dbConnect();

  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const decoded = verifyToken(token) as { id: string };
  const userId = decoded.id;

  const body = await req.json();

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        name: body.name,
        role: body.role,
        profilePhoto: body.profilePhoto,
      },
    },
    { new: true }
  );

  return NextResponse.json({
    message: "Profile updated",
    user: updatedUser,
  });
}