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
    "Naghahanap ako ng steel plate supplier",
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

test("accepts I'm looking for with Philippine evidence", () => {
  const result = assessBuyerIntent(
    "I'm looking for a deformed bar supplier",
    "Please quote for delivery to Quezon City, Philippines.",
  );
  assert.equal(result.qualified, true);
});

test("accepts looking po ako in the Philippines", () => {
  const result = assessBuyerIntent(
    "Looking po ako for GI pipe",
    "Please quote. Delivery to Cavite.",
  );
  assert.equal(result.qualified, true);
});

test("accepts please quote with a Philippine phone number", () => {
  const result = assessBuyerIntent(
    "Please quote steel grating",
    "Contact 09171234567 for our project inquiry.",
  );
  assert.equal(result.qualified, true);
});

test("rejects generic looking-for text without a first-person buyer phrase", () => {
  const result = assessBuyerIntent(
    "Looking for quality angle bar in the Philippines",
    "Affordable construction materials in stock.",
  );
  assert.equal(result.qualified, false);
});

test("rejects a clear buyer phrase without Philippine evidence", () => {
  const result = assessBuyerIntent(
    "I'm looking for a rebar supplier",
    "Please quote for delivery to Texas, USA.",
  );
  assert.equal(result.qualified, false);
});
