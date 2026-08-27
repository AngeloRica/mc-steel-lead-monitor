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

test("rejects a shortened are-you-looking advertisement", () => {
  const result = assessBuyerIntent(
    "Are you looking for GI pipe?",
    "Quality construction materials at competitive prices.",
  );
  assert.equal(result.qualified, false);
});

test("rejects an ungrammatical we-offering advertisement", () => {
  const result = assessBuyerIntent(
    "Looking for MS plate?",
    "We offering steel plate and delivery in Metro Manila.",
  );
  assert.equal(result.qualified, false);
});

test("rejects a we-can-provide seller advertisement", () => {
  const result = assessBuyerIntent(
    "Need construction materials?",
    "We can provide angle bar, flat bar, and deformed bar.",
  );
  assert.equal(result.qualified, false);
});

test("still accepts a first-person buyer looking for a supplier", () => {
  const result = assessBuyerIntent(
    "We are looking for a wide flange supplier",
    "Need quotation and delivery to Pampanga.",
  );
  assert.equal(result.qualified, true);
});
