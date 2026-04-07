"use server";

import { auth } from "@clerk/nextjs/server";
import {
  inboxPreferencesV1Schema,
  type InboxPreferencesPersistedV1,
} from "@/lib/inbox/inbox-preferences-schema";
import { upsertInboxPreferencesForScope } from "@/lib/inbox/upsert-inbox-preferences";

export async function saveInboxPreferencesAction(
  scope: string,
  prefs: InboxPreferencesPersistedV1,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { userId } = await auth();
  if (!userId) {
    return { ok: false, error: "Unauthorized" };
  }
  if (!scope || scope.length > 256) {
    return { ok: false, error: "Invalid scope" };
  }
  try {
    const parsed = inboxPreferencesV1Schema.parse(prefs);
    await upsertInboxPreferencesForScope(userId, scope, parsed);
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Invalid preferences",
    };
  }
}
