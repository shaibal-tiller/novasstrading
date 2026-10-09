import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ItemField } from "@/lib/admin/section-registry";
import { EditModal } from "../EditModal";

// Isolate EditModal's own logic from MediaPicker's internals (which have
// their own full test suite in MediaPicker.test.tsx) — stub it out with a
// button that immediately fires onSelect, and assert EditModal wires the
// right `accept` prop through.
vi.mock("../MediaPicker", () => ({
  MediaPicker: ({
    accept,
    onSelect,
  }: {
    accept: "image" | "document";
    onSelect: (path: string) => void;
  }) => (
    <button type="button" onClick={() => onSelect(`media/new-${accept}.file`)}>
      mock-select-{accept}
    </button>
  ),
  mediaSrc: (path: string) => `/mock-src/${path}`,
}));

describe("EditModal", () => {
  it("kind=text: renders a labeled input and calls onSave with the edited value", async () => {
    const onSave = vi.fn();
    render(
      <EditModal
        id="hero.eyebrow"
        kind="text"
        currentValue="Old value"
        onSave={onSave}
        onClose={vi.fn()}
      />
    );

    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("Old value");
    await userEvent.clear(input);
    await userEvent.type(input, "New value");
    await userEvent.click(screen.getByRole("button", { name: /^save$/i }));

    expect(onSave).toHaveBeenCalledWith("New value");
  });

  it("kind=url: renders a url input and calls onSave with the edited value", async () => {
    const onSave = vi.fn();
    render(
      <EditModal
        id="site.url"
        kind="url"
        currentValue="https://old.example.com"
        onSave={onSave}
        onClose={vi.fn()}
      />
    );

    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("inputmode", "url");
    await userEvent.clear(input);
    await userEvent.type(input, "https://new.example.com");
    await userEvent.click(screen.getByRole("button", { name: /^save$/i }));

    expect(onSave).toHaveBeenCalledWith("https://new.example.com");
  });

  it("kind=textarea (plain string): saves the edited string unchanged, no array split", async () => {
    const onSave = vi.fn();
    render(
      <EditModal
        id="hero.body"
        kind="textarea"
        currentValue="A single paragraph."
        onSave={onSave}
        onClose={vi.fn()}
      />
    );

    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveValue("A single paragraph.");
    await userEvent.clear(textarea);
    await userEvent.type(textarea, "Edited paragraph.");
    await userEvent.click(screen.getByRole("button", { name: /^save$/i }));

    expect(onSave).toHaveBeenCalledWith("Edited paragraph.");
  });

  it("kind=textarea (array-backed): loads one-per-line and splits back to an array on save", async () => {
    const onSave = vi.fn();
    render(
      <EditModal
        id="portfolio.extra.items"
        kind="textarea"
        currentValue={["Loungewear", "Sleepwear"]}
        onSave={onSave}
        onClose={vi.fn()}
      />
    );

    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveValue("Loungewear\nSleepwear");

    // Save unchanged — round trip must reproduce the original array exactly.
    await userEvent.click(screen.getByRole("button", { name: /^save$/i }));
    expect(onSave).toHaveBeenCalledWith(["Loungewear", "Sleepwear"]);
  });

  it("kind=textarea (array-backed): appending a line and a trailing blank line still round-trips cleanly", async () => {
    const onSave = vi.fn();
    render(
      <EditModal
        id="portfolio.extra.items"
        kind="textarea"
        currentValue={["Loungewear"]}
        onSave={onSave}
        onClose={vi.fn()}
      />
    );

    const textarea = screen.getByRole("textbox");
    await userEvent.type(textarea, "\nSleepwear\n");
    await userEvent.click(screen.getByRole("button", { name: /^save$/i }));

    expect(onSave).toHaveBeenCalledWith(["Loungewear", "Sleepwear"]);
  });

  it("kind=enum: renders a select from the options prop and saves the chosen value", async () => {
    const onSave = vi.fn();
    render(
      <EditModal
        id="sourcing.pillars.0.icon"
        kind="enum"
        currentValue="clock"
        options={["clock", "thumb", "check", "gear"]}
        onSave={onSave}
        onClose={vi.fn()}
      />
    );

    const select = screen.getByRole("combobox");
    expect(select).toHaveValue("clock");
    await userEvent.selectOptions(select, "gear");
    await userEvent.click(screen.getByRole("button", { name: /^save$/i }));

    expect(onSave).toHaveBeenCalledWith("gear");
  });

  it("kind=media: shows a preview image, opens MediaPicker via Replace, and saves the new path", async () => {
    const onSave = vi.fn();
    render(
      <EditModal
        id="products.items.0.image"
        kind="media"
        currentValue="media/old.webp"
        onSave={onSave}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByRole("img")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /replace/i }));
    await userEvent.click(screen.getByRole("button", { name: /mock-select-image/i }));

    expect(onSave).toHaveBeenCalledWith("media/new-image.file");
  });

  it("kind=document: shows the filename, opens MediaPicker via Replace, and saves the new path", async () => {
    const onSave = vi.fn();
    render(
      <EditModal
        id="profiles.documents.0.href"
        kind="document"
        currentValue="media/old.pdf"
        onSave={onSave}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText("media/old.pdf")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /replace/i }));
    await userEvent.click(screen.getByRole("button", { name: /mock-select-document/i }));

    expect(onSave).toHaveBeenCalledWith("media/new-document.file");
  });

  const productItemFields: ItemField[] = [
    { key: "title", label: "Range", kind: "text" },
    { key: "body", label: "Description", kind: "textarea" },
  ];

  it("kind=item (existing): shows Delete, and Save reports only the declared fields", async () => {
    const onSave = vi.fn();
    const onDelete = vi.fn();
    render(
      <EditModal
        id="products.items.3"
        kind="item"
        currentValue={{ title: "Knitwear", body: "Old description" }}
        itemFields={productItemFields}
        onSave={onSave}
        onDelete={onDelete}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: /delete this item/i })).toBeInTheDocument();

    const bodyField = screen.getByLabelText(/description/i);
    await userEvent.clear(bodyField);
    await userEvent.type(bodyField, "New description");
    await userEvent.click(screen.getByRole("button", { name: /^save$/i }));

    expect(onSave).toHaveBeenCalledWith({ title: "Knitwear", body: "New description" });

    await userEvent.click(screen.getByRole("button", { name: /delete this item/i }));
    expect(onDelete).toHaveBeenCalled();
  });

  it("kind=item (new): hides Delete and the primary button reads Add", async () => {
    const onSave = vi.fn();
    render(
      <EditModal
        id="products.items.new"
        kind="item"
        currentValue={null}
        itemFields={productItemFields}
        onSave={onSave}
        onClose={vi.fn()}
      />
    );

    expect(screen.queryByRole("button", { name: /delete this item/i })).not.toBeInTheDocument();
    const addButton = screen.getByRole("button", { name: /^add$/i });

    await userEvent.type(screen.getByLabelText(/range/i), "New range");
    await userEvent.type(screen.getByLabelText(/description/i), "New body");
    await userEvent.click(addButton);

    expect(onSave).toHaveBeenCalledWith({ title: "New range", body: "New body" });
  });

  it("kind=item: a list-flagged textarea field (e.g. bullets) round-trips as an array, other item fields untouched", async () => {
    const onSave = vi.fn();
    const divisionItemFields: ItemField[] = [
      { key: "title", label: "Division", kind: "text" },
      { key: "bullets", label: "Bullet points (one per line)", kind: "textarea", list: true },
    ];

    render(
      <EditModal
        id="divisions.items.0"
        kind="item"
        currentValue={{ title: "Knitwear", bullets: ["Fast", "Reliable"] }}
        itemFields={divisionItemFields}
        onSave={onSave}
        onClose={vi.fn()}
      />
    );

    const bulletsField = screen.getByLabelText(/bullet points/i);
    expect(bulletsField).toHaveValue("Fast\nReliable");

    await userEvent.click(screen.getByRole("button", { name: /^save$/i }));
    expect(onSave).toHaveBeenCalledWith({ title: "Knitwear", bullets: ["Fast", "Reliable"] });
  });

  it("kind=item: a media field inside the item form opens MediaPicker scoped to that field", async () => {
    const onSave = vi.fn();
    const certItemFields: ItemField[] = [
      { key: "name", label: "Name", kind: "text" },
      { key: "src", label: "Badge image", kind: "media" },
    ];

    render(
      <EditModal
        id="compliance.certifications.0"
        kind="item"
        currentValue={{ name: "ISO 9001", src: "media/old.webp" }}
        itemFields={certItemFields}
        onSave={onSave}
        onClose={vi.fn()}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: /replace/i }));
    await userEvent.click(screen.getByRole("button", { name: /mock-select-image/i }));
    await userEvent.click(screen.getByRole("button", { name: /^save$/i }));

    expect(onSave).toHaveBeenCalledWith({ name: "ISO 9001", src: "media/new-image.file" });
  });

  it("shows the human label instead of the internal id, focuses the field, and closes on Esc", async () => {
    const onClose = vi.fn();
    render(
      <EditModal id="hero.eyebrow" label="Eyebrow" kind="text" currentValue="x" onSave={vi.fn()} onClose={onClose} />
    );
    expect(screen.getByRole("dialog", { name: "Edit Eyebrow" })).toBeInTheDocument();
    expect(screen.queryByText(/hero\.eyebrow/i)).not.toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });

  it("Enter in a single-line box saves it", async () => {
    const onSave = vi.fn();
    render(<EditModal id="x" kind="text" currentValue="a" onSave={onSave} onClose={vi.fn()} />);
    await userEvent.type(screen.getByRole("textbox"), "b{Enter}");
    expect(onSave).toHaveBeenCalledWith("ab");
  });

  it("kind=url: blocks a junk link with a plain message, then accepts a real one", async () => {
    const onSave = vi.fn();
    render(<EditModal id="site.url" label="Site URL" kind="url" currentValue="" onSave={onSave} onClose={vi.fn()} />);
    await userEvent.type(screen.getByRole("textbox"), "not a url !!");
    await userEvent.click(screen.getByRole("button", { name: /^save$/i }));
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(/doesn't look like a link/i);

    await userEvent.clear(screen.getByRole("textbox"));
    await userEvent.type(screen.getByRole("textbox"), "https://novasstrading.com");
    await userEvent.click(screen.getByRole("button", { name: /^save$/i }));
    expect(onSave).toHaveBeenCalledWith("https://novasstrading.com");
  });

  it("kind=item: a NEW item with a blank title is not added", async () => {
    const onSave = vi.fn();
    const fields: ItemField[] = [
      { key: "title", label: "Value", kind: "text" },
      { key: "body", label: "Description", kind: "textarea" },
    ];
    render(
      <EditModal
        id="coreValues.values.new"
        label="Core values"
        kind="item"
        currentValue={null}
        itemFields={fields}
        titleField="title"
        onSave={onSave}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByRole("dialog", { name: "Add to Core values" })).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText(/description/i), "Only a description");
    await userEvent.click(screen.getByRole("button", { name: /^add$/i }));
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(/fill in “Value”/);
  });

  it("calls onClose when the close button is clicked", async () => {
    const onClose = vi.fn();
    render(
      <EditModal id="hero.eyebrow" kind="text" currentValue="x" onSave={vi.fn()} onClose={onClose} />
    );

    await userEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("never imports lib/cpanel-api directly", async () => {
    const path = await import("node:path");
    const fs = await import("node:fs/promises");
    const source = await fs.readFile(
      path.join(process.cwd(), "components/admin/EditModal.tsx"),
      "utf-8"
    );
    expect(source).not.toMatch(/cpanel-api/);
  });
});

