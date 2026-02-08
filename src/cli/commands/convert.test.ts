import { describe, it, expect } from "vitest";
import path from "node:path";
import { parseToFlag, resolveOutputPath } from "./convert.js";

describe("parseToFlag", () => {
  it("parses category only", () => {
    const result = parseToFlag("document");
    expect(result.category).toBe("document");
    expect(result.formats).toEqual([]);
  });

  it("parses category with single format", () => {
    const result = parseToFlag("document:pdf");
    expect(result.category).toBe("document");
    expect(result.formats).toEqual(["pdf"]);
  });

  it("parses category with multiple formats", () => {
    const result = parseToFlag("document:docx,pdf");
    expect(result.category).toBe("document");
    expect(result.formats).toEqual(["docx", "pdf"]);
  });

  it("normalizes category to lowercase", () => {
    const result = parseToFlag("Document");
    expect(result.category).toBe("document");
  });

  it("normalizes formats to lowercase", () => {
    const result = parseToFlag("document:DOCX,PDF");
    expect(result.formats).toEqual(["docx", "pdf"]);
  });

  it("handles all valid categories", () => {
    for (const cat of [
      "document",
      "spreadsheet",
      "presentation",
      "transcript",
    ]) {
      const result = parseToFlag(cat);
      expect(result.category).toBe(cat);
    }
  });

  it("throws on invalid category", () => {
    expect(() => parseToFlag("video")).toThrow(
      'Invalid category "video"',
    );
  });

  it("trims whitespace", () => {
    const result = parseToFlag(" document : docx , pdf ");
    expect(result.category).toBe("document");
    expect(result.formats).toEqual(["docx", "pdf"]);
  });

  it("filters empty format strings", () => {
    const result = parseToFlag("document:docx,,pdf,");
    expect(result.formats).toEqual(["docx", "pdf"]);
  });
});

describe("resolveOutputPath", () => {
  it("defaults to same directory with new extension", () => {
    const result = resolveOutputPath("/home/user/report.docx", ".md");
    expect(result).toBe(path.join("/home/user", "report.md"));
  });

  it("uses explicit output file path", () => {
    const result = resolveOutputPath(
      "/home/user/report.docx",
      ".md",
      "/tmp/output.md",
    );
    expect(result).toBe("/tmp/output.md");
  });

  it("treats trailing slash as directory", () => {
    const result = resolveOutputPath(
      "/home/user/report.docx",
      ".md",
      "/tmp/out/",
    );
    expect(result).toBe(path.join("/tmp/out", "report.md"));
  });

  it("changes extension correctly for different output types", () => {
    const result = resolveOutputPath("/docs/slides.md", ".pptx");
    expect(result).toBe(path.join("/docs", "slides.pptx"));
  });
});
