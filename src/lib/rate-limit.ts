import { createHash } from "node:crypto";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
};

type RateLimitOptions = {
  identifier: string;
  limit: number;
  namespace: string;
  windowMs: number;
};

const MAX_ENTRIES = 10_000;

const globalForRateLimit = globalThis as typeof globalThis & {
  portalRateLimitStore?: Map<string, RateLimitEntry>;
};

const rateLimitStore =
  globalForRateLimit.portalRateLimitStore ?? new Map<string, RateLimitEntry>();

if (process.env.NODE_ENV !== "production") {
  globalForRateLimit.portalRateLimitStore = rateLimitStore;
}

export function checkRateLimit({
  identifier,
  limit,
  namespace,
  windowMs,
}: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const key = `${namespace}:${identifier}`;
  const current = rateLimitStore.get(key);

  if (!current || current.resetAt <= now) {
    ensureStoreCapacity(now);
    const resetAt = now + windowMs;
    rateLimitStore.set(key, { count: 1, resetAt });

    return createResult(1, limit, resetAt, now);
  }

  current.count += 1;
  rateLimitStore.delete(key);
  rateLimitStore.set(key, current);

  return createResult(current.count, limit, current.resetAt, now);
}

export function getClientIp(headers: Headers) {
  const forwardedFor = headers.get("x-forwarded-for")?.split(",")[0]?.trim();

  return (
    forwardedFor ||
    headers.get("cf-connecting-ip")?.trim() ||
    headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

export function hashRateLimitIdentifier(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function getRateLimitHeaders(result: RateLimitResult) {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };

  if (!result.allowed) {
    headers["Retry-After"] = String(result.retryAfterSeconds);
  }

  return headers;
}

function createResult(
  count: number,
  limit: number,
  resetAt: number,
  now: number,
): RateLimitResult {
  return {
    allowed: count <= limit,
    limit,
    remaining: Math.max(0, limit - count),
    resetAt,
    retryAfterSeconds: Math.max(1, Math.ceil((resetAt - now) / 1000)),
  };
}

function ensureStoreCapacity(now: number) {
  if (rateLimitStore.size < MAX_ENTRIES) {
    return;
  }

  for (const [key, entry] of rateLimitStore) {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }

  while (rateLimitStore.size >= MAX_ENTRIES) {
    const oldestKey = rateLimitStore.keys().next().value;

    if (typeof oldestKey !== "string") {
      break;
    }

    rateLimitStore.delete(oldestKey);
  }
}
