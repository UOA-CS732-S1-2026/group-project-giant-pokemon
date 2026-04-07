import { dbConnect } from "@/lib/mongodb";
import Goal from "@/models/Goal";
import mongoose from "mongoose";

// Define the expected shape of route parameters
type RouteContext = {
    params: Promise<{ id: string }>;
};

export async function DELETE (
    req: Request, 
    context: RouteContext) {
        try {
            await dbConnect();

            const { id } = await context.params;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return Response.json(
                    { success: false, error: "Invalid goal id." },
                    { status: 400 }
                );
            }

            const deletedGoal = await Goal.findByIdAndDelete(id);

            if(!deletedGoal) {
                return Response.json(
                    { success: false, error: "Goal not found." },
                    { status: 404 }
                );
            }
            
            return Response.json(
                { success: true, data: deletedGoal },
                { status: 200 }
            );
        } catch (error) {
            return Response.json(
                { success: false, error: error instanceof Error ? error.message : String(error) },
                { status: 500 }
            );
        }
    }

export async function PUT (
    req: Request, 
    context: RouteContext) {
        try {
            await dbConnect();

            const { id } = await context.params;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return Response.json(
                    { success: false, error: "Invalid goal id." },
                    { status: 400 }
                );
            }

            const body = await req.json();
            const { title, description, status, targetDate, progress, tags } = body;

            if(!title || typeof title !== 'string' || !title.trim()) {
                return Response.json(
                    { success: false, error: "Title is required and must be a non-empty string." },
                    { status: 400 }
                );
            }

            const updatedGoal = await Goal.findByIdAndUpdate(
                id,
                {
                    title: title.trim(),
                    description: description ? description.trim() : '',
                    status: status || 'active',
                    targetDate: targetDate ? new Date(targetDate) : undefined,
                    progress: typeof progress === 'number' ? progress : 0,
                    tags: Array.isArray(tags) ? tags : [],
                },
                { 
                    new: true,
                    runValidators: true,
                 }
            );

            if(!updatedGoal) {
                return Response.json(
                    { success: false, error: "Goal not found." },
                    { status: 404 }
                );
            }
            
            return Response.json(
                { success: true, data: updatedGoal },
                { status: 200 }
            );
        } catch (error) {
            return Response.json(
                { success: false, error: error instanceof Error ? error.message : String(error) },
                { status: 500 }
            );
        }
    
    }

