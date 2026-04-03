import { clerkClient } from "@clerk/nextjs/server";
import { corsHeadersForRequest, mergeCors } from "@/lib/api/cors";

export type ApiAuthOk = { userId: string; cors: Record<string, string> };

export async function requireApiUser(
  request: Request,
): Promise<ApiAuthOk | { error: Response }> {
  const cors = corsHeadersForRequest(request);
  const client = await clerkClient();
  const state = await client.authenticateRequest(request, {
    acceptsToken: "session_token",
  });

  if (!state.isAuthenticated) {
    return {
      error: Response.json(
        { error: "Unauthorized" },
        { status: 401, headers: mergeCors(undefined, cors) },
      ),
    };
  }

  const auth = state.toAuth();
  const userId = auth.userId;
  if (!userId) {
    return {
      error: Response.json(
        { error: "Unauthorized" },
        { status: 401, headers: mergeCors(undefined, cors) },
      ),
    };
  }

  return { userId, cors };
}

export function jsonWithCors(
  data: unknown,
  init: ResponseInit | undefined,
  cors: Record<string, string>,
) {
  const headers = mergeCors(init?.headers, cors);
  headers.set("Content-Type", "application/json");
  return Response.json(data, { ...init, headers });
}
