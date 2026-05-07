import { getGeminiConfig } from "@/lib/ai/config";
import { AIClientError } from "@/lib/ai/errors";
import type { AIRequest, AIResult, FetchFunction } from "@/lib/ai/types";

const DEFAULT_TEMPERATURE = 0.2;
const DEFAULT_RESPONSE_MIME_TYPE = "application/json";
const DEFAULT_THINKING_LEVEL = "low";
const DEFAULT_TIMEOUT_MS = 60_000;

type GeminiClientOptions = {
    env?: Parameters<typeof getGeminiConfig>[0];
    fetchFn?: FetchFunction;
};

type GeminiGenerateContentResponse = {
    candidates?: Array<{
        content?: {
            parts?: Array<{
                text?: string;
            }>;
        };
    }>;
};

export async function generateGeminiContent(
    request: AIRequest,
    options: GeminiClientOptions = {}
): Promise<AIResult> {
    const config = getGeminiConfig(options.env);

    if (!config.apiKey) {
        throw new AIClientError(
            "missing_api_key",
            "GEMINI_API_KEY is not configured."
        );
    }

    const fetchFn = options.fetchFn ?? globalThis.fetch;

    if (!fetchFn) {
        throw new AIClientError("request_failed", "fetch is not available.");
    }

    const model = request.model?.trim() || config.model;
    const timeoutMs = request.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetchFn(buildGeminiUrl(config.baseUrl, model, config.apiKey), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                contents: [
                    {
                        role: "user",
                        parts: [{ text: request.prompt }],
                    },
                ],
                generationConfig: {
                    responseMimeType:
                        request.responseMimeType ?? DEFAULT_RESPONSE_MIME_TYPE,
                    temperature: request.temperature ?? DEFAULT_TEMPERATURE,
                    thinkingConfig: {
                        thinkingLevel: request.thinkingLevel ?? DEFAULT_THINKING_LEVEL,
                    },
                },
            }),
            signal: controller.signal,
        });

        if (!response.ok) {
            throw new AIClientError(
                "request_failed",
                `Gemini request failed with status ${response.status}.`
            );
        }

        const payload = await parseResponseJson(response);
        const text = extractGeminiText(payload);

        return {
            text,
            provider: "gemini",
            model,
        };
    } catch (error) {
        if (error instanceof AIClientError) {
            throw error;
        }

        if (error instanceof Error && error.name === "AbortError") {
            throw new AIClientError("timeout", "Gemini request timed out.");
        }

        throw new AIClientError("request_failed", "Gemini request failed.", error);
    } finally {
        clearTimeout(timeout);
    }
}

function buildGeminiUrl(baseUrl: string, model: string, apiKey: string) {
    const modelPath = model.startsWith("models/") ? model : `models/${model}`;
    return `${baseUrl}/${modelPath}:generateContent?key=${encodeURIComponent(apiKey)}`;
}

async function parseResponseJson(response: Response) {
    try {
        return (await response.json()) as GeminiGenerateContentResponse;
    } catch (error) {
        throw new AIClientError(
            "invalid_response",
            "Gemini response was not valid JSON.",
            error
        );
    }
}

function extractGeminiText(payload: GeminiGenerateContentResponse) {
    const text = payload.candidates?.[0]?.content?.parts
        ?.map((part) => part.text?.trim())
        .filter(Boolean)
        .join("\n")
        .trim();

    if (!text) {
        throw new AIClientError(
            "invalid_response",
            "Gemini response did not include text content."
        );
    }

    return text;
}
