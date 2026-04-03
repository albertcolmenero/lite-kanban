"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { GlobalProjectHeaderStrip } from "@/app/(app)/global-project-header-strip";
import { useProjectHeaderRegistry } from "@/app/(app)/project-header-context";

export function MainAppHeader() {
  const { payload } = useProjectHeaderRegistry();

  return (
    <header className="flex min-h-14 flex-wrap items-center gap-2 border-b border-border px-3 py-2 sm:gap-3 sm:px-4">
      <nav className="flex shrink-0 items-center gap-4 text-sm font-medium sm:gap-6">
        <Link
          href="/projects"
          className="text-base font-semibold tracking-tight text-foreground"
        >
          Lite Kanban
        </Link>
        <Link
          href="/extension-setup"
          className="text-muted-foreground hover:text-foreground"
        >
          Extension
        </Link>
      </nav>
      {payload ? <GlobalProjectHeaderStrip payload={payload} /> : null}
      <div className="ml-auto flex shrink-0 items-center pl-2">
        <UserButton />
      </div>
    </header>
  );
}
