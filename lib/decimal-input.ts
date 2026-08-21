export function sanitizeDecimalInput(input: string, maxDecimals = 2): string {
 const normalized = normalizeDecimalSeparators(input);
 let result = "";
 let hasDecimalSeparator = false;
 let decimals = 0;

 for (const char of normalized) {
  if (/\d/.test(char)) {
   if (hasDecimalSeparator) {
    if (decimals >= maxDecimals) continue;
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

export function sanitizeDecimalCurrencyInput(input: string): string {
 return sanitizeDecimalInput(input, 2);
}

export function sanitizeDecimalDisplayInput(input: string, maxDecimals = 2): string {
 const hasComma = input.includes(",");
 const hasDot = input.includes(".");
 const lastComma = input.lastIndexOf(",");
 const lastDot = input.lastIndexOf(".");
 const decimalSeparator = hasComma && (!hasDot || lastComma > lastDot) ? "," : hasDot ? "." : "";
 const decimalIndex = decimalSeparator ? input.lastIndexOf(decimalSeparator) : -1;
 let result = "";
 let decimals = 0;

 for (let index = 0; index < input.length; index += 1) {
  const char = input[index];
  if (/\d/.test(char)) {
   if (decimalIndex !== -1 && index > decimalIndex) {
    if (decimals >= maxDecimals) continue;
    decimals += 1;
   }
   result += char;
   continue;
  }
  if (index === decimalIndex && decimalSeparator) result += decimalSeparator;
 }

 return result;
}

export function sanitizeDecimalCurrencyDisplayInput(input: string): string {
 return sanitizeDecimalDisplayInput(input, 2);
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

export function parseDecimalInput(input: string, maxDecimals = 2): number {
 const sanitized = sanitizeDecimalInput(input, maxDecimals);
 if (sanitized === "" || sanitized === ".") return 0;
 return Number(sanitized);
}

export function parseDecimalCurrencyInput(input: string): number {
 return parseDecimalInput(input, 2);
}
