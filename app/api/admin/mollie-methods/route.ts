import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MOLLIE_METHODS_URL = "https://api.mollie.com/v2/methods";

export async function GET(req: NextRequest) {
 const secret = req.nextUrl.searchParams.get("secret");
 if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
 return NextResponse.json({ error: "forbidden" }, { status: 403 });
 }

 const apiKey = process.env.MOLLIE_API_KEY;
 if (!apiKey) {
 return NextResponse.json({ error: "mollie_api_key_missing" }, { status: 500 });
 }

 const url = new URL(MOLLIE_METHODS_URL);
 url.searchParams.set("amount[currency]", "EUR");
 url.searchParams.set("amount[value]", "12.00");
 url.searchParams.set("sequenceType", "first");
 url.searchParams.set("resource", "payments");

 const response = await fetch(url, {
 method: "GET",
 headers: {
 Authorization: `Bearer ${apiKey}`,
 Accept: "application/json",
 },
 cache: "no-store",
 });

 const body = await response.text();
 return new NextResponse(body, {
 status: response.status,
 headers: {
 "Content-Type": response.headers.get("content-type") || "application/json",
 "Cache-Control": "no-store",
 },
 });
}
