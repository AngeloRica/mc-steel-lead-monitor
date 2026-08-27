import assert from "node:assert/strict";
import test from "node:test";

import { assessBuyerIntent } from "../lib/intent.ts";

test("accepts a clear English buyer request", () => {
  const result = assessBuyerIntent(
    "LF: GI pipe supplier in Cavite",
    "Need quotation for GI pipe. Please quote.",
  );
  assert.equal(result.qualified, true);
});

test("accepts a clear Filipino buyer request", () => {
  const result = assessBuyerIntent(
    "Naghahanap ng steel plate supplier",
    "Pa-quote po for MS plate delivery to Manila.",
  );
  assert.equal(result.qualified, true);
});

test("rejects an advertisement disguised as a buyer question", () => {
  const result = assessBuyerIntent(
    "Are you looking for affordable deformed bar?",
    "We supply and deliver quality rebar. Message us for quotation.",
  );
  assert.equal(result.qualified, false);
});

test("rejects a straightforward product offering", () => {
  const result = assessBuyerIntent(
    "Angle bar available stocks",
    "Wholesale and retail. PM for orders and nationwide delivery.",
  );
  assert.equal(result.qualified, false);
});

test("rejects direct-supplier promotions containing buyer keywords", () => {
  const result = assessBuyerIntent(
    "Need supplier for steel grating?",
    "Direct supplier here. Send us a message and order now.",
  );
  assert.equal(result.qualified, false);
});
