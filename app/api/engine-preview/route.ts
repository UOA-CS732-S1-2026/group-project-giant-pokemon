import { generateAISchedule, generateRuleSchedule } from "@/lib/scheduleEngine";

export async function POST(request: Request) {
    const body = await request.json();

    const input = {
        date: body.date,
        tasks: body.tasks,
        occupiedBlocks: body.occupiedBlocks ?? [],
        instruction: body.instruction,
        window: body.window,
    };

    const result = body.mode === "ai"
        ? await generateAISchedule(input)
        : generateRuleSchedule(input);

    return Response.json({
        success: true,
        data: result.blocks,
        meta: result.meta,
    });
}