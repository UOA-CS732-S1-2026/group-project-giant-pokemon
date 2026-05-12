import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import TaskModel from "@/models/Task";
import mongoose from "mongoose";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";

type AuthTokenPayload = {
  id?: string;
};

type TaskUpdateData = {
  title?: string;
  description?: string;
  priority?: "low" | "medium" | "high";
  status?: "todo" | "in_progress" | "completed";
  estimatedMinutes?: number;
  deadline?: Date | null;
};

async function getCurrentUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;

  try {
    const decoded = verifyToken(token) as AuthTokenPayload;
    return decoded.id ?? null;
  } catch {
    return null;
  }
}

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  try {
    await dbConnect();
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    
    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "Invalid task id" }, { status: 400 });
    }

    const body = await request.json();
    const { title, description, priority, status, estimatedMinutes, deadline } = body;

    const updateData: TaskUpdateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) updateData.status = status;
    if (estimatedMinutes !== undefined) updateData.estimatedMinutes = estimatedMinutes;
    if (deadline !== undefined) updateData.deadline = deadline ? new Date(deadline) : null;

    const task = await TaskModel.findOneAndUpdate(
      { _id: id, userId: userId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!task) {
      return NextResponse.json({ success: false, error: "Task not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: task });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    await dbConnect();
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    
    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "Invalid task id" }, { status: 400 });
    }

    const result = await TaskModel.findOneAndDelete({ _id: id, userId: userId });

    if (!result) {
      return NextResponse.json({ success: false, error: "Task not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
