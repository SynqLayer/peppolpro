export const DOCUMENT_CREDIT_EXHAUSTED_MESSAGE = "Je tegoed voor het aanmaken van documenten is op. Met een verzendbundel maak en verstuur je weer documenten.";
export const DOCUMENT_CREDIT_UPGRADE_URL = "/prijzen";

export function documentCreditExhaustedBody() {
 return {
  error: DOCUMENT_CREDIT_EXHAUSTED_MESSAGE,
  upgradeUrl: DOCUMENT_CREDIT_UPGRADE_URL,
 } as const;
}
