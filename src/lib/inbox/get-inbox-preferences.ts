import { prisma } from "@/lib/db";
import {
  defaultInboxPreferencesPersisted,
  parseInboxPreferencesJson,
  type InboxPreferencesPersistedV1,
} from "@/lib/inbox/inbox-preferences-schema";

export async function getInboxPreferencesForScope(
  userId: string,
  scope: string,
): Promise<{ prefs: InboxPreferencesPersistedV1; fromDb: boolean }> {
  const row = await prisma.userInboxPreferences.findUnique({
    where: { userId_scope: { userId, scope } },
    select: { prefsJson: true },
  });
  if (!row) {
    return { prefs: defaultInboxPreferencesPersisted(), fromDb: false };
  }
  return { prefs: parseInboxPreferencesJson(row.prefsJson), fromDb: true };
}
