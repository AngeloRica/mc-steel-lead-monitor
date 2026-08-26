/** Cloudflare Worker entry point for the MC Steel Lead Monitor. */
import handler from "vinext/server/app-router-entry";
import {
  dashboardAuthRequiredResponse,
  hasValidCollectorBearer,
  hasValidDashboardBasicAuth,
  isLocalDevelopmentRequest,
} from "../lib/basic-auth";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  ALLOWED_EMAILS?: string;
  ALLOW_LOCAL_DEV?: string;
  COLLECTOR_SECRET?: string;
  DASHBOARD_USERNAME?: string;
  DASHBOARD_PASSWORD?: string;
  SERPER_API_KEY?: string;
  RSS_FEEDS?: string;
  MAX_PAGES_PER_QUERY?: string;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const pathname = new URL(request.url).pathname;
    const isCollectorEndpoint = pathname === "/api/collect" || pathname === "/api/ingest";
    const collectorAuthorized = isCollectorEndpoint && hasValidCollectorBearer(request, env);
    const dashboardAuthorized = hasValidDashboardBasicAuth(request, env);

    if (!collectorAuthorized && !dashboardAuthorized && !isLocalDevelopmentRequest(request, env)) {
      return dashboardAuthRequiredResponse(Boolean(env.DASHBOARD_USERNAME && env.DASHBOARD_PASSWORD));
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;
