import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import ScheduleBlock from "@/models/ScheduleBlock";
import { Goal } from "@/models/Goal";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";

const rateLimitMap = new Map<string, { 
  minuteCount: number; 
  minuteResetAt: number;
  dayCount: number;
  dayResetAt: number;
}>();

const MINUTE_LIMIT = 10;
const DAY_LIMIT = 50;
const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function checkRateLimit(userId: string): { allowed: boolean; reason?: string } {
  const now = Date.now();
  const entry = rateLimitMap.get(userId) ?? {
    minuteCount: 0, minuteResetAt: now + MINUTE_MS,
    dayCount: 0, dayResetAt: now + DAY_MS,
  };

  if (now > entry.minuteResetAt) {
    entry.minuteCount = 0;
    entry.minuteResetAt = now + MINUTE_MS;
  }
  if (now > entry.dayResetAt) {
    entry.dayCount = 0;
    entry.dayResetAt = now + DAY_MS;
  }

  if (entry.minuteCount >= MINUTE_LIMIT) {
    return { allowed: false, reason: "Too many requests. Please wait a moment." };
  }
  if (entry.dayCount >= DAY_LIMIT) {
    return { allowed: false, reason: "Daily limit reached. Try again tomorrow." };
  }

  entry.minuteCount += 1;
  entry.dayCount += 1;
  rateLimitMap.set(userId, entry);
  return { allowed: true };
}

// Helper to convert "09:00 AM" to "09:00"
function convertTo24Hour(time12h: string): string {
  if (!time12h) return "09:00";
  const match = time12h.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return "09:00";
  let hour = parseInt(match[1]);
  const minute = match[2];
  const period = match[3].toUpperCase();
  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;
  return `${hour.toString().padStart(2, "0")}:${minute}`;
}

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

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

function getFreeSlots(
  blocks: { startTime: string; endTime: string }[],
  workStart: string,
  workEnd: string
): { start: string; end: string; minutes: number }[] {
  const dayStart = timeToMinutes(workStart);
  const dayEnd = timeToMinutes(workEnd);

  const occupied = blocks
    .map(b => ({ start: timeToMinutes(b.startTime), end: timeToMinutes(b.endTime) }))
    .filter(r => r.start < r.end)
    .sort((a, b) => a.start - b.start);

  const free: { start: string; end: string; minutes: number }[] = [];
  let cursor = dayStart;

  for (const slot of occupied) {
    if (slot.start > cursor) {
      const gap = slot.start - cursor;
      if (gap >= 30) {
        free.push({ start: minutesToTime(cursor), end: minutesToTime(slot.start), minutes: gap });
      }
    }
    cursor = Math.max(cursor, slot.end);
  }

  if (cursor < dayEnd) {
    const gap = dayEnd - cursor;
    if (gap >= 30) {
      free.push({ start: minutesToTime(cursor), end: minutesToTime(dayEnd), minutes: gap });
    }
  }

  return free;
}

async function callDeepSeek(prompt: string): Promise<string> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          max_tokens: 800,
        }),
      });

      if (!response.ok) {
        if (attempt === 3) throw new Error("AI API request failed");
        await new Promise(r => setTimeout(r, 500 * attempt));
        continue;
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content?.trim();
      if (!text) throw new Error("Empty response");
      return text;
    } catch (err) {
      if (attempt === 3) throw err;
      await new Promise(r => setTimeout(r, 500 * attempt));
    }
  }
  throw new Error("AI API request failed");
}

export async function GET(request: Request) {
  try {
    await dbConnect();
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    
    const { allowed, reason } = checkRateLimit(userId);
    if (!allowed) {
      return NextResponse.json({ success: false, error: reason }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ success: false, error: "Date required (YYYY-MM-DD)" }, { status: 400 });
    }

    // Get user with preferences
    const User = (await import("@/models/User")).default;
    const user = await User.findById(userId);
    
    // Get user's preferred work hours (default 09:00 - 17:00)
    const workStart = user?.startTime ? convertTo24Hour(user.startTime) : "09:00";
    const workEnd = user?.endTime ? convertTo24Hour(user.endTime) : "17:00";

    // Get user's planning preferences
    const workload = user?.workload || "Balanced";
    const focusStyle = user?.focusStyle || "Deep Work";
    const breakPref = user?.breakPref || "15 minutes";
    const mainGoal = user?.mainGoal || "Not specified";

    // Query ONLY blocks within user's preferred working hours
    // This prevents AI from ever seeing tasks outside work hours
    const blocks = await ScheduleBlock.find({
      userId,
      date,
      startTime: { $gte: workStart },
      endTime: { $lte: workEnd },
    }).sort({ startTime: 1 });

    const [goals] = await Promise.all([
      Goal.find({ userId, status: "active" }).select("title description").limit(10),
    ]);

    const freeSlots = getFreeSlots(blocks, workStart, workEnd);

    if (freeSlots.length === 0) {
      return NextResponse.json({ success: true, data: { freeSlots: [], suggestions: [] } });
    }

    const goalsText = goals.length > 0
    ? goals.map((g: { title: string; description?: string }) => `- ${g.title}${g.description ? `: ${g.description}` : ""}`).join("\n")
    : "No goals set.";

    // Build prompt - AI only returns suggestion content, no slot or duration
    const freeSlotsDescription = freeSlots.map((s, i) => 
      `${i+1}. ${s.start}-${s.end} (${(s.minutes / 60).toFixed(1)}h)`
    ).join("\n");

    const prompt = `You are a productivity and wellness advisor. Suggest what the person could do in their free time.

USER PREFERENCES:
- Working hours: ${workStart} - ${workEnd}
- Workload capacity: ${workload}
- Focus style: ${focusStyle}
- Break preference: ${breakPref}
- Main goal: ${mainGoal}

USER'S GOALS:
${goalsText}

FREE SLOTS TODAY (THESE ARE THE ONLY SLOTS AVAILABLE - DO NOT INVENT ANY OTHER TIMES):
${freeSlotsDescription}

For EACH free slot above IN ORDER, return ONE suggestion.
Return ONLY a JSON array, no markdown, no extra text:
[{"suggestion":"your specific actionable suggestion","category":"rest|exercise|learning|social|creative|mindfulness"}]

RULES:
- Match activity length to the slot duration
- Tie suggestions to user's goals whenever possible
- Be specific and actionable
- Consider user's workload and focus style
- DO NOT include "slot" or "duration" in the response`;

    const rawText = await callDeepSeek(prompt);
    const cleaned = rawText.replace(/```json|```/g, "").trim();
    const aiSuggestions = JSON.parse(cleaned);

    // Pair AI suggestions with actual free slots
    const suggestions = freeSlots.map((slot, index) => {
      const aiSuggestion = (aiSuggestions[index] || {}) as { suggestion?: string; category?: string };
      return {
        slot: `${slot.start}-${slot.end}`,
        duration: `${(slot.minutes / 60).toFixed(1)}h`,
        suggestion: aiSuggestion.suggestion || "Take a break and recharge",
        category: aiSuggestion.category || "rest",
      };
    });

    return NextResponse.json({ success: true, data: { freeSlots, suggestions } });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}