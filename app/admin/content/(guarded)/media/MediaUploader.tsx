"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { shrinkImage } from "@/lib/admin/shrink-image";
import { UploadForm } from "./UploadForm";

export function MediaUploader() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(file: File) {
    setUploading(true);
    setError(null);

    // Big photos are shrunk to the 1000px limit before they leave the browser.
    const formData = new FormData();
    formData.set("file", await shrinkImage(file));

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

