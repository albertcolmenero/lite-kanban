-- CreateTable (additive; no data loss on existing tables)
CREATE TABLE "UserInboxPreferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "prefsJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserInboxPreferences_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserInboxPreferences_userId_scope_key" ON "UserInboxPreferences"("userId", "scope");

CREATE INDEX "UserInboxPreferences_userId_idx" ON "UserInboxPreferences"("userId");
