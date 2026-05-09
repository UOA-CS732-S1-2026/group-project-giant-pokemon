import { describe, expect, it } from "vitest";
import { extractFencedJson, parseAIJson } from "@/lib/ai/json";

describe("parseAIJson", () => {
    it("parses direct JSON", () => {
        expect(parseAIJson('{"ok":true}')).toEqual({ ok: true });
    });

    it("parses fenced JSON", () => {
        expect(parseAIJson('```json\n{"ok":true}\n```')).toEqual({ ok: true });
    });

    it("does not parse arbitrary natural language", () => {
        expect(() => parseAIJson("Here is the answer: { ok: true }")).toThrow(
            "AI response did not contain valid JSON."
        );
    });
});

describe("extractFencedJson", () => {
    it("returns the first fenced JSON body", () => {
        expect(extractFencedJson("```json\n{\"a\":1}\n```")).toBe('{"a":1}');
    });

    it("returns null when there is no fenced block", () => {
        expect(extractFencedJson('{"a":1}')).toBeNull();
    });
});

