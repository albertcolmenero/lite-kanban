"use client";

import { useAuth } from "@clerk/nextjs";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ExtensionTokenPanel() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function loadToken() {
    setBusy(true);
    try {
      const t = await getToken();
      setToken(t ?? null);
    } finally {
      setBusy(false);
    }
  }

  if (!isLoaded) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  if (!isSignedIn) {
    return <p className="text-sm text-muted-foreground">Sign in to load a session token.</p>;
  }

  return (
    <div className="space-y-4 rounded-lg border border-border p-4">
      <p className="text-sm text-muted-foreground">
        The extension sends this value as{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">
          Authorization: Bearer …
        </code>
        . Treat it like a password; rotate by signing out everywhere if it leaks.
      </p>
      <Button type="button" size="sm" onClick={loadToken} disabled={busy}>
        {busy ? "Loading…" : "Reveal session token"}
      </Button>
      {token ? (
        <div className="space-y-2">
          <Label htmlFor="tok">Token</Label>
          <Input id="tok" readOnly value={token} className="font-mono text-xs" />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => void navigator.clipboard.writeText(token)}
          >
            Copy
          </Button>
        </div>
      ) : null}
    </div>
  );
}
