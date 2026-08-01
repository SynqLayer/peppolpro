import type { PeppolDocumentType, PeppolLookupResult, PeppolMatch, QueryType } from "./types";

export const PEPPOL_DIRECTORY_BASE_URL = "https://directory.peppol.eu/search/1.0/json";

export type PeppolDirectoryResponse = {
  "total-result-count"?: number;
  "used-result-count"?: number;
  matches?: PeppolDirectoryMatch[];
};

type PeppolDirectoryMatch = {
  participantID?: {
    scheme?: string;
    value?: string;
  };
  docTypes?: Array<{
    scheme?: string;
    value?: string;
  }>;
  entities?: Array<{
    name?: Array<{ name?: string; language?: string }>;
    countryCode?: string;
    regDate?: string;
  }>;
};

export function normalizeInput(raw: string): { query: string; queryType: QueryType } {
  const query = raw.trim().replace(/\s+/g, " ");

  if (!query) {
    return { query, queryType: "unknown" };
  }

  const digits = query.replace(/\D/g, "");
  if (/^\d{8}$/.test(digits)) {
    return { query: digits, queryType: "kvk" };
  }

  if (query.length >= 2) {
    return { query, queryType: "name" };
  }

  return { query, queryType: "unknown" };
}

export function validateLookupInput(raw: string): string | null {
  const { query, queryType } = normalizeInput(raw);

  if (!query) return "Vul een KvK-nummer of bedrijfsnaam in.";
  if (query.length > 120) return "Zoekterm is te lang. Gebruik maximaal 120 tekens.";
  if (queryType === "unknown") return "Gebruik een 8-cijferig KvK-nummer of bedrijfsnaam van minimaal 2 tekens.";

  return null;
}

export function buildDirectoryUrls(query: string, queryType: QueryType): URL[] {
  const urls: URL[] = [];

  const makeUrl = () => {
    const url = new URL(PEPPOL_DIRECTORY_BASE_URL);
    url.searchParams.set("country", "NL");
    url.searchParams.set("rpc", "10");
    return url;
  };

  if (queryType === "kvk") {
    const participantUrl = makeUrl();
    participantUrl.searchParams.set("participant", `iso6523-actorid-upis::0106:${query}`);
    urls.push(participantUrl);

    const identifierUrl = makeUrl();
    identifierUrl.searchParams.set("identifierScheme", "0106");
    identifierUrl.searchParams.set("identifierValue", query);
    urls.push(identifierUrl);
  } else if (queryType === "name") {
    const nameUrl = makeUrl();
    nameUrl.searchParams.set("name", query);
    urls.push(nameUrl);

    const genericUrl = makeUrl();
    genericUrl.searchParams.set("q", query);
    urls.push(genericUrl);
  }

  return urls;
}

export function documentTypeLabel(value: string): string {
  if (/Invoice-2/i.test(value)) return "UBL Invoice 2.x";
  if (/CreditNote-2/i.test(value)) return "UBL CreditNote 2.x";
  if (/ApplicationResponse-2/i.test(value)) return "Invoice Response / ApplicationResponse";
  if (/Order-2/i.test(value)) return "Order";
  return value;
}

export function mapDirectoryResponse(raw: PeppolDirectoryResponse, query: string, queryType: QueryType, fetchedAt: string): PeppolLookupResult {
  const matches: PeppolMatch[] = (raw.matches ?? []).map((match) => {
    const participantScheme = match.participantID?.scheme;
    const participantValue = match.participantID?.value;
    const peppolId = [participantScheme, participantValue].filter(Boolean).join("::");

    const supportedDocumentTypes: PeppolDocumentType[] = (match.docTypes ?? []).map((doctype) => ({
      scheme: doctype.scheme,
      value: doctype.value ?? "",
      label: documentTypeLabel(doctype.value ?? ""),
    }));

    return {
      peppolId,
      participantScheme,
      participantValue,
      names: (match.entities ?? []).flatMap((entity) => (entity.name ?? []).map((name) => name.name).filter(Boolean) as string[]),
      countryCodes: Array.from(new Set((match.entities ?? []).map((entity) => entity.countryCode).filter(Boolean) as string[])),
      registrationDates: Array.from(new Set((match.entities ?? []).map((entity) => entity.regDate).filter(Boolean) as string[])),
      supportedDocumentTypes,
    };
  });

  const peppolIds = Array.from(new Set(matches.map((match) => match.peppolId).filter(Boolean)));
  const documentMap = new Map<string, PeppolDocumentType>();
  for (const match of matches) {
    for (const doctype of match.supportedDocumentTypes) {
      if (doctype.value) documentMap.set(`${doctype.scheme ?? ""}:${doctype.value}`, doctype);
    }
  }

  return {
    found: matches.length > 0,
    query,
    queryType,
    peppolIds,
    supportedDocumentTypes: Array.from(documentMap.values()),
    matches,
    source: {
      name: "Official Peppol Directory",
      url: PEPPOL_DIRECTORY_BASE_URL,
      fetchedAt,
    },
    caveats: [
      "Live lookup via de officiële Peppol Directory; lege resultaten betekenen niet juridisch dat een bedrijf nooit Peppol kan gebruiken.",
      "De directorydata wordt gepubliceerd door SMP's en kan wijzigen.",
    ],
  };
}

export async function fetchDirectoryLookup(query: string, queryType: QueryType): Promise<PeppolLookupResult> {
  const urls = buildDirectoryUrls(query, queryType);
  const fetchedAt = new Date().toISOString();

  for (const url of urls) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(url, {
        headers: { Accept: "application/json", "User-Agent": "Peppol-Check/0.1" },
        signal: controller.signal,
        cache: "no-store",
      });

      if (response.status === 429) {
        throw new Error("Peppol Directory rate limit bereikt. Probeer het zo opnieuw.");
      }

      if (!response.ok) {
        continue;
      }

      const data = (await response.json()) as PeppolDirectoryResponse;
      const result = mapDirectoryResponse(data, query, queryType, fetchedAt);
      if (result.found || url === urls[urls.length - 1]) {
        return result;
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  return mapDirectoryResponse({ matches: [] }, query, queryType, fetchedAt);
}
