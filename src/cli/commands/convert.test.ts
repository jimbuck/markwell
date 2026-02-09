import { describe, it, expect } from "vitest";
import path from "node:path";
import { resolveOutputPath } from "./convert.js";

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
