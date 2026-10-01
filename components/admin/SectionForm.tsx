"use client";

import { useState } from "react";

type Fields = Record<string, unknown>;

function isPlainObject(v: unknown): v is Fields {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function SectionForm({
  sectionKey,
  fields,
  onSave,
}: {
  sectionKey: string;
  fields: Fields;
  onSave: (fields: Fields) => void;
}) {
  const [draft, setDraft] = useState<Fields>(fields);

  function setPath(path: string[], value: string) {
    setDraft((prev) => {
      const next = structuredClone(prev);
      let cursor: Fields = next;
      for (const key of path.slice(0, -1)) {
        cursor = cursor[key] as Fields;
      }
      cursor[path[path.length - 1]] = value;
      return next;
    });
  }

  function renderFields(obj: Fields, path: string[] = []): React.ReactNode {
    return Object.entries(obj).map(([key, value]) => {
      const fullPath = [...path, key];
      const id = fullPath.join(".");

      if (Array.isArray(value)) {
        return (
          <p key={id} className="field-label">
            {id} — {value.length} items — edit via its own list section, not here
          </p>
        );
      }
      if (isPlainObject(value)) {
        return (
          <fieldset key={id} className="rounded-2xl border border-ink/10 p-4">
            <legend className="field-label px-1">{id}</legend>
            <div className="flex flex-col gap-3">{renderFields(value, fullPath)}</div>
          </fieldset>
        );
      }
      return (
        <div key={id}>
          <label className="field-label" htmlFor={id}>{id}</label>
          <input
            id={id}
            className="field mt-2"
            value={String(value ?? "")}
            onChange={(e) => setPath(fullPath, e.target.value)}
          />
        </div>
      );
    });
  }

  function stripArrays(obj: Fields): Fields {
    const result: Fields = {};
    for (const [key, value] of Object.entries(obj)) {
      if (Array.isArray(value)) continue;
      result[key] = isPlainObject(value) ? stripArrays(value) : value;
    }
    return result;
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(stripArrays(draft));
      }}
      aria-label={`Edit ${sectionKey}`}
    >
      {renderFields(draft)}
      <button type="submit" className="btn btn-primary self-start">Save</button>
    </form>
  );
}

