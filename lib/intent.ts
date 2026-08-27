import {
  BUYER_INTENT_PHRASES,
  PH_LOCATION_HINTS,
  PRODUCT_KEYWORDS,
  SELLER_ONLY_PHRASES,
} from "../config/monitor.ts";
import type { IntentAssessment } from "./types.ts";

function normalize(value: string): string {
  return value.toLowerCase().replace(/[\u2018\u2019]/g, "'").replace(/\s+/g, " ").trim();
}

export function assessBuyerIntent(title: string, body: string): IntentAssessment {
  const normalizedTitle = normalize(title);
  const text = normalize(`${title} ${body}`);
  const matchedKeywords = PRODUCT_KEYWORDS.filter((keyword) => text.includes(keyword));
  const buyerSignals = BUYER_INTENT_PHRASES.filter((phrase) => text.includes(phrase));
  const sellerSignals = SELLER_ONLY_PHRASES.filter((phrase) => text.includes(phrase));
  const sellerMarketingPattern = [
    /\b(?:are you looking|do you need|still looking)\b/,
    /\b(?:we|our company) (?:are )?(?:offering|offer|provide|supply|sell|deliver|fabricate|manufacture|distribute|stock)\b/,
    /\bwe (?:can|could) (?:offer|provide|supply|deliver)\b/,
    /\b(?:supplier|manufacturer|distributor) of\b/,
    /\b(?:available|in stock|on hand|ready for delivery)\b.*\b(?:order|message|contact|delivery)\b/,
    /\b(?:buy|order|get yours|shop) now\b/,
    /\b(?:best|lowest|affordable|competitive) price(?:s)?\b.*\b(?:message|contact|order)\b/,
  ].some((pattern) => pattern.test(text));
  const promotionalQuestion =
    /^(?:are you looking|do you need|still looking|looking for|need|want)\b[^?]*\?/.test(
      normalizedTitle,
    );
  const sellerDominated =
    sellerSignals.length > 0 || sellerMarketingPattern || promotionalQuestion;
  const location = PH_LOCATION_HINTS.find((hint) => text.includes(hint)) ?? null;
  const hasContactSignal = /(?:\+?63|0)9\d{9}|[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(text);

  let score = 0;
  if (buyerSignals.length) score += Math.min(50, 30 + buyerSignals.length * 10);
  if (matchedKeywords.length) score += Math.min(35, 20 + matchedKeywords.length * 5);
  if (location) score += 8;
  if (hasContactSignal) score += 7;
  if (sellerDominated) score -= 70;

  score = Math.max(0, Math.min(100, score));
  return {
    score,
    qualified:
      buyerSignals.length > 0 &&
      matchedKeywords.length > 0 &&
      !sellerDominated &&
      score >= 50,
    matchedKeywords: [...matchedKeywords],
    location,
  };
}
