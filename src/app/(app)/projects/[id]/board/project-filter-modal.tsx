"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
import { boardViewFromSearchParams } from "@/lib/tasks/task-filters";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  SerializedPriority,
  SerializedProjectLabel,
  SerializedStatus,
} from "@/app/(app)/projects/[id]/board/types";
import { mergeSearchParams } from "@/lib/url/merge-search-params";
import { ListFilter } from "lucide-react";

export function ProjectFilterModal({
  statuses,
  priorities,
  labels,
}: {
  statuses: SerializedStatus[];
  priorities: SerializedPriority[];
  labels: SerializedProjectLabel[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  const view = useMemo(
    () =>
      boardViewFromSearchParams(
        Object.fromEntries(sp.entries()) as Record<string, string>,
      ),
    [sp],
  );

  const priority = sp.get("priority") ?? "";
  const statusCsv = sp.get("status") ?? "";
  const labelsCsv = sp.get("labels") ?? "";

  const selectedLabels = useMemo(
    () => new Set(labelsCsv.split(",").filter(Boolean)),
    [labelsCsv],
  );

  const push = useCallback(
    (patch: Record<string, string | undefined>) => {
      const n = mergeSearchParams(sp, patch);
      start(() => router.push(`${pathname}?${n.toString()}`));
    },
    [router, pathname, sp],
  );

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (priority) n++;
    if (statusCsv) n++;
    if (labelsCsv) n++;
    return n;
  }, [priority, statusCsv, labelsCsv]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            aria-label="Filters"
          />
        }
      >
        <ListFilter className="size-4" />
        <span className="hidden sm:inline">Filters</span>
        {activeFilterCount > 0 ? (
          <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
            {activeFilterCount}
          </span>
        ) : null}
      </DialogTrigger>
      <DialogContent className="max-h-[min(90vh,560px)] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>View and filters</DialogTitle>
          <DialogDescription>
            Choose how the board is displayed and narrow tasks by priority,
            status, or labels.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 pt-1">
          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Layout
            </Label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={view === "grid" ? "default" : "outline"}
                disabled={pending}
                className="min-w-[4.5rem] flex-1"
                onClick={() => {
                  push({ view: undefined });
                }}
              >
                Grid
              </Button>
              <Button
                type="button"
                size="sm"
                variant={view === "list" ? "default" : "outline"}
                disabled={pending}
                className="min-w-[4.5rem] flex-1"
                onClick={() => {
                  push({ view: "list" });
                }}
              >
                List
              </Button>
              <Button
                type="button"
                size="sm"
                variant={view === "inbox" ? "default" : "outline"}
                disabled={pending}
                className="min-w-[4.5rem] flex-1"
                onClick={() => {
                  push({ view: "inbox" });
                }}
              >
                Inbox
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="filter-priority">Priority</Label>
            <Select
              value={priority || "__all__"}
              onValueChange={(v) =>
                push({
                  priority: !v || v === "__all__" ? undefined : v,
                })
              }
              disabled={pending}
            >
              <SelectTrigger id="filter-priority" className="w-full">
                <SelectValue placeholder="All priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All priorities</SelectItem>
                {priorities.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="filter-status">Status</Label>
            <Select
              value={
                statusCsv && !statusCsv.includes(",")
                  ? statusCsv
                  : "__all__"
              }
              onValueChange={(v) =>
                push({
                  status: !v || v === "__all__" ? undefined : v,
                })
              }
              disabled={pending}
            >
              <SelectTrigger id="filter-status" className="w-full">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All statuses</SelectItem>
                {statuses.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {statusCsv.includes(",") ? (
              <p className="text-xs text-muted-foreground">
                Multiple statuses were set from an older view. Pick one status
                here to simplify, or clear with &quot;All statuses&quot;.
              </p>
            ) : null}
          </div>

          {labels.length > 0 ? (
            <div className="space-y-2">
              <Label>Labels</Label>
              <div className="flex flex-wrap gap-2">
                {labels.map((lb) => (
                  <label
                    key={lb.id}
                    className="flex cursor-pointer items-center gap-2 rounded-md border border-border/60 bg-muted/30 px-2.5 py-1.5 text-sm transition-colors hover:bg-muted/50"
                  >
                    <input
                      type="checkbox"
                      className="size-3.5 rounded border-input"
                      checked={selectedLabels.has(lb.id)}
                      onChange={() => {
                        const next = new Set(selectedLabels);
                        if (next.has(lb.id)) next.delete(lb.id);
                        else next.add(lb.id);
                        const csv = [...next].join(",");
                        push({ labels: csv || undefined });
                      }}
                      disabled={pending}
                    />
                    <span
                      className="inline-block size-2 rounded-full"
                      style={{ backgroundColor: lb.color }}
                    />
                    {lb.name}
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="w-full"
            disabled={pending}
            onClick={() => {
              push({
                priority: undefined,
                status: undefined,
                labels: undefined,
              });
            }}
          >
            Clear filters
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
