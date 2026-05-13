export const DEFAULT_GEMINI_MODEL = "gemini-3-flash-preview";
export const DEFAULT_GEMINI_API_BASE_URL =
    "https://generativelanguage.googleapis.com/v1beta";

export type GeminiConfig = {
    apiKey: string | null;
    model: string;
    baseUrl: string;
};

export type AIEnv = {
    [key: string]: string | undefined;
    GEMINI_API_KEY?: string;
    GEMINI_MODEL?: string;
    GEMINI_API_BASE_URL?: string;
};

export function getGeminiConfig(env: AIEnv = process.env): GeminiConfig {
    return {
        apiKey: normalizeOptionalEnv(env.GEMINI_API_KEY),
        model: normalizeOptionalEnv(env.GEMINI_MODEL) ?? DEFAULT_GEMINI_MODEL,
        baseUrl: stripTrailingSlash(
            normalizeOptionalEnv(env.GEMINI_API_BASE_URL) ??
                DEFAULT_GEMINI_API_BASE_URL
        ),
    };
}

function normalizeOptionalEnv(value: string | undefined) {
    const normalized = value?.trim();
    return normalized ? normalized : null;
}

function stripTrailingSlash(value: string) {
    return value.replace(/\/+$/, "");
}
