export function sanitizeDecimalCurrencyInput(input: string): string {
 const normalized = normalizeDecimalSeparators(input);
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

function normalizeDecimalSeparators(input: string): string {
 const lastCommaIndex = input.lastIndexOf(",");
 if (lastCommaIndex === -1) return input;

 const withoutThousandsDots = input.replace(/\./g, "");
 const decimalCommaIndex = withoutThousandsDots.lastIndexOf(",");

 return (
  withoutThousandsDots.slice(0, decimalCommaIndex).replace(/,/g, "") +
  "." +
  withoutThousandsDots.slice(decimalCommaIndex + 1)
 );
}

export function parseDecimalCurrencyInput(input: string): number {
 const sanitized = sanitizeDecimalCurrencyInput(input);
 if (sanitized === "" || sanitized === ".") return 0;
 return Number(sanitized);
}
