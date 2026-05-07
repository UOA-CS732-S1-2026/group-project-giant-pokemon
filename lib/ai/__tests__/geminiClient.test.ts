import { describe, expect, it } from "vitest";
import { AIClientError } from "@/lib/ai/errors";
import { generateGeminiContent } from "@/lib/ai/geminiClient";
import type { FetchFunction } from "@/lib/ai/types";

const env = {
    GEMINI_API_KEY: "test-key",
    GEMINI_MODEL: "test-model",
    GEMINI_API_BASE_URL: "https://gemini.test/v1beta",
};

describe("generateGeminiContent", () => {
    it("throws a missing_api_key error when Gemini is not configured", async () => {
        await expect(
            generateGeminiContent(
                { prompt: "Return JSON" },
                { env: { GEMINI_API_KEY: "" } }
            )
        ).rejects.toMatchObject({
            code: "missing_api_key",
        });
    });

    it("calls Gemini and extracts text from the first candidate", async () => {
        const fetchFn: FetchFunction = async (input, init) => {
            expect(String(input)).toBe(
                "https://gemini.test/v1beta/models/test-model:generateContent?key=test-key"
            );
            expect(init?.method).toBe("POST");
            expect(JSON.parse(String(init?.body))).toMatchObject({
                contents: [
                    {
                        role: "user",
                        parts: [{ text: "Return JSON" }],
                    },
                ],
                generationConfig: {
                    responseMimeType: "application/json",
                    temperature: 0.2,
                },
            });

            return jsonResponse({
                candidates: [
                    {
                        content: {
                            parts: [{ text: '{"ok":true}' }],
                        },
                    },
                ],
            });
        };

        await expect(
            generateGeminiContent({ prompt: "Return JSON" }, { env, fetchFn })
        ).resolves.toEqual({
            text: '{"ok":true}',
            provider: "gemini",
            model: "test-model",
        });
    });

    it("maps HTTP failures to request_failed", async () => {
        const fetchFn: FetchFunction = async () =>
            new Response("Nope", { status: 500 });

        await expect(
            generateGeminiContent({ prompt: "Return JSON" }, { env, fetchFn })
        ).rejects.toMatchObject({
            code: "request_failed",
        });
    });

    it("maps missing candidate text to invalid_response", async () => {
        const fetchFn: FetchFunction = async () =>
            jsonResponse({ candidates: [{ content: { parts: [] } }] });

        await expect(
            generateGeminiContent({ prompt: "Return JSON" }, { env, fetchFn })
        ).rejects.toMatchObject({
            code: "invalid_response",
        });
    });

    it("maps aborted requests to timeout", async () => {
        const fetchFn: FetchFunction = async (_input, init) =>
            new Promise((_resolve, reject) => {
                init?.signal?.addEventListener("abort", () => {
                    const error = new Error("Aborted");
                    error.name = "AbortError";
                    reject(error);
                });
            });

        await expect(
            generateGeminiContent(
                { prompt: "Return JSON", timeoutMs: 1 },
                { env, fetchFn }
            )
        ).rejects.toMatchObject({
            code: "timeout",
        });
    });

    it("returns AIClientError instances", async () => {
        try {
            await generateGeminiContent(
                { prompt: "Return JSON" },
                { env: { GEMINI_API_KEY: "" } }
            );
        } catch (error) {
            expect(error).toBeInstanceOf(AIClientError);
        }
    });
});

function jsonResponse(body: unknown) {
    return new Response(JSON.stringify(body), {
        status: 200,
        headers: {
            "Content-Type": "application/json",
        },
    });
}

