export const CONVERSION_PDF_RETENTION_HOURS = 24;

export type ConversionPdfRetentionCandidate = {
 id?: string | null;
 user_id?: string | null;
 created_at?: string | null;
};

export function conversionPdfRetentionCutoff(now = new Date()) {
 return new Date(now.getTime() - CONVERSION_PDF_RETENTION_HOURS * 60 * 60 * 1000).toISOString();
}

export function conversionPdfStoragePath(conversion: ConversionPdfRetentionCandidate) {
 if (!conversion.user_id || !conversion.id) return null;
 return `${conversion.user_id}/${conversion.id}.pdf`;
}

export function collectExpiredConversionPdfPaths(conversions: ConversionPdfRetentionCandidate[]) {
 return conversions
 .map((conversion) => conversionPdfStoragePath(conversion))
 .filter((path): path is string => Boolean(path));
}
