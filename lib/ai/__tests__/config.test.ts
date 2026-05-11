import { describe, expect, it } from "vitest";
import {
    DEFAULT_GEMINI_API_BASE_URL,
    DEFAULT_GEMINI_MODEL,
    getGeminiConfig,
} from "@/lib/ai/config";

describe("getGeminiConfig", () => {
    it("uses Gemini defaults when optional config is missing", () => {
        const config = getGeminiConfig({
            GEMINI_API_KEY: "test-key",
        });

        expect(config).toEqual({
            apiKey: "test-key",
            model: DEFAULT_GEMINI_MODEL,
            baseUrl: DEFAULT_GEMINI_API_BASE_URL,
        });
    });

    it("normalizes empty values and strips the base URL trailing slash", () => {
        const config = getGeminiConfig({
            GEMINI_API_KEY: "  ",
            GEMINI_MODEL: " custom-model ",
            GEMINI_API_BASE_URL: "https://example.test/v1beta/",
        });

        expect(config).toEqual({
            apiKey: null,
            model: "custom-model",
            baseUrl: "https://example.test/v1beta",
        });
    });
});

