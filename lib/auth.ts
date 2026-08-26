import { getRuntimeEnv } from "@/lib/runtime-env";
import { hasValidDashboardBasicAuth, isLocalDevelopmentRequest } from "@/lib/basic-auth";

function bearerToken(request: Request): string {
  const value = request.headers.get("authorization") ?? "";
  return value.toLowerCase().startsWith("bearer ") ? value.slice(7).trim() : "";
}

function requestEmail(request: Request): string | null {
  return (
    request.headers.get("cf-access-authenticated-user-email") ??
    request.headers.get("oai-authenticated-user-email")
  )?.toLowerCase() ?? null;
}

export function authorizeViewer(request: Request): Response | null {
  const runtime = getRuntimeEnv();
  if (isLocalDevelopmentRequest(request, runtime)) return null;
  if (hasValidDashboardBasicAuth(request, runtime)) return null;

  const email = requestEmail(request);
  const allowlist = (runtime.ALLOWED_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  if (!email) return Response.json({ error: "Authentication required." }, { status: 401 });
  if (allowlist.length && !allowlist.includes(email)) {
    return Response.json({ error: "Your account is not allowed to view this dashboard." }, { status: 403 });
  }
  return null;
}

export function authorizeCollector(request: Request): Response | null {
  const expected = getRuntimeEnv().COLLECTOR_SECRET ?? "";
  const actual = bearerToken(request);
  if (!expected || !actual || expected !== actual) {
    return Response.json({ error: "Collector authorization failed." }, { status: 401 });
  }
  return null;
}
