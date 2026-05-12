import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { Goal } from "@/models/Goal";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";

async function getCurrentUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  try {
    const decoded: any = verifyToken(token);
    return decoded.id;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    await dbConnect();
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const goals = await Goal.find({ userId }).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: goals });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const { title, description, status, progress, tags } = body;

    if (!title?.trim()) {
      return NextResponse.json({ success: false, error: "Title is required" }, { status: 400 });
    }

    const goal = await Goal.create({
      title: title.trim(),
      description: description?.trim() || "",
      status: status || "active",
      progress: progress || 0,
      tags: tags || [],
      userId,
    });

    return NextResponse.json({ success: true, data: goal }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}