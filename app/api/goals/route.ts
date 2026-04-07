import { dbConnect } from "@/lib/mongodb";
import Goal from "@/models/Goal";

export async function POST (request: Request) {
    try {
        await dbConnect();
        const body = await request.json();
        const { title, description, status, targetDate, progress, tags } = body;

        // Basic validation for required fields
        if (!title || typeof title !== 'string' || !title.trim()){
            return Response.json(
                { success: false, error: "Title is required and must be a non-empty string." },
                { status: 400 }
            );
        }

        const newGoal = await Goal.create({
            title: title.trim(),
            description: description ? description.trim() : '',
            status: status || 'active',
            targetDate: targetDate ? new Date(targetDate) : undefined,
            progress: typeof progress === 'number' ? progress : 0,
            tags: Array.isArray(tags) ? tags : [],
        });

        return Response.json(
            { success: true, data: newGoal },
            { status: 201 }
        );
    } catch (error) {
        return Response.json(
            { success: false, error: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}   

export async function GET () {
    try {
        await dbConnect();
        const goals = await Goal.find().sort({ createdAt: -1 });

        return Response.json(
            { success: true, data: goals },
            { status: 200 }
        );
    } catch (error) {
        return Response.json(
            { success: false, error: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}   

