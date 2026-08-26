import { env } from "cloudflare:workers";

export type MonitorEnv = {
  DB?: D1Database;
  SERPER_API_KEY?: string;
  COLLECTOR_SECRET?: string;
  DASHBOARD_USERNAME?: string;
  DASHBOARD_PASSWORD?: string;
  ALLOWED_EMAILS?: string;
  ALLOW_LOCAL_DEV?: string;
  RSS_FEEDS?: string;
  MAX_PAGES_PER_QUERY?: string;
};

export function getRuntimeEnv(): MonitorEnv {
  return env as unknown as MonitorEnv;
}
