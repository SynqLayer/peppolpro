/**
 * Achterhaalde (superseded) conversies.
 *
 * Een conversie kan inhoudelijk vervangen zijn door een latere, wél afgeleverde versie.
 * Zo'n oud bestand mag niet meer gedownload en niet meer verzonden worden. De waarheid
 * staat in `conversions.superseded_by_conversion_id`; de UI en de API lezen die kolom.
 * Downloaden wordt bovendien server-side geblokkeerd door `ubl_xml` niet naar de browser
 * te sturen, zodat de grendel niet van de client afhangt.
 */

export const SUPERSEDED_STATUS = "superseded";

export const SUPERSEDED_DOWNLOAD_LABEL = "Achterhaald, niet downloadbaar";

export const SUPERSEDED_SEND_BLOCKED_MESSAGE =
  "Deze factuur is achterhaald door een nieuwere, afgeleverde versie. Verzend de leidende versie in plaats van deze.";

export const SUPERSEDED_DOWNLOAD_BLOCKED_MESSAGE =
  "Deze versie is achterhaald door een nieuwere, afgeleverde versie en kan niet meer worden gedownload. Gebruik de leidende versie.";

export const SUPERSEDED_DEFAULT_DETAIL = "Deze versie is achterhaald en niet meer te gebruiken.";

export type SupersedableRow = {
 superseded_by_conversion_id?: string | null;
 superseded_by_label?: string | null;
 superseded_reason?: string | null;
};

export function isSuperseded(row: SupersedableRow | null | undefined): boolean {
 return Boolean(row?.superseded_by_conversion_id);
}

export function supersededDetail(row: SupersedableRow | null | undefined): string {
 if (row?.superseded_reason) return row.superseded_reason;
 if (row?.superseded_by_label) return `Achterhaald door ${row.superseded_by_label}.`;
 return SUPERSEDED_DEFAULT_DETAIL;
}
