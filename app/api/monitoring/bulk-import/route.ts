import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { assertMonitoringAccess } from "@/lib/monitoring-access";

const identifierTypes = new Set(["kvk", "btw", "peppol_id", "company_name"]);

type Row = { identifier_type: string; identifier_value: string; label: string | null };

function parseCsvLine(line: string) {
 const cells: string[] = [];
 let current = "";
 let quoted = false;
 for (let i = 0; i < line.length; i += 1) {
 const char = line[i];
 const next = line[i + 1];
 if (char === '"' && quoted && next === '"') {
 current += '"';
 i += 1;
 } else if (char === '"') {
 quoted = !quoted;
 } else if (char === "," && !quoted) {
 cells.push(current.trim());
 current = "";
 } else {
 current += char;
 }
 }
 cells.push(current.trim());
 return cells;
}

function parseCsv(csv: string): Row[] {
 const lines = csv.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
 if (lines.length < 2) return [];
 const headers = parseCsvLine(lines[0]);
 const idxType = headers.indexOf("identifier_type");
 const idxValue = headers.indexOf("identifier_value");
 const idxLabel = headers.indexOf("label");
 if (idxType === -1 || idxValue === -1 || idxLabel === -1) {
 throw new Error("CSV moet kolommen identifier_type, identifier_value,label bevatten");
 }
 return lines.slice(1).map((line, index) => {
 const cells = parseCsvLine(line);
 const identifier_type = cells[idxType]?.trim();
 const identifier_value = cells[idxValue]?.trim();
 const label = cells[idxLabel]?.trim() || null;
 if (!identifierTypes.has(identifier_type)) throw new Error(`Regel ${index + 2}: ongeldig identifier_type`);
 if (!identifier_value || identifier_value.length > 160) throw new Error(`Regel ${index + 2}: identifier_value ontbreekt of is te lang`);
 return { identifier_type, identifier_value, label };
 });
}

export async function POST(req: NextRequest) {
 try {
 const supabase = await createServerSupabase();
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

 const access = await assertMonitoringAccess(user.id, { requireAccountant: true });
 if (!access.ok) {
 return NextResponse.json({ error: "CSV-bulk-import is alleen beschikbaar met een actief Monitoring Accountant-abonnement.", upgradeCta: "Upgrade naar Monitoring Accountant", reason: access.entitlement.reason }, { status: 403 });
 }

 const csv = await req.text();
 if (csv.length > 250_000) return NextResponse.json({ error: "CSV is te groot" }, { status: 400 });
 const rows = parseCsv(csv);
 if (rows.length === 0) return NextResponse.json({ error: "CSV bevat geen geldige targetregels" }, { status: 400 });
 if (rows.length > 1000) return NextResponse.json({ error: "Maximaal 1000 targets per import" }, { status: 400 });

 const inserts = rows.map((row) => ({ ...row, user_id: access.entitlement.accountOwnerId }));
 const { data, error } = await supabase
 .from("monitoring_targets")
 .insert(inserts)
 .select("id");
 if (error) return NextResponse.json({ error: "Bulk-import mislukt" }, { status: 500 });
 return NextResponse.json({ imported: data?.length || 0 });
 } catch (err) {
 const message = err instanceof Error ? err.message : "Onbekende fout";
 return NextResponse.json({ error: message }, { status: 400 });
 }
}
