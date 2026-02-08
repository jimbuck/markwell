import { describe, it, expect } from "vitest";
import { getRegistry } from "../../src/cli/setup-registry.js";

describe("converter registration verification", () => {
  it("has exactly 10 ingest converters registered", () => {
    const registry = getRegistry();
    const ingestList = registry.listIngest();

    expect(ingestList).toHaveLength(10);

    const names = ingestList.map((c) => c.name).sort();
    expect(names).toEqual([
      "docx",
      "excalidraw",
      "html",
      "json",
      "marp",
      "pptx",
      "rtf",
      "srt",
      "vtt",
      "xlsx",
    ]);
  });

  it("has exactly 4 export converters registered", () => {
    const registry = getRegistry();
    const exportList = registry.listExport();

    expect(exportList).toHaveLength(4);

    const names = exportList.map((c) => c.name).sort();
    expect(names).toEqual([
      "document",
      "presentation",
      "spreadsheet",
      "transcript",
    ]);
  });

  it("all ingest converters have non-empty extensions", () => {
    const registry = getRegistry();
    for (const converter of registry.listIngest()) {
      expect(converter.extensions.length).toBeGreaterThan(0);
      for (const ext of converter.extensions) {
        expect(ext).toMatch(/^\./);
      }
    }
  });

  it("all export converters have at least one format", () => {
    const registry = getRegistry();
    for (const converter of registry.listExport()) {
      expect(converter.formats.length).toBeGreaterThan(0);
      for (const fmt of converter.formats) {
        expect(fmt.extension).toMatch(/^\./);
        expect(fmt.mimeType).toBeTruthy();
        expect(fmt.label).toBeTruthy();
      }
    }
  });

  it("export categories match expected set", () => {
    const registry = getRegistry();
    const categories = new Set(registry.listExport().map((c) => c.category));
    expect(categories).toEqual(new Set(["document", "spreadsheet", "presentation", "transcript"]));
  });
});
