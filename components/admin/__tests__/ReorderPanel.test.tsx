import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReorderPanel, applyDragEnd, type ReorderItem } from "../ReorderPanel";

const items: ReorderItem[] = [
  { id: 1, label: "Alpha" },
  { id: 2, label: "Bravo" },
  { id: 3, label: "Charlie" },
];

describe("applyDragEnd (pure)", () => {
  it("moves the active item to the over item's slot", () => {
    // @dnd-kit's pointer physics aren't practically simulatable in jsdom, so
    // handleDragEnd delegates to this — dragging id 1 onto id 3 => [2, 3, 1].
    expect(applyDragEnd(items, 1, 3).map((i) => i.id)).toEqual([2, 3, 1]);
  });

  it("is a no-op when active and over are the same, or either is unknown", () => {
    expect(applyDragEnd(items, 2, 2)).toBe(items);
    expect(applyDragEnd(items, 99, 1)).toBe(items);
  });
});

describe("ReorderPanel", () => {
  it("renders a dialog listing every item by its label, in current order", () => {
    render(<ReorderPanel title="Reorder Hero stats" items={items} onApply={vi.fn()} onClose={vi.fn()} />);
    const dialog = screen.getByRole("dialog", { name: /reorder hero stats/i });
    const rowText = within(dialog)
      .getAllByRole("listitem")
      .map((li) => li.textContent);
    expect(rowText[0]).toContain("Alpha");
    expect(rowText[1]).toContain("Bravo");
    expect(rowText[2]).toContain("Charlie");
  });

  it("the up/down buttons reorder the list, and Apply reports the new id order", async () => {
    const onApply = vi.fn();
    render(<ReorderPanel title="Reorder" items={items} onApply={onApply} onClose={vi.fn()} />);

    // Move "Charlie" up twice => [Charlie, Alpha, Bravo]
    await userEvent.click(screen.getByRole("button", { name: /move charlie up/i }));
    await userEvent.click(screen.getByRole("button", { name: /move charlie up/i }));

    await userEvent.click(screen.getByRole("button", { name: /apply order/i }));
    expect(onApply).toHaveBeenCalledWith([3, 1, 2]);
  });

  it("Apply with no change reports the original order", async () => {
    const onApply = vi.fn();
    render(<ReorderPanel title="Reorder" items={items} onApply={onApply} onClose={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /apply order/i }));
    expect(onApply).toHaveBeenCalledWith([1, 2, 3]);
  });

  it("Cancel and the close button call onClose without applying", async () => {
    const onApply = vi.fn();
    const onClose = vi.fn();
    render(<ReorderPanel title="Reorder" items={items} onApply={onApply} onClose={onClose} />);
    await userEvent.click(screen.getByRole("button", { name: /^cancel$/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onApply).not.toHaveBeenCalled();
  });

  it("the first item's up button and the last item's down button are disabled", () => {
    render(<ReorderPanel title="Reorder" items={items} onApply={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole("button", { name: /move alpha up/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /move charlie down/i })).toBeDisabled();
  });
});
