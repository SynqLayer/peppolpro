import { NextResponse } from "next/server";

// Profile creation belongs to the auth.users database trigger. This obsolete
// public callback must never mutate an account or send a welcome email.
export async function POST() {
 return NextResponse.json({ error: "Niet toegestaan" }, { status: 401 });
}
