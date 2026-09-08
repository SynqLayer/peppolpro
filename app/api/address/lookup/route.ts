import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { lookupDutchAddress } from "@/lib/address-validation";

export async function GET(req: NextRequest) {
 const supabase = await createServerSupabase();
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

 const { searchParams } = new URL(req.url);
 const postalCode = searchParams.get("postalCode") || "";
 const houseNumber = searchParams.get("houseNumber") || "";
 const address = await lookupDutchAddress(postalCode, houseNumber);
 if (!address) return NextResponse.json({ error: "Adres niet gevonden" }, { status: 404 });
 return NextResponse.json(address);
}
