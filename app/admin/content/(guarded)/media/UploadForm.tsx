"use client";

import { useState } from "react";

const MAX_BYTES = 5 * 1024 * 1024;

export function UploadForm({ onUpload }: { onUpload: (file: File) => void }) {
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <label className="field-label" htmlFor="media-file">Choose image</label>
      <input
        id="media-file"
        type="file"
        accept="image/*"
        className="field mt-2"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          if (file.size > MAX_BYTES) {
            setError(`"${file.name}" exceeds 5MB (${(file.size / 1024 / 1024).toFixed(1)}MB) — choose a smaller file.`);
            e.target.value = "";
            return;
          }
          setError(null);
          onUpload(file);
        }}
      />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

