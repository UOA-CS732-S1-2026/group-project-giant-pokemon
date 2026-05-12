import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { Goal } from "@/models/Goal";
import mongoose from "mongoose";
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

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: RouteContext) {
  try {
    await dbConnect();
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "Invalid goal id" }, { status: 400 });
    }

    const body = await request.json();
    const { title, description, status, progress, tags } = body;
    const update: any = {};
    if (title !== undefined) update.title = title.trim();
    if (description !== undefined) update.description = description.trim();
    if (status !== undefined) update.status = status;
    if (progress !== undefined) update.progress = progress;
    if (tags !== undefined) update.tags = tags;

    const goal = await Goal.findOneAndUpdate({ _id: id, userId }, update, { new: true, runValidators: true });
    if (!goal) return NextResponse.json({ success: false, error: "Goal not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: goal });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    await dbConnect();
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "Invalid goal id" }, { status: 400 });
    }

    const result = await Goal.findOneAndDelete({ _id: id, userId });
    if (!result) return NextResponse.json({ success: false, error: "Goal not found" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}