/**
 * CORS for the Chrome extension. Set EXTENSION_ALLOWED_ORIGINS to a comma-separated
 * list of origins, e.g. chrome-extension://<your-extension-id>
 */
export function getExtensionAllowedOrigins(): string[] {
  const raw = process.env.EXTENSION_ALLOWED_ORIGINS;
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function corsHeadersForRequest(request: Request): Record<string, string> {
  const origin = request.headers.get("origin");
  const allowed = getExtensionAllowedOrigins();
  if (!origin || !allowed.includes(origin)) {
    return {};
  }
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

export function mergeCors(
  base: HeadersInit | undefined,
  cors: Record<string, string>,
): Headers {
  const h = new Headers(base);
  for (const [k, v] of Object.entries(cors)) {
    h.set(k, v);
  }
  return h;
}
