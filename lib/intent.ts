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
  const firstPersonBuyerPattern = [
    /\b(?:i am|i'm|im|we are|we're) (?:currently )?(?:looking|searching) for\b/,
    /\b(?:looking|searching) po (?:ako|kami)(?: for)?\b/,
    /\b(?:looking|searching) (?:ako|kami)(?: for)?\b/,
    /\bnaghahanap(?: po)? (?:ako|kami)\b/,
    /\b(?:ako|kami) (?:ay )?naghahanap\b/,
    /\b(?:please|kindly) (?:send )?(?:a )?(?:quote|quotation)\b/,
    /\b(?:pa[- ]?quote|pa presyo|request(?:ing)? (?:a )?quotation|rfq)\b/,
    /(?:^|\s)lf\s*[:\-]/,
    /\b(?:where (?:can i|can we|to) buy|want to buy|looking to purchase)\b/,
  ].some((pattern) => pattern.test(text));
  const strongBuyerIntent = buyerSignals.length > 0 || firstPersonBuyerPattern;
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
  const hasPhilippinePhone = /(?:\+?63[\s.-]?9|09)\d(?:[\s.-]?\d){8}\b/.test(text);
  const hasFilipinoBuyerWording =
    /\b(?:naghahanap|looking po (?:ako|kami)|pa[- ]?quote|pa presyo|kailangan ko|kailangan namin)\b/.test(
      text,
    );
  const hasPhilippineSignal =
    Boolean(location) || /\b(?:ph|pinoy|pilipinas)\b/.test(text) || hasPhilippinePhone || hasFilipinoBuyerWording;

  let score = 0;
  if (strongBuyerIntent) score += 50;
  if (matchedKeywords.length) score += Math.min(35, 20 + matchedKeywords.length * 5);
  if (hasPhilippineSignal) score += 8;
  if (hasContactSignal) score += 7;
  if (sellerDominated) score -= 70;

  score = Math.max(0, Math.min(100, score));
  return {
    score,
    qualified:
      strongBuyerIntent &&
      matchedKeywords.length > 0 &&
      hasPhilippineSignal &&
      !sellerDominated &&
      score >= 50,
    matchedKeywords: [...matchedKeywords],
    location,
  };
}
