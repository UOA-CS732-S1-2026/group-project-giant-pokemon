import { describe, expect, it } from "vitest";
import { runPrompt } from "@/lib/ai/promptRunner";
import type { FetchFunction } from "@/lib/ai/types";

describe("runPrompt", () => {
    it("uses Gemini as the default provider", async () => {
        const fetchFn: FetchFunction = async () =>
            new Response(
                JSON.stringify({
                    candidates: [
                        {
                            content: {
                                parts: [{ text: '{"ok":true}' }],
                            },
                        },
                    ],
                }),
                { status: 200 }
            );

        await expect(
            runPrompt(
                {
                    prompt: "Return JSON",
                },
                {
                    env: {
                        GEMINI_API_KEY: "test-key",
                        GEMINI_MODEL: "test-model",
                    },
                    fetchFn,
                }
            )
        ).resolves.toMatchObject({
            provider: "gemini",
            model: "test-model",
            text: '{"ok":true}',
        });
    });
});

