import assert from "node:assert/strict";
import test from "node:test";

import {
  hasValidCollectorBearer,
  hasValidDashboardBasicAuth,
  isLocalDevelopmentRequest,
} from "../lib/basic-auth.ts";

const env = {
  DASHBOARD_USERNAME: "mcsteeladmin",
  DASHBOARD_PASSWORD: "correct-horse-battery-staple",
  COLLECTOR_SECRET: "collector-only-secret",
  ALLOW_LOCAL_DEV: "false",
};

test("accepts correct dashboard Basic authentication", () => {
  const authorization = `Basic ${btoa("mcsteeladmin:correct-horse-battery-staple")}`;
  const request = new Request("https://monitor.example.com/", { headers: { authorization } });
  assert.equal(hasValidDashboardBasicAuth(request, env), true);
});

test("rejects incorrect dashboard credentials", () => {
  const authorization = `Basic ${btoa("mcsteeladmin:wrong-password")}`;
  const request = new Request("https://monitor.example.com/", { headers: { authorization } });
  assert.equal(hasValidDashboardBasicAuth(request, env), false);
});

test("keeps collector authentication separate from dashboard authentication", () => {
  const request = new Request("https://monitor.example.com/api/collect", {
    headers: { authorization: "Bearer collector-only-secret" },
  });
  assert.equal(hasValidCollectorBearer(request, env), true);
  assert.equal(hasValidDashboardBasicAuth(request, env), false);
});

test("local bypass works only when explicitly enabled", () => {
  const request = new Request("http://localhost:3000/");
  assert.equal(isLocalDevelopmentRequest(request, env), false);
  assert.equal(isLocalDevelopmentRequest(request, { ...env, ALLOW_LOCAL_DEV: "true" }), true);
});
