import { getEnvVariable } from "./envUtils";

/**
 * HTTP behaviour shared by every request made by the library (metadata and downloads).
 */
export interface HttpOptions {
    /** Per-request timeout in milliseconds (socket inactivity for downloads). */
    timeoutMs: number;
    /** Number of retries after the first attempt for transient errors. */
    retries: number;
    /** Base delay of the exponential backoff in milliseconds (doubled at each retry, with jitter). */
    retryBaseDelayMs: number;
    /** Upper bound of a single backoff delay in milliseconds. */
    retryMaxDelayMs: number;
}

function envInt(name: string, fallback: number): number {
    const value = Number.parseInt(getEnvVariable(name, ""), 10);
    return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function defaults(): HttpOptions {
    return {
        timeoutMs: envInt("NM_HTTP_TIMEOUT_MS", 30000),
        retries: envInt("NM_HTTP_RETRIES", 3),
        retryBaseDelayMs: envInt("NM_HTTP_RETRY_BASE_DELAY_MS", 500),
        retryMaxDelayMs: envInt("NM_HTTP_RETRY_MAX_DELAY_MS", 10000),
    };
}

let current: HttpOptions = defaults();

/**
 * Override the HTTP options for all subsequent requests (merged with the current ones).
 * Defaults come from `NM_HTTP_TIMEOUT_MS`, `NM_HTTP_RETRIES`, `NM_HTTP_RETRY_BASE_DELAY_MS`
 * and `NM_HTTP_RETRY_MAX_DELAY_MS`, or 30000 / 3 / 500 / 10000.
 */
export function configureHttp(options: Partial<HttpOptions>): void {
    current = { ...current, ...options };
}

/** Restore the defaults (environment variables or built-in values). */
export function resetHttpOptions(): void {
    current = defaults();
}

export function getHttpOptions(): HttpOptions {
    return { ...current };
}

const RETRYABLE_CODES = new Set([
    "ECONNRESET", "ECONNREFUSED", "ECONNABORTED", "ETIMEDOUT", "EPIPE",
    "EAI_AGAIN", "ENETUNREACH", "EHOSTUNREACH", "ERR_SOCKET_CONNECTION_TIMEOUT",
]);

/**
 * Whether an error is worth retrying: network-level errors, timeouts, HTTP 408, 429 and 5xx.
 * Other HTTP errors (404, 403...) and application errors (hash mismatch, invalid data) are not.
 */
export function isRetryableError(error: unknown): boolean {
    const err = error as { code?: string; response?: { status?: number } } | null;
    if (!err || typeof err !== "object") {
        return false;
    }

    const status = err.response?.status;
    if (typeof status === "number") {
        return status === 408 || status === 429 || status >= 500;
    }

    return typeof err.code === "string" && RETRYABLE_CODES.has(err.code);
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Run `fn`, retrying transient failures with exponential backoff and jitter.
 *
 * @param fn - The operation to run. It is called again from scratch on each attempt.
 * @param label - Used in retry log lines.
 */
export async function withRetry<T>(fn: () => Promise<T>, label: string = "request"): Promise<T> {
    const { retries, retryBaseDelayMs, retryMaxDelayMs } = current;

    for (let attempt = 0; ; attempt++) {
        try {
            return await fn();
        } catch (error) {
            if (attempt >= retries || !isRetryableError(error)) {
                throw error;
            }

            const exp = Math.min(retryMaxDelayMs, retryBaseDelayMs * 2 ** attempt);
            const delay = Math.round(exp / 2 + Math.random() * (exp / 2));
            console.warn(`Retrying ${label} in ${delay} ms (attempt ${attempt + 2}/${retries + 1})`);
            await sleep(delay);
        }
    }
}

/**
 * Map `items` with at most `limit` calls of `fn` in flight. Results keep the input order.
 * Each result is either `{ ok: true, value }` or `{ ok: false, error }`; `fn` errors never reject.
 */
export async function mapWithConcurrency<I, O>(
    items: I[],
    limit: number,
    fn: (item: I, index: number) => Promise<O>,
): Promise<Array<{ ok: true; value: O } | { ok: false; error: unknown }>> {
    const results: Array<{ ok: true; value: O } | { ok: false; error: unknown }> = new Array(items.length);
    const workers = Math.max(1, Math.min(Math.floor(limit) || 1, items.length));
    let next = 0;

    async function worker(): Promise<void> {
        while (next < items.length) {
            const index = next++;
            try {
                results[index] = { ok: true, value: await fn(items[index], index) };
            } catch (error) {
                results[index] = { ok: false, error };
            }
        }
    }

    await Promise.all(Array.from({ length: workers }, () => worker()));
    return results;
}
