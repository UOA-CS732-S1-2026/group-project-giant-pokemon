import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import TaskModel from "@/models/Task";
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
    
    const tasks = await TaskModel.find({ 
      userId, 
      status: { $in: ["todo", "in_progress"] }
    }).sort({ createdAt: -1 });
    
    return NextResponse.json({ success: true, data: tasks });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
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
    const { 
      title, 
      description, 
      priority, 
      estimatedMinutes, 
      deadline,
      status = "todo"
    } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { success: false, error: "Title is required" },
        { status: 400 }
      );
    }

    const task = await TaskModel.create({
      title: title.trim(),
      description: description ? description.trim() : "",
      priority: priority || "medium",
      status: status,
      estimatedMinutes: estimatedMinutes || 60,
      deadline: deadline ? new Date(deadline) : null,
      userId: userId,
    });

    return NextResponse.json({ success: true, data: task }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}