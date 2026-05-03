import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";
import { verifyToken } from "@/lib/jwt";

export async function PATCH(req: Request) {
  try {
    await dbConnect();

    const cookie = req.headers.get("cookie") || "";
    const token = cookie.split("token=")[1]?.split(";")[0];

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const decoded: any = verifyToken(token);

    const { name } = await req.json();

    const updated = await User.findByIdAndUpdate(
      decoded.id, // FIXED
      { name },
      { new: true }
    ).select("-passwordHash");

    return NextResponse.json(updated, { status: 200 });
  } catch (err) {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}