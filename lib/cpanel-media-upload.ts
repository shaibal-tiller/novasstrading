import "server-only";

export async function uploadFileToCpanel(
  bytes: Buffer,
  filename: string,
  sessionToken: string
): Promise<string> {
  const url = process.env.CPANEL_API_URL;
  const key = process.env.CPANEL_API_KEY;
  if (!url || !key) throw new Error("CPANEL_API_URL/CPANEL_API_KEY not set");

  const form = new FormData();
  form.set("file", new Blob([bytes]), filename);

  // The PHP /media/upload-file endpoint requires BOTH the API key and a
  // valid admin session — X-Api-Key alone gets a 401.
  const res = await fetch(`${url}/media/upload-file`, {
    method: "POST",
    headers: { "X-Api-Key": key, Authorization: `Bearer ${sessionToken}` },
    body: form,
  });
  if (!res.ok) throw new Error(`cPanel upload failed: ${res.status}`);
  const data = await res.json();
  return data.path as string;
}

