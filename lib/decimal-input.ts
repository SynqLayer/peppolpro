export function sanitizeDecimalCurrencyInput(input: string): string {
 const normalized = input.replace(/,/g, ".");
 let result = "";
 let hasDecimalSeparator = false;
 let decimals = 0;

 for (const char of normalized) {
 if (/\d/.test(char)) {
 if (hasDecimalSeparator) {
 if (decimals >= 2) continue;
 decimals += 1;
 }
 result += char;
 continue;
 }

 if (char === "." && !hasDecimalSeparator) {
 hasDecimalSeparator = true;
 result += char;
 }
 }

 return result;
}

export function parseDecimalCurrencyInput(input: string): number {
 const sanitized = sanitizeDecimalCurrencyInput(input);
 if (sanitized === "" || sanitized === ".") return 0;
 return Number(sanitized);
}
