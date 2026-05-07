export type AIErrorCode =
    | "missing_api_key"
    | "request_failed"
    | "timeout"
    | "invalid_response";

export class AIClientError extends Error {
    code: AIErrorCode;
    details?: unknown;

    constructor(code: AIErrorCode, message: string, details?: unknown) {
        super(message);
        this.name = "AIClientError";
        this.code = code;
        this.details = details;
    }
}

export function isAIClientError(error: unknown): error is AIClientError {
    return error instanceof AIClientError;
}

