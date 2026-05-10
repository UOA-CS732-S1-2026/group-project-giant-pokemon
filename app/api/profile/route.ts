// app/api/profile/route.ts
import { NextResponse } from "next/server";
import User from "@/models/User";
import { dbConnect } from "@/lib/mongodb";
import { verifyToken } from "@/lib/jwt";

export async function PATCH(req: Request) {
  await dbConnect();

  // 1. Read token from cookies
  const cookie = req.headers.get("cookie");
  const token = cookie?.split("token=")[1];

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // 2. Decode token to get user ID
  const decoded = verifyToken(token);
  const userId = decoded.id;

  // 3. Read incoming fields
  const body = await req.json();

  // 4. Update user with $set
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