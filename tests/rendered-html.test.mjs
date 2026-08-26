import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("uses the MC Steel product metadata without starter markers", async () => {
  const layoutUrl = new URL("../app/layout.tsx", import.meta.url);
  const layout = await readFile(layoutUrl, "utf8");
  assert.match(layout, /MC Steel Lead Monitor/);
  assert.doesNotMatch(layout, /Starter Project|codex-preview/);
});
