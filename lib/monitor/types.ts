export type QueryType = "kvk" | "name" | "unknown";

export type PeppolDocumentType = {
  scheme?: string;
  value: string;
  label: string;
};

export type PeppolMatch = {
  peppolId: string;
  participantScheme?: string;
  participantValue?: string;
  names: string[];
  countryCodes: string[];
  registrationDates: string[];
  supportedDocumentTypes: PeppolDocumentType[];
};

export type PeppolLookupResult = {
  found: boolean;
  query: string;
  queryType: QueryType;
  peppolIds: string[];
  supportedDocumentTypes: PeppolDocumentType[];
  matches: PeppolMatch[];
  source: {
    name: string;
    url: string;
    fetchedAt: string;
  };
  caveats: string[];
};
