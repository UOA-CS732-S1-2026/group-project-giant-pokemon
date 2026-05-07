import { AIClientError } from "@/lib/ai/errors";

const fencedJsonPattern = /```(?:json)?\s*([\s\S]*?)```/i;

export function parseAIJson<T = unknown>(text: string): T {
    const direct = tryParseJson<T>(text);

    if (direct.ok) {
        return direct.value;
    }

    const fencedJson = extractFencedJson(text);

    if (fencedJson) {
        const fenced = tryParseJson<T>(fencedJson);

        if (fenced.ok) {
            return fenced.value;
        }
    }

    throw new AIClientError(
        "invalid_response",
        "AI response did not contain valid JSON."
    );
}

export function extractFencedJson(text: string): string | null {
    const match = text.match(fencedJsonPattern);
    return match?.[1]?.trim() ?? null;
}

function tryParseJson<T>(text: string): { ok: true; value: T } | { ok: false } {
    try {
        return { ok: true, value: JSON.parse(text) as T };
    } catch {
        return { ok: false };
    }
}

