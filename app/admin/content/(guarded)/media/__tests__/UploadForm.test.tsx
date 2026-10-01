import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UploadForm } from "../UploadForm";

function makeFile(sizeBytes: number, name = "photo.jpg"): File {
  return new File([new Uint8Array(sizeBytes)], name, { type: "image/jpeg" });
}

describe("UploadForm", () => {
  it("shows an error and does not call onUpload for files over 5MB", async () => {
    const onUpload = vi.fn();
    render(<UploadForm onUpload={onUpload} />);
    const input = screen.getByLabelText(/choose image/i);
    await userEvent.upload(input, makeFile(6 * 1024 * 1024));
    expect(await screen.findByText(/exceeds 5MB/i)).toBeInTheDocument();
    expect(onUpload).not.toHaveBeenCalled();
  });

  it("calls onUpload with the file for a valid-size file", async () => {
    const onUpload = vi.fn();
    render(<UploadForm onUpload={onUpload} />);
    const input = screen.getByLabelText(/choose image/i);
    const file = makeFile(1024 * 1024);
    await userEvent.upload(input, file);
    expect(onUpload).toHaveBeenCalledWith(file);
  });
});

