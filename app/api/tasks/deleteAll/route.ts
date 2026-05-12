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
    const decoded = verifyToken(token) as { id: string };
    return decoded.id;
  } catch {
    return null;
  }
}

export async function DELETE() {
  try {
    await dbConnect();
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const result = await TaskModel.deleteMany({ userId });
    return NextResponse.json({ success: true, deleted: result.deletedCount });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}