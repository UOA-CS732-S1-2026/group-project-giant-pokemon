export type AIProvider = "gemini";

export type AIResponseMimeType = "application/json" | "text/plain";

export type AIThinkingLevel = "low" | "medium" | "high";

export type AIRequest = {
    provider?: AIProvider;
    prompt: string;
    temperature?: number;
    responseMimeType?: AIResponseMimeType;
    thinkingLevel?: AIThinkingLevel;
    timeoutMs?: number;
    model?: string;
};

export type AIResult = {
    text: string;
    provider: AIProvider;
    model: string;
};

export type FetchFunction = (
    input: string | URL | Request,
    init?: RequestInit
) => Promise<Response>;
