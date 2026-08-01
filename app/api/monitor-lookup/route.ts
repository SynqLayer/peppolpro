import { NextRequest, NextResponse } from "next/server";
import { fetchDirectoryLookup, normalizeInput, validateLookupInput } from "@/lib/monitor/peppol-directory";
import { MemoryRateLimiter } from "@/lib/monitor/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const limiter = new MemoryRateLimiter(20, 60_000);

function clientKey(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || request.headers.get("x-real-ip") || "unknown";
}

function rateLimitResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    { error: "Te veel verzoeken. Probeer het straks opnieuw." },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds), "Cache-Control": "no-store" } },
  );
}

async function handleLookup(request: NextRequest, rawQuery: string | null) {
  const rate = limiter.check(clientKey(request));
  if (!rate.allowed) return rateLimitResponse(rate.retryAfterSeconds);

  const inputError = validateLookupInput(rawQuery ?? "");
  if (inputError) {
    return NextResponse.json({ error: inputError }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  const { query, queryType } = normalizeInput(rawQuery ?? "");
  const result = await fetchDirectoryLookup(query, queryType);

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "no-store",
      "X-RateLimit-Remaining": String(rate.remaining),
    },
  });
}

export async function GET(request: NextRequest) {
  return handleLookup(request, request.nextUrl.searchParams.get("q"));
}

export async function POST(request: NextRequest) {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Ongeldige JSON-body." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  if (!rawBody || typeof rawBody !== "object" || typeof (rawBody as { query?: unknown }).query !== "string") {
    return NextResponse.json({ error: "Gebruik JSON-body { query: string }." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  return handleLookup(request, (rawBody as { query: string }).query);
}
