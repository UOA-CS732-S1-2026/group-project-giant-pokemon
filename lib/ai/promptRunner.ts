import { AIClientError } from "@/lib/ai/errors";
import { generateGeminiContent } from "@/lib/ai/geminiClient";
import type { AIEnv } from "@/lib/ai/config";
import type { AIRequest, AIResult, FetchFunction } from "@/lib/ai/types";

type PromptRunnerOptions = {
    env?: AIEnv;
    fetchFn?: FetchFunction;
};

export async function runPrompt(
    request: AIRequest,
    options: PromptRunnerOptions = {}
): Promise<AIResult> {
    const provider = request.provider ?? "gemini";

    switch (provider) {
        case "gemini":
            return generateGeminiContent(
                {
                    ...request,
                    provider,
                },
                options
            );
        default:
            throw new AIClientError(
                "request_failed",
                `Unsupported AI provider: ${provider satisfies never}`
            );
    }
}
