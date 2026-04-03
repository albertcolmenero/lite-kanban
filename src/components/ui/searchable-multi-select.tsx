"use client";

import * as React from "react";
import { Combobox } from "@base-ui/react/combobox";
import { cn } from "@/lib/utils";
import { CheckIcon, PlusIcon, XIcon } from "lucide-react";

export type SearchableMultiSelectOption = {
  value: string;
  label: string;
  color?: string;
  disabled?: boolean;
};

const CREATE_VALUE_PREFIX = "__sms_create:";

export type SearchableMultiSelectCreateResult =
  | { ok: true; option: SearchableMultiSelectOption }
  | { ok: false; error: string };

export type SearchableMultiSelectProps = {
  options: SearchableMultiSelectOption[];
  /** Selected option `value`s. */
  value: string[];
  onValueChange: (values: string[]) => void;
  /** Shown in the input when nothing is selected. */
  placeholder?: string;
  /** Placeholder while searching (after at least one selection). */
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  inputGroupClassName?: string;
  "aria-labelledby"?: string;
  /**
   * `inline` keeps the list in the document flow (no portal). Use inside dialogs so focus
   * stays within the modal. `popover` portals the list to `document.body` (better for full pages).
   * @default "inline"
   */
  variant?: "inline" | "popover";
  /**
   * When set, a create row appears for non-empty input that is not an exact duplicate of an
   * existing option label (case-insensitive). Return `{ ok, option }` so the new `value` can
   * be selected; parent should merge `option` into `options` (or refresh) so chips resolve.
   */
  onCreateOption?: (
    trimmedName: string,
  ) => Promise<SearchableMultiSelectCreateResult>;
  /** Row label for the create action. @default Create "name" */
  formatCreateRow?: (trimmedName: string) => string;
  /** @default 80 */
  maxCreateLength?: number;
};

type Item = SearchableMultiSelectOption;

function makeCreateItem(
  trimmed: string,
  formatCreateRow: (q: string) => string,
  rowDisabled: boolean,
): SearchableMultiSelectOption {
  return {
    value: `${CREATE_VALUE_PREFIX}${encodeURIComponent(trimmed)}`,
    label: formatCreateRow(trimmed),
    disabled: rowDisabled,
  };
}

function parseCreateDraft(value: string): string | null {
  if (!value.startsWith(CREATE_VALUE_PREFIX)) return null;
  try {
    return decodeURIComponent(value.slice(CREATE_VALUE_PREFIX.length));
  } catch {
    return null;
  }
}

function isCreateValue(value: string) {
  return value.startsWith(CREATE_VALUE_PREFIX);
}

export function SearchableMultiSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyText = "No matches",
  disabled = false,
  id,
  className,
  inputGroupClassName,
  "aria-labelledby": ariaLabelledBy,
  variant = "inline",
  onCreateOption,
  formatCreateRow = (q) => `Create "${q}"`,
  maxCreateLength = 80,
}: SearchableMultiSelectProps) {
  const [inputValue, setInputValue] = React.useState("");
  const [creating, setCreating] = React.useState(false);
  const [createError, setCreateError] = React.useState<string | null>(null);

  const { contains } = Combobox.useFilter({ multiple: true });

  const selectedItems = React.useMemo(
    () =>
      value
        .map((v) => options.find((o) => o.value === v))
        .filter((o): o is Item => o != null),
    [value, options],
  );

  const filterQuery = inputValue.trim();

  const duplicateLabel = React.useMemo(() => {
    if (!filterQuery) return false;
    const lower = filterQuery.toLowerCase();
    return options.some((i) => i.label.trim().toLowerCase() === lower);
  }, [options, filterQuery]);

  const showCreate =
    Boolean(onCreateOption) &&
    filterQuery.length >= 1 &&
    filterQuery.length <= maxCreateLength &&
    !duplicateLabel &&
    !creating;

  const filteredOpts = React.useMemo(() => {
    if (!onCreateOption) return options;
    return options.filter((item) => contains(item, filterQuery));
  }, [options, filterQuery, contains, onCreateOption]);

  const filteredItems = React.useMemo(() => {
    if (!onCreateOption) return undefined;
    const createRow = showCreate
      ? makeCreateItem(filterQuery, formatCreateRow, creating)
      : null;
    return createRow ? [createRow, ...filteredOpts] : filteredOpts;
  }, [
    onCreateOption,
    showCreate,
    filterQuery,
    formatCreateRow,
    creating,
    filteredOpts,
  ]);

  const handleValueChange = React.useCallback(
    (next: Item[] | null) => {
      const arr = next ?? [];
      if (onCreateOption) {
        const touched = arr.find((o) => isCreateValue(o.value));
        if (touched) {
          const draft = parseCreateDraft(touched.value);
          if (draft != null) {
            void (async () => {
              setCreating(true);
              setCreateError(null);
              const res = await onCreateOption(draft);
              setCreating(false);
              if (!res.ok) {
                setCreateError(res.error);
                return;
              }
              setInputValue("");
              onValueChange(
                value.includes(res.option.value)
                  ? value
                  : [...value, res.option.value],
              );
            })();
          }
          return;
        }
      }
      onValueChange(arr.map((o) => o.value));
    },
    [onCreateOption, onValueChange, value],
  );

  if (options.length === 0 && !onCreateOption) {
    return (
      <p className={cn("text-sm text-muted-foreground", className)}>
        No options available.
      </p>
    );
  }

  const listSection = (
    <>
      <Combobox.Empty className="px-3 py-2 text-sm text-muted-foreground">
        {emptyText}
      </Combobox.Empty>
      <Combobox.List
        className={cn(
          "max-h-48 overflow-y-auto py-1 outline-none",
          variant === "inline" &&
            "rounded-b-lg border-t border-border/80 bg-popover",
        )}
      >
        {(item: Item) => {
          const isCreate = isCreateValue(item.value);
          return (
            <Combobox.Item
              key={item.value}
              value={item}
              disabled={item.disabled}
              className={cn(
                "grid cursor-default grid-cols-[1rem_1fr] items-center gap-2 py-2 pr-3 pl-2.5 text-sm outline-none select-none",
                "data-disabled:pointer-events-none data-disabled:opacity-50",
                "[@media(hover:hover)]:[&[data-highlighted]]:bg-accent [@media(hover:hover)]:[&[data-highlighted]]:text-accent-foreground",
                isCreate && "font-medium text-primary",
              )}
            >
              <Combobox.ItemIndicator className="col-start-1 flex justify-center text-primary">
                <CheckIcon className="size-3.5" aria-hidden />
              </Combobox.ItemIndicator>
              <div className="col-start-2 flex min-w-0 items-center gap-2">
                {isCreate ? (
                  <PlusIcon className="size-3.5 shrink-0" aria-hidden />
                ) : item.color ? (
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                ) : null}
                <span className="truncate">{item.label}</span>
              </div>
            </Combobox.Item>
          );
        }}
      </Combobox.List>
    </>
  );

  const rootDisabled = disabled || creating;

  const creatableProps = onCreateOption
    ? {
        filteredItems,
        filter: null,
        inputValue,
        onInputValueChange: (v: string) => {
          setInputValue(v);
          setCreateError(null);
        },
      }
    : {};

  return (
    <div className={cn("w-full", className)}>
      {createError ? (
        <p className="mb-1.5 text-sm text-destructive" role="alert">
          {createError}
        </p>
      ) : null}
      <Combobox.Root
        inline={variant === "inline"}
        items={options}
        {...creatableProps}
        multiple
        disabled={rootDisabled}
        value={selectedItems}
        onValueChange={handleValueChange}
        isItemEqualToValue={(a, b) => a.value === b.value}
        autoHighlight
      >
        <Combobox.InputGroup
          aria-labelledby={ariaLabelledBy}
          className={cn(
            "flex min-h-8 w-full flex-wrap items-center gap-0.5 rounded-lg border border-input bg-transparent px-1.5 py-1 transition-colors outline-none",
            "focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
            "dark:bg-input/30",
            variant === "inline" && "rounded-b-none border-b-0",
            inputGroupClassName,
          )}
        >
          <Combobox.Chips className="flex min-w-0 flex-1 flex-wrap items-center gap-0.5">
            <Combobox.Value>
              {(selected: Item[]) => (
                <React.Fragment>
                  {selected.map((item) => (
                    <Combobox.Chip
                      key={item.value}
                      className={cn(
                        "flex max-w-full items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-xs outline-none",
                        "[@media(hover:hover)]:[&[data-highlighted]]:bg-primary [@media(hover:hover)]:[&[data-highlighted]]:text-primary-foreground",
                        "focus-within:bg-primary focus-within:text-primary-foreground",
                      )}
                      aria-label={item.label}
                    >
                      {item.color ? (
                        <span
                          className="size-2 shrink-0 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                      ) : null}
                      <span className="min-w-0 truncate">{item.label}</span>
                      <Combobox.ChipRemove
                        className="rounded p-0.5 text-inherit hover:bg-background/20"
                        aria-label={`Remove ${item.label}`}
                      >
                        <XIcon className="size-3" aria-hidden />
                      </Combobox.ChipRemove>
                    </Combobox.Chip>
                  ))}
                  <Combobox.Input
                    id={id}
                    placeholder={
                      selected.length > 0 ? searchPlaceholder : placeholder
                    }
                    className="min-h-6 min-w-[6rem] flex-1 rounded-md border-0 bg-transparent py-0.5 pr-1 pl-1 text-sm outline-none placeholder:text-muted-foreground"
                  />
                </React.Fragment>
              )}
            </Combobox.Value>
          </Combobox.Chips>
        </Combobox.InputGroup>

        {variant === "inline" ? (
          <div
            className={cn(
              "overflow-hidden rounded-b-lg border border-t-0 border-border bg-popover ring-1 ring-foreground/10",
            )}
          >
            {listSection}
          </div>
        ) : (
          <Combobox.Portal>
            <Combobox.Positioner className="z-[200] outline-none" sideOffset={4}>
              <Combobox.Popup
                className={cn(
                  "max-h-[min(var(--available-height),16rem)] w-[var(--anchor-width)] max-w-[var(--available-width)] origin-[var(--transform-origin)]",
                  "overflow-y-auto overscroll-contain rounded-lg border border-border bg-popover py-1 text-popover-foreground shadow-md",
                  "outline-none ring-1 ring-foreground/10",
                  "transition-[transform,scale,opacity]",
                  "data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
                  "data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
                )}
              >
                {listSection}
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        )}
      </Combobox.Root>
    </div>
  );
}
