import { prisma } from "@/lib/db";
import type { InboxPreferencesPersistedV1 } from "@/lib/inbox/inbox-preferences-schema";
import { inboxPreferencesV1Schema } from "@/lib/inbox/inbox-preferences-schema";

export async function upsertInboxPreferencesForScope(
  userId: string,
  scope: string,
  prefs: InboxPreferencesPersistedV1,
): Promise<void> {
  const parsed = inboxPreferencesV1Schema.parse(prefs);
  await prisma.userInboxPreferences.upsert({
    where: { userId_scope: { userId, scope } },
    create: {
      userId,
      scope,
      prefsJson: parsed as object,
    },
    update: {
      prefsJson: parsed as object,
    },
  });
}
