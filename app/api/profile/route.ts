// app/api/profile/route.ts
import { NextResponse } from "next/server";
import User from "@/models/User";
import { dbConnect } from "@/lib/mongodb";
import { verifyToken } from "@/lib/jwt";
import { cookies } from "next/headers";

export async function PATCH(req: Request) {
  await dbConnect();

  // 1. Read token using next/headers
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // 2. Decode token to get user ID
  const decoded = verifyToken(token) as { id: string };
  const userId = decoded.id;

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // 3. Read incoming fields
  const body = await req.json();

  // 4. Update user
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        name: body.name,
        role: body.role,
        mainGoal: body.mainGoal,
        startTime: body.startTime,
        endTime: body.endTime,
        workload: body.workload,
        focusStyle: body.focusStyle,
        breakPref: body.breakPref,
        motivation: body.motivation,
        priority: body.priority,
        scheduleStyle: body.scheduleStyle
      }
    },
    { new: true }
  );

  return NextResponse.json({
    message: "Profile updated",
    user: updatedUser
  });
}