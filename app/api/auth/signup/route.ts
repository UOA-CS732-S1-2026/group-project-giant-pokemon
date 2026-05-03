import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";
import { signToken } from "@/lib/jwt";
import { validatePassword } from "@/lib/validatePassword";

export async function POST(req: Request) {
  try {
    await dbConnect();

    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ message: "Missing fields" }, { status: 400 });
    }

    // Password validation
    const passwordError = validatePassword(password);
    if (passwordError) {
      return NextResponse.json({ message: passwordError }, { status: 400 });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ message: "Email already exists" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({ name, email, passwordHash });

    const token = signToken({ userId: user._id });

    const res = NextResponse.json({ message: "Success" }, { status: 200 });
    res.cookies.set("token", token, { httpOnly: true, secure: true, path: "/" });

    return res;
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}