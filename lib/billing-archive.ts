import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

type ArchiveBucket = ReturnType<SupabaseClient["storage"]["from"]>;

export function pdfHash(bytes: Uint8Array): string {
 return createHash("sha256").update(bytes).digest("hex");
}

export async function readArchivedPdf(bucket: ArchiveBucket, path: string, expectedHash?: string | null): Promise<Uint8Array> {
 const { data, error } = await bucket.download(path);
 if (error || !data) throw new Error("Factuurarchief niet beschikbaar");
 const bytes = new Uint8Array(await data.arrayBuffer());
 if (expectedHash && pdfHash(bytes) !== expectedHash) throw new Error("Factuurarchief integriteitscontrole mislukt");
 return bytes;
}

export async function preserveArchivedPdf({ bucket, path, archived, expectedHash, render }: {
 bucket: ArchiveBucket;
 path: string;
 archived: boolean;
 expectedHash?: string | null;
 render: () => Promise<Uint8Array>;
}): Promise<Uint8Array> {
 if (archived) return readArchivedPdf(bucket, path, expectedHash);
 const bytes = await render();
 const { error } = await bucket.upload(path, Buffer.from(bytes), { contentType: "application/pdf", upsert: false });
 if (error && String(error.statusCode) !== "409") throw new Error("Factuurarchief opslaan mislukt");
 // A concurrent request may have won the insert. Always use the stored bytes as
 // canonical, including when recovering after an upload followed by a DB failure.
 return readArchivedPdf(bucket, path, expectedHash);
}

// SQL is the only source for the inclusive retention boundary. Do not reproduce
// fiscal date arithmetic in JavaScript or derive it from the current clock.
export async function verifyInvoiceRetention(supabase: SupabaseClient, invoiceDate: string | null | undefined, storedUntil: string | null | undefined): Promise<string> {
 if (!invoiceDate || !storedUntil) throw new Error("Factuurbewaartermijn ontbreekt");
 const { data, error } = await supabase.rpc("invoice_retention_until", { invoice_date: invoiceDate });
 if (error || typeof data !== "string") throw new Error("Factuurbewaartermijn kon niet worden gecontroleerd");
 if (Date.parse(storedUntil) !== Date.parse(`${data}T00:00:00Z`)) throw new Error("Factuurbewaartermijn wijkt af van beleid");
 return data;
}
