import { describe, expect, it } from "vitest";
import { isAttributedTestimonial, presentDesign } from "./design-presentation";

describe("archive presentation", () => {
  it("preserves owner edits, image identity and pin positions", () => {
    const piece = { id: "studio/designs/1792779330048-4469911d-109c-4260-b574-0385bae191f5.json:1", title: "New title chosen by owner", description: "Owner brief", type: "Branding", imagePath: "/api/artwork?path=x", pinned: true, pinOrder: 2 };
    expect(presentDesign(piece)).toEqual(piece);
    const original = { ...piece, title: "Logo" };
    expect(presentDesign(original)).toMatchObject({ title: "APEX ’29 — Class Identity", description: "Owner brief", imagePath: original.imagePath, pinned: true, pinOrder: 2 });
  });
  it("does not relabel a newly uploaded piece with the same generic title", () => {
    const piece = { id: "new-upload", title: "Logo", type: "Branding" };
    expect(presentDesign(piece)).toBe(piece);
  });
  it("hides generic sample endorsements and accepts attributed feedback", () => {
    for (const name of ["Client", "Business client", "Publicity team lead", ""]) expect(isAttributedTestimonial({ name })).toBe(false);
    expect(isAttributedTestimonial({ name: "Ada Okafor", organisation: "Example Studio" })).toBe(true);
  });
});
