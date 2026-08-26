import type { ContactExtraction } from "@/lib/types";

const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_RE = /(?<!\d)(?:(?:\+?63|0)[\s.-]?)?9\d{2}[\s.-]?\d{3}[\s.-]?\d{4}(?!\d)/g;
const EXPLICIT_NAME_RE = /(?:contact(?:\s+person)?|name|look\s+for)\s*[:\-]\s*([A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+){0,3})/i;

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function normalizePhone(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("9")) return `+63${digits}`;
  if (digits.length === 11 && digits.startsWith("09")) return `+63${digits.slice(1)}`;
  if (digits.length === 12 && digits.startsWith("639")) return `+${digits}`;
  return null;
}

export function extractExplicitPublicContacts(
  text: string,
  authorName?: string | null,
): ContactExtraction {
  const emails = unique((text.match(EMAIL_RE) ?? []).map((value) => value.toLowerCase()));
  const phones = unique(
    (text.match(PHONE_RE) ?? [])
      .map(normalizePhone)
      .filter((value): value is string => Boolean(value)),
  );
  const explicitName = text.match(EXPLICIT_NAME_RE)?.[1]?.trim() ?? null;
  const name = (authorName?.trim() || explicitName) ?? null;

  return { name, emails, phones };
}
