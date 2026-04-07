"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useTransition } from "react";
import { boardViewFromSearchParams } from "@/lib/tasks/task-filters";
import { Button } from "@/components/ui/button";
import { mergeSearchParams } from "@/lib/url/merge-search-params";
import { Inbox, LayoutGrid, List } from "lucide-react";

export function ProjectsViewToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pending, start] = useTransition();

  const view = useMemo(
    () =>
      boardViewFromSearchParams(
        Object.fromEntries(sp.entries()) as Record<string, string>,
      ),
    [sp],
  );

  const push = useCallback(
    (patch: Record<string, string | undefined>) => {
      const n = mergeSearchParams(sp, patch);
      start(() => router.push(`${pathname}?${n.toString()}`));
    },
    [router, pathname, sp],
  );

  return (
    <div
      className="inline-flex rounded-md border border-border/60 bg-muted/20 p-0.5"
      role="group"
      aria-label="Layout"
    >
      <Button
        type="button"
        variant={view === "grid" ? "secondary" : "ghost"}
        size="sm"
        className="h-8 gap-1.5 rounded-sm px-2.5 shadow-none"
        disabled={pending}
        aria-pressed={view === "grid"}
        onClick={() => push({ view: undefined })}
      >
        <LayoutGrid className="size-4 shrink-0" aria-hidden />
        <span className="hidden sm:inline">Grid</span>
      </Button>
      <Button
        type="button"
        variant={view === "list" ? "secondary" : "ghost"}
        size="sm"
        className="h-8 gap-1.5 rounded-sm px-2.5 shadow-none"
        disabled={pending}
        aria-pressed={view === "list"}
        onClick={() => push({ view: "list" })}
      >
        <List className="size-4 shrink-0" aria-hidden />
        <span className="hidden sm:inline">List</span>
      </Button>
      <Button
        type="button"
        variant={view === "inbox" ? "secondary" : "ghost"}
        size="sm"
        className="h-8 gap-1.5 rounded-sm px-2.5 shadow-none"
        disabled={pending}
        aria-pressed={view === "inbox"}
        onClick={() => push({ view: "inbox" })}
      >
        <Inbox className="size-4 shrink-0" aria-hidden />
        <span className="hidden sm:inline">Inbox</span>
      </Button>
    </div>
  );
}
