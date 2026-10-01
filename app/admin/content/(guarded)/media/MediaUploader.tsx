"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadForm } from "./UploadForm";

export function MediaUploader() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(file: File) {
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.set("file", file);

    try {
      const res = await fetch("/admin/content/media/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Upload failed.");
        return;
      }
      router.refresh();
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <UploadForm onUpload={handleUpload} />
      {uploading && <p className="field-label mt-2">Uploading…</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

