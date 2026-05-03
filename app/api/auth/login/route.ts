// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import User from "@/models/User";
import { dbConnect } from "@/lib/mongodb";
import { signToken } from "@/lib/jwt";

export async function POST(req: Request) {
  await dbConnect();

  const { email, password } = await req.json();

  const user = await User.findOne({ email });
  if (!user) {
    return NextResponse.json({ message: "Invalid credentials" }, { status: 400 });
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return NextResponse.json({ message: "Invalid credentials" }, { status: 400 });
  }

  const token = signToken({ id: user._id });

  const res = NextResponse.json({ message: "Login successful" });

  res.cookies.set("token", token, {
    httpOnly: true,
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });

  return res;
}