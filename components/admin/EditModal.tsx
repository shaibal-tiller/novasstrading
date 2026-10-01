"use client";

import { type ReactNode, useState } from "react";
import type { ItemField } from "@/lib/admin/section-registry";
import { MediaPicker, mediaSrc } from "./MediaPicker";

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
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/95 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-2xl bg-paper p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="field-label">{title}</h2>
          <button type="button" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** One input per `ItemField.kind`, reused both for the top-level scalar
 * kinds and recursively for each field inside the `item` kind's form. */
function FieldInput({
  fieldId,
  field,
  value,
  onChange,
  onOpenMedia,
}: {
  fieldId: string;
  field: Pick<ItemField, "kind" | "options" | "list">;
  value: unknown;
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
              {opt}
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
            <span className="text-sm">{path}</span>
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
          type={field.kind === "url" ? "url" : "text"}
          className="field mt-2"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}

export function EditModal({
  id,
  kind,
  currentValue,
  itemFields,
  options,
  onSave,
  onDelete,
  onClose,
}: {
  id: string;
  kind: EditModalKind;
  currentValue: unknown;
  itemFields?: ItemField[];
  /** Enum options for the top-level "enum" kind — passed in, never looked up
   * internally, to keep this component decoupled from SECTION_REGISTRY. */
  options?: string[];
  onSave: (value: unknown) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const [showMediaPicker, setShowMediaPicker] = useState(false);

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
  }

  if (kind === "text" || kind === "url" || kind === "textarea") {
    return (
      <ModalShell title={`Edit ${id}`} onClose={onClose}>
        <div>
          <label className="field-label" htmlFor="edit-field">
            {id}
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
              type={kind === "url" ? "url" : "text"}
              className="field mt-2"
              value={scalarValue}
              onChange={(e) => setScalarValue(e.target.value)}
            />
          )}
        </div>
        <button
          type="button"
          className="btn btn-primary self-start"
          onClick={() => onSave(isArrayBackedTextarea ? splitLines(scalarValue) : scalarValue)}
        >
          Save
        </button>
      </ModalShell>
    );
  }

  if (kind === "enum") {
    return (
      <ModalShell title={`Edit ${id}`} onClose={onClose}>
        <div>
          <label className="field-label" htmlFor="edit-field">
            {id}
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
        <button type="button" className="btn btn-primary self-start" onClick={() => onSave(enumValue)}>
          Save
        </button>
      </ModalShell>
    );
  }

  if (kind === "media" || kind === "document") {
    const path = typeof currentValue === "string" ? currentValue : "";
    return (
      <ModalShell title={`Edit ${id}`} onClose={onClose}>
        <FieldInput
          fieldId="edit-field"
          field={{ kind }}
          value={path}
          onChange={() => {
            // Read-only preview — replacement happens through MediaPicker.
          }}
          onOpenMedia={() => setShowMediaPicker(true)}
        />
        {showMediaPicker && (
          <MediaPicker
            accept={kind === "media" ? "image" : "document"}
            onSelect={(newPath) => {
              setShowMediaPicker(false);
              onSave(newPath);
            }}
            onClose={() => setShowMediaPicker(false)}
          />
        )}
      </ModalShell>
    );
  }

  // --- item ---------------------------------------------------------------
  const activeField = (itemFields ?? []).find((f) => f.key === activeItemMediaKey);

  return (
    <ModalShell title={isExistingItem ? `Edit ${id}` : `Add ${id}`} onClose={onClose}>
      <div className="flex flex-col gap-4">
        {(itemFields ?? []).map((field) => {
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
                onChange={(v) => setItemFieldValue(field.key, v)}
                onOpenMedia={() => setActiveItemMediaKey(field.key)}
              />
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3">
        {isExistingItem && onDelete && (
          <button type="button" className="btn btn-outline" onClick={onDelete}>
            Delete this item
          </button>
        )}
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => onSave(itemValues)}
        >
          {isExistingItem ? "Save" : "Add"}
        </button>
      </div>

      {activeField && (activeField.kind === "media" || activeField.kind === "document") && (
        <MediaPicker
          accept={activeField.kind === "media" ? "image" : "document"}
          onSelect={(newPath) => {
            setItemFieldValue(activeField.key, newPath);
            setActiveItemMediaKey(null);
          }}
          onClose={() => setActiveItemMediaKey(null)}
        />
      )}
    </ModalShell>
  );
}

