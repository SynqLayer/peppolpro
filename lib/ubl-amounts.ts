function decodeXml(value: string) {
 return value
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">")
  .replace(/&quot;/g, '"')
  .replace(/&apos;/g, "'")
  .replace(/&amp;/g, "&")
  .trim();
}

function payableAmountMatch(ublXml: string) {
 return ublXml.match(/<(?:[A-Za-z0-9_-]+:)?PayableAmount\b([^>]*)>([\s\S]*?)<\/(?:[A-Za-z0-9_-]+:)?PayableAmount>/i);
}

export function payableAmountFromUbl(ublXml: string) {
 const match = payableAmountMatch(ublXml);
 const parsed = Number(match ? decodeXml(match[2]) : "");
 return Number.isFinite(parsed) ? parsed : null;
}

export function payableCurrencyFromUbl(ublXml: string) {
 const match = payableAmountMatch(ublXml);
 const attrs = match?.[1] || "";
 const currency = attrs.match(/currencyID=["']([^"']+)["']/i)?.[1];
 return currency || "EUR";
}
