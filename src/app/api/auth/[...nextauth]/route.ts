import NextAuth from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import {
  checkRateLimit,
  getClientIp,
  getRateLimitHeaders,
  hashRateLimitIdentifier,
  type RateLimitResult,
} from "@/lib/rate-limit";

const handler = NextAuth(authOptions);

type NextAuthRouteContext = {
  params: Promise<{ nextauth: string[] }>;
};

export { handler as GET };

export async function POST(
  request: NextRequest,
  context: NextAuthRouteContext,
) {
  if (!request.nextUrl.pathname.endsWith("/callback/credentials")) {
    return handler(request, context);
  }

  const ipLimit = checkRateLimit({
    namespace: "auth-credentials-ip",
    identifier: hashRateLimitIdentifier(getClientIp(request.headers)),
    limit: 50,
    windowMs: 15 * 60 * 1000,
  });

  if (!ipLimit.allowed) {
    return createRateLimitResponse(request, ipLimit);
  }

  const identifier = await readCredentialsIdentifier(request);
  let activeLimit = ipLimit;

  if (identifier) {
    const identifierLimit = checkRateLimit({
      namespace: "auth-credentials-identifier",
      identifier: hashRateLimitIdentifier(normalizeIdentifier(identifier)),
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });

    activeLimit = identifierLimit;

    if (!identifierLimit.allowed) {
      return createRateLimitResponse(request, identifierLimit);
    }
  }

  const response = await handler(request, context);

  for (const [header, value] of Object.entries(
    getRateLimitHeaders(activeLimit),
  )) {
    response.headers.set(header, value);
  }

  return response;
}

async function readCredentialsIdentifier(request: NextRequest) {
  try {
    const formData = await request.clone().formData();
    const identifier = formData.get("rut");

    return typeof identifier === "string" ? identifier.trim() : "";
  } catch {
    return "";
  }
}

function normalizeIdentifier(identifier: string) {
  return identifier.includes("@")
    ? identifier.toLowerCase()
    : identifier.replace(/[.\s-]/g, "").toUpperCase();
}

function createRateLimitResponse(
  request: NextRequest,
  result: RateLimitResult,
) {
  const errorUrl = new URL("/login", request.nextUrl.origin);
  errorUrl.searchParams.set("error", "RateLimit");

  return NextResponse.json(
    {
      error: "RateLimit",
      retryAfterSeconds: result.retryAfterSeconds,
      url: errorUrl.toString(),
    },
    {
      status: 429,
      headers: {
        ...getRateLimitHeaders(result),
        "Cache-Control": "no-store",
      },
    },
  );
}
