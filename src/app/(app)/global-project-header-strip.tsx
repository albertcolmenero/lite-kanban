"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { dispatchOpenProjectTask } from "@/lib/board/open-task-event";
import { mergeSearchParams } from "@/lib/url/merge-search-params";
import type { ProjectHeaderPayload } from "@/app/(app)/project-header-context";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

export function GlobalProjectHeaderStrip({ payload }: { payload: ProjectHeaderPayload }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();
  const [input, setInput] = useState(() => sp.get("q") ?? "");
  const [suggestOpen, setSuggestOpen] = useState(false);
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const qFromUrl = sp.get("q") ?? "";

  useEffect(() => {
    setInput(qFromUrl);
  }, [qFromUrl]);

  useEffect(() => {
    const t = setTimeout(() => {
      const trimmed = input.trim();
      const current = (sp.get("q") ?? "").trim();
      if (trimmed === current) return;
      const n = mergeSearchParams(sp, { q: trimmed || undefined });
      startTransition(() => router.push(`${pathname}?${n.toString()}`));
    }, 320);
    return () => clearTimeout(t);
  }, [input, pathname, router, sp]);

  const matches = useMemo(() => {
    const t = input.trim().toLowerCase();
    if (t.length < 1) return [];
    return payload.allTasks
      .filter(
        (task) =>
          task.name.toLowerCase().includes(t) ||
          (task.description?.toLowerCase().includes(t) ?? false),
      )
      .slice(0, 10);
  }, [payload.allTasks, input]);

  const clearBlurTimeout = () => {
    if (blurTimeout.current) {
      clearTimeout(blurTimeout.current);
      blurTimeout.current = null;
    }
  };

  return (
    <>
      <div className="hidden h-5 w-px shrink-0 bg-border/70 sm:block" aria-hidden />
      
      <h1 className="hidden min-w-0 max-w-[140px] truncate text-sm font-semibold tracking-tight text-foreground sm:block lg:max-w-[220px] xl:max-w-xs">
        {payload.projectName}
      </h1>
      <div
        className="relative min-w-0 flex-1"
        data-project-task-search
      >
        <Search
          className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          type="search"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => {
            clearBlurTimeout();
            setSuggestOpen(true);
          }}
          onBlur={() => {
            blurTimeout.current = setTimeout(() => setSuggestOpen(false), 180);
          }}
          placeholder="Search tasks…"
          autoComplete="off"
          className={cn(
            "h-9 w-full min-w-[120px] rounded-lg border border-border/70 bg-muted/50 pl-9 pr-2.5 text-sm outline-none",
            "placeholder:text-muted-foreground/70",
            "focus-visible:border-ring focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-ring/30",
          )}
        />
        {suggestOpen && input.trim().length > 0 ? (
          <ul className="absolute top-full right-0 left-0 z-[100] mt-1 max-h-60 overflow-auto rounded-lg border border-border bg-popover py-1 text-sm shadow-lg">
            {matches.length === 0 ? (
              <li className="px-3 py-2 text-muted-foreground">No matching tasks</li>
            ) : (
              matches.map((task) => (
                <li key={task.id}>
                  <button
                    type="button"
                    className="flex w-full flex-col gap-0.5 px-3 py-2 text-left hover:bg-muted/80"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      clearBlurTimeout();
                      dispatchOpenProjectTask(task.id);
                      setSuggestOpen(false);
                    }}
                  >
                    <span className="font-medium">{task.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {task.status.name}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        ) : null}
      </div>
    </>
  );
}
