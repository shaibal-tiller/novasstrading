"use client";

import { type FormEvent, type ReactNode, useRef, useState } from "react";
import type { ItemField } from "@/lib/admin/section-registry";
import { weakPhotoDescription } from "@/lib/admin/tab-keys";
import { hasTitle, urlError } from "@/lib/admin/validate";
import { MediaPicker, mediaSrc } from "./MediaPicker";
import { useDialog } from "./useDialog";

export type EditModalKind = "text" | "textarea" | "url" | "enum" | "media" | "document" | "item";

type ItemFieldsObject = Record<string, unknown>;

/**
 * Splits a "one value per line" textarea's raw text back into a string
 * array. A line that is empty or all-whitespace is dropped (typically a
 * trailing blank line the textarea leaves behind); every other line is kept
 * verbatim, including internal whitespace, so `array.join("\n")` followed by
 * this function round-trips a normal array exactly. See
 * `lib/admin/section-registry.tsx`'s header for the documented contract.
 */
function splitLines(text: string): string[] {
  return text.split("\n").filter((line) => line.trim().length > 0);
}

function joinLines(value: unknown): string {
  return Array.isArray(value) ? value.join("\n") : typeof value === "string" ? value : "";
}

function ModalShell({
  title,
  onClose,
  onSubmit,
  overlay,
  children,
}: {
  title: string;
  onClose: () => void;
  /** When given, the body is a form: Enter in a single-line box submits it. */
  onSubmit?: () => void;
  /** Rendered outside the form (e.g. the media picker). */
  overlay?: ReactNode;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useDialog(ref, onClose);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/95 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        ref={ref}
        className="flex max-h-[85vh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-2xl bg-paper p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="field-label">{title}</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-2xl leading-none text-ink hover:bg-ink/5"
          >
            ×
          </button>
        </div>
        {onSubmit ? (
          <form
            noValidate
            className="flex flex-col gap-4"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              onSubmit();
            }}
          >
            {children}
          </form>
        ) : (
          children
        )}
        {overlay}
      </div>
    </div>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p id={`${id}-error`} role="alert" className="mt-2 text-sm text-red-700">
      {message}
    </p>
  ) : null;
}

/** aria attributes that tie an input to its error message. */
function invalidProps(id: string, message?: string) {
  return message ? { "aria-invalid": true as const, "aria-describedby": `${id}-error` } : {};
}

/** One input per `ItemField.kind`, reused both for the top-level scalar
 * kinds and recursively for each field inside the `item` kind's form. */
function FieldInput({
  fieldId,
  field,
  value,
  error,
  onChange,
  onOpenMedia,
}: {
  fieldId: string;
  field: Pick<ItemField, "kind" | "options" | "list" | "optionLabels">;
  value: unknown;
  error?: string;
  onChange: (next: unknown) => void;
  onOpenMedia: () => void;
}) {
  switch (field.kind) {
    case "textarea": {
      const isList = field.list === true || Array.isArray(value);
      return (
        <textarea
          id={fieldId}
          className="field mt-2"
          value={joinLines(value)}
          onChange={(e) => onChange(isList ? splitLines(e.target.value) : e.target.value)}
          {...invalidProps(fieldId, error)}
        />
      );
    }
    case "enum":
      return (
        <select
          id={fieldId}
          className="field mt-2"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
        >
          {(field.options ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {field.optionLabels?.[opt] ?? opt}
            </option>
          ))}
        </select>
      );
    case "media":
    case "document": {
      const path = typeof value === "string" ? value : "";
      return (
        <div className="mt-2 flex flex-col gap-2">
          {field.kind === "media" ? (
            path ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mediaSrc(path)}
                alt="Current selection"
                className="h-32 w-32 rounded-lg object-cover"
              />
            ) : (
              <p className="field-label">No image selected.</p>
            )
          ) : path ? (
            <span className="break-all text-sm">{path}</span>
          ) : (
            <p className="field-label">No document selected.</p>
          )}
          <button type="button" className="btn btn-outline self-start" onClick={onOpenMedia}>
            Replace
          </button>
        </div>
      );
    }
    case "url":
    case "text":
    default:
      return (
        <input
          id={fieldId}
          // Not type="url": the browser's own pop-up message would replace our plain-language one.
          type="text"
          inputMode={field.kind === "url" ? "url" : undefined}
          className="field mt-2"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          {...invalidProps(fieldId, error)}
        />
      );
  }
}

export function EditModal({
  id,
  label,
  kind,
  currentValue,
  itemFields,
  titleField,
  options,
  onSave,
  onDelete,
  deleteBlockedReason,
  onClose,
}: {
  /** Internal id of the thing being edited; only shown when no human `label` is given. */
  id: string;
  /** Human name: the field's label, or the list's label for an item. */
  label?: string;
  kind: EditModalKind;
  currentValue: unknown;
  itemFields?: ItemField[];
  /** Which item field names a list row; a NEW row may not be added with it blank. */
  titleField?: string;
  /** Enum options for the top-level "enum" kind — passed in, never looked up
   * internally, to keep this component decoupled from SECTION_REGISTRY. */
  options?: string[];
  onSave: (value: unknown) => void;
  onDelete?: () => void;
  /** When set, "Delete this item" is disabled and this sentence explains why. */
  deleteBlockedReason?: string;
  onClose: () => void;
}) {
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const name = label ?? id;
  // Error text per field key ("" is the single top-level field).
  const [errors, setErrors] = useState<Record<string, string>>({});
  const clearError = (key: string) => setErrors((prev) => (prev[key] ? { ...prev, [key]: "" } : prev));

  // --- text | textarea | url --------------------------------------------
  const isArrayBackedTextarea = kind === "textarea" && Array.isArray(currentValue);
  const [scalarValue, setScalarValue] = useState<string>(() =>
    kind === "textarea" ? joinLines(currentValue) : typeof currentValue === "string" ? currentValue : ""
  );

  // --- enum ----------------------------------------------------------------
  const [enumValue, setEnumValue] = useState<string>(() =>
    typeof currentValue === "string" ? currentValue : ""
  );

  // --- item ------------------------------------------------------------
  const isExistingItem = kind === "item" && currentValue != null;
  const [itemValues, setItemValues] = useState<ItemFieldsObject>(() => {
    const src = (currentValue as ItemFieldsObject | null) ?? {};
    const obj: ItemFieldsObject = {};
    for (const field of itemFields ?? []) {
      obj[field.key] = field.key in src ? src[field.key] : field.list ? [] : "";
    }
    return obj;
  });
  const [activeItemMediaKey, setActiveItemMediaKey] = useState<string | null>(null);

  function setItemFieldValue(key: string, value: unknown) {
    setItemValues((prev) => ({ ...prev, [key]: value }));
    clearError(key);
  }

  if (kind === "text" || kind === "url" || kind === "textarea") {
    const submit = () => {
      const error = kind === "url" ? urlError(scalarValue) : null;
      if (error) {
        setErrors({ "": error });
        return;
      }
      onSave(isArrayBackedTextarea ? splitLines(scalarValue) : scalarValue);
    };
    return (
      <ModalShell title={`Edit ${name}`} onClose={onClose} onSubmit={submit}>
        <div>
          <label className="field-label" htmlFor="edit-field">
            {name}
          </label>
          {kind === "textarea" ? (
            <textarea
              id="edit-field"
              className="field mt-2"
              value={scalarValue}
              onChange={(e) => setScalarValue(e.target.value)}
            />
          ) : (
            <input
              id="edit-field"
              // Not type="url": the browser's own pop-up message would replace our plain-language one.
              type="text"
              inputMode={kind === "url" ? "url" : undefined}
              className="field mt-2"
              value={scalarValue}
              onChange={(e) => {
                setScalarValue(e.target.value);
                clearError("");
              }}
              {...invalidProps("edit-field", errors[""])}
            />
          )}
          <FieldError id="edit-field" message={errors[""]} />
        </div>
        <button type="submit" className="btn btn-primary self-start">
          Save
        </button>
      </ModalShell>
    );
  }

  if (kind === "enum") {
    return (
      <ModalShell title={`Edit ${name}`} onClose={onClose} onSubmit={() => onSave(enumValue)}>
        <div>
          <label className="field-label" htmlFor="edit-field">
            {name}
          </label>
          <select
            id="edit-field"
            className="field mt-2"
            value={enumValue}
            onChange={(e) => setEnumValue(e.target.value)}
          >
            {(options ?? []).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-primary self-start">
          Save
        </button>
      </ModalShell>
    );
  }

  if (kind === "media" || kind === "document") {
    const path = typeof currentValue === "string" ? currentValue : "";
    return (
      <ModalShell
        title={`Edit ${name}`}
        onClose={onClose}
        overlay={
          showMediaPicker && (
            <MediaPicker
              accept={kind === "media" ? "image" : "document"}
              onSelect={(newPath) => {
                setShowMediaPicker(false);
                onSave(newPath);
              }}
              onClose={() => setShowMediaPicker(false)}
            />
          )
        }
      >
        <FieldInput
          fieldId="edit-field"
          field={{ kind }}
          value={path}
          onChange={() => {
            // Read-only preview — replacement happens through MediaPicker.
          }}
          onOpenMedia={() => setShowMediaPicker(true)}
        />
      </ModalShell>
    );
  }

  // --- item ---------------------------------------------------------------
  const activeField = (itemFields ?? []).find((f) => f.key === activeItemMediaKey);
  const existingTitle = isExistingItem && titleField ? String(itemValues[titleField] ?? "").trim() : "";
  const itemTitle = isExistingItem
    ? `Edit ${name}${existingTitle ? ` — ${existingTitle}` : ""}`
    : label
      ? `Add to ${name}`
      : `Add ${id}`;

  function submitItem() {
    const found: Record<string, string> = {};
    for (const field of itemFields ?? []) {
      const error = field.kind === "url" ? urlError(itemValues[field.key]) : null;
      if (error) found[field.key] = error;
    }
    const titleBox = (itemFields ?? []).find((f) => f.key === titleField);
    if (!isExistingItem && titleField && titleBox && !hasTitle(itemValues, titleField)) {
      found[titleField] = `Please fill in “${titleBox.label}” before adding.`;
    }
    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }
    onSave(itemValues);
  }

  return (
    <ModalShell
      title={itemTitle}
      onClose={onClose}
      onSubmit={submitItem}
      overlay={
        activeField &&
        (activeField.kind === "media" || activeField.kind === "document") && (
          <MediaPicker
            accept={activeField.kind === "media" ? "image" : "document"}
            onSelect={(newPath) => {
              setItemFieldValue(activeField.key, newPath);
              setActiveItemMediaKey(null);
            }}
            onClose={() => setActiveItemMediaKey(null)}
          />
        )
      }
    >
      <div className="flex flex-col gap-4">
        {(itemFields ?? []).filter((f) => !f.hidden).map((field) => {
          const fieldId = `item-field-${field.key}`;
          return (
            <div key={field.key}>
              <label className="field-label" htmlFor={fieldId}>
                {field.label}
              </label>
              <FieldInput
                fieldId={fieldId}
                field={field}
                value={itemValues[field.key]}
                error={errors[field.key]}
                onChange={(v) => setItemFieldValue(field.key, v)}
                onOpenMedia={() => setActiveItemMediaKey(field.key)}
              />
              <FieldError id={fieldId} message={errors[field.key]} />
              {id.startsWith("portfolio.photos") && field.key === "alt" && weakPhotoDescription(String(itemValues.alt ?? "")) && (
                <p className="mt-1.5 text-xs text-[#8a5a00]">
                  Tip: describe what is in the picture (for example “Navy wool blazer over a white blouse”). Google and
                  screen readers use this text, and a file name like IMG_1234 does not help.
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3">
        {isExistingItem && onDelete && (
          <button
            type="button"
            className="btn btn-outline disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onDelete}
            disabled={!!deleteBlockedReason}
          >
            Delete this item
          </button>
        )}
        {isExistingItem && onDelete && deleteBlockedReason && (
          <p className="basis-full text-sm text-ink-muted">{deleteBlockedReason}</p>
        )}
        <button type="submit" className="btn btn-primary">
          {isExistingItem ? "Save" : "Add"}
        </button>
      </div>
    </ModalShell>
  );
}
