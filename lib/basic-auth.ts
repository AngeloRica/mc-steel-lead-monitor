export type BasicAuthEnv = {
  DASHBOARD_USERNAME?: string;
  DASHBOARD_PASSWORD?: string;
  COLLECTOR_SECRET?: string;
  ALLOW_LOCAL_DEV?: string;
};

function constantTimeEqual(actual: string, expected: string): boolean {
  const length = Math.max(actual.length, expected.length);
  let mismatch = actual.length ^ expected.length;

  for (let index = 0; index < length; index += 1) {
    mismatch |= (actual.charCodeAt(index) || 0) ^ (expected.charCodeAt(index) || 0);
  }

  return mismatch === 0;
}

function basicCredentials(request: Request): { username: string; password: string } | null {
  const authorization = request.headers.get("authorization") ?? "";
  const [scheme, encoded] = authorization.split(" ", 2);
  if (scheme?.toLowerCase() !== "basic" || !encoded) return null;

  try {
    const decoded = atob(encoded);
    const separator = decoded.indexOf(":");
    if (separator < 0) return null;
    return {
      username: decoded.slice(0, separator),
      password: decoded.slice(separator + 1),
    };
  } catch {
    return null;
  }
}

function bearerToken(request: Request): string {
  const value = request.headers.get("authorization") ?? "";
  return value.toLowerCase().startsWith("bearer ") ? value.slice(7).trim() : "";
}

export function isLocalDevelopmentRequest(request: Request, env: BasicAuthEnv): boolean {
  if (env.ALLOW_LOCAL_DEV !== "true") return false;
  const hostname = new URL(request.url).hostname;
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "terminal.local";
}

export function hasValidDashboardBasicAuth(request: Request, env: BasicAuthEnv): boolean {
  const expectedUsername = env.DASHBOARD_USERNAME ?? "";
  const expectedPassword = env.DASHBOARD_PASSWORD ?? "";
  if (!expectedUsername || !expectedPassword) return false;

  const supplied = basicCredentials(request);
  if (!supplied) return false;

  return (
    constantTimeEqual(supplied.username, expectedUsername) &&
    constantTimeEqual(supplied.password, expectedPassword)
  );
}

export function hasValidCollectorBearer(request: Request, env: BasicAuthEnv): boolean {
  const expected = env.COLLECTOR_SECRET ?? "";
  const actual = bearerToken(request);
  return Boolean(expected && actual && constantTimeEqual(actual, expected));
}

export function dashboardAuthRequiredResponse(configured: boolean): Response {
  if (!configured) {
    return new Response("Dashboard authentication is not configured.", {
      status: 503,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "text/plain; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  return new Response("Authentication required.", {
    status: 401,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8",
      "Referrer-Policy": "no-referrer",
      "WWW-Authenticate": 'Basic realm="MC Steel Lead Monitor", charset="UTF-8"',
      "X-Content-Type-Options": "nosniff",
    },
  });
}
