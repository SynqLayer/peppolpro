export function sanitizeDecimalInput(input: string, maxDecimals = 2): string {
 const normalized = normalizeDecimalSeparators(input, maxDecimals);
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
 const decimalIndex = findDecimalSeparatorIndex(input, maxDecimals);
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
  if (index === decimalIndex) result += char;
 }

 return result;
}

export function sanitizeDecimalCurrencyDisplayInput(input: string): string {
 return sanitizeDecimalDisplayInput(input, 2);
}

function findDecimalSeparatorIndex(input: string, maxDecimals: number): number {
 for (let index = input.length - 1; index >= 0; index -= 1) {
  const char = input[index];
  if (char !== "." && char !== ",") continue;

  const tail = input.slice(index + 1);
  const digitsAfter = tail.replace(/\D/g, "").length;
  const followedByThreeDigitGroup = maxDecimals <= 2 && /^\d{3}(?:[.,]|$)/.test(tail);

  if (followedByThreeDigitGroup) continue;
  if (digitsAfter <= maxDecimals) return index;
 }

 return -1;
}

function normalizeDecimalSeparators(input: string, maxDecimals = 2): string {
 const decimalIndex = findDecimalSeparatorIndex(input, maxDecimals);
 let result = "";

 for (let index = 0; index < input.length; index += 1) {
  const char = input[index];
  if (/\d/.test(char)) {
   result += char;
   continue;
  }
  if (index === decimalIndex) result += ".";
 }

 return result;
}

export function parseDecimalInput(input: string, maxDecimals = 2): number {
 const sanitized = sanitizeDecimalInput(input, maxDecimals);
 if (sanitized === "" || sanitized === ".") return 0;
 return Number(sanitized);
}

export function parseDecimalCurrencyInput(input: string): number {
 return parseDecimalInput(input, 2);
}
