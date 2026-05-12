import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { input } = await request.json();
    if (!input?.trim()) {
      return NextResponse.json({ success: false, error: "Input is required" }, { status: 400 });
    }

    const today = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

    const prompt = `Extract tasks from user input. Today=${today}, Tomorrow=${tomorrow}.

Return JSON array only, no markdown:
[{"title":"","description":"","priority":"low|medium|high","estimatedMinutes":60,"deadline":null,"scheduledDate":null,"scheduledStartTime":null,"status":"todo"}]

Rules:
- Extract every task mentioned
- priority: high=urgent/important, low=optional, else medium
- estimatedMinutes: from duration words, default 60, max 480
- deadline: YYYY-MM-DD if due date mentioned, else null
- scheduledDate: YYYY-MM-DD if scheduled day mentioned, else null
- scheduledStartTime: HH:MM 24h if specific time mentioned, else null
- today=${today}, tomorrow=${tomorrow}
- 3pm=15:00, 9am=09:00, 8pm=20:00, noon=12:00

Input: ${input}`;

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.log("DeepSeek error:", errText);
      throw new Error("AI API request failed");
    }

    const aiData = await response.json();
    const rawText = aiData.choices?.[0]?.message?.content?.trim();
    if (!rawText) throw new Error("Empty response from AI");

    const parsed = JSON.parse(rawText.replace(/```json|```/g, "").trim());
    if (!Array.isArray(parsed)) throw new Error("Invalid response format");

    const results = parsed
      .filter((t: any) => t.title?.trim())
      .map((t: any) => ({
        title: String(t.title).trim().slice(0, 200),
        description: String(t.description || "").trim(),
        priority: ["low", "medium", "high"].includes(t.priority) ? t.priority : "medium",
        estimatedMinutes: Number.isInteger(t.estimatedMinutes) && t.estimatedMinutes >= 1 && t.estimatedMinutes <= 480 ? t.estimatedMinutes : 60,
        deadline: t.deadline && /^\d{4}-\d{2}-\d{2}$/.test(t.deadline) ? t.deadline : null,
        scheduledDate: t.scheduledDate && /^\d{4}-\d{2}-\d{2}$/.test(t.scheduledDate) ? t.scheduledDate : null,
        scheduledStartTime: t.scheduledStartTime && /^\d{2}:\d{2}$/.test(t.scheduledStartTime) ? t.scheduledStartTime : null,
        status: "todo",
      }));

    if (results.length === 0) throw new Error("No tasks could be extracted");

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.log("Parse error:", (error as Error).message);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}