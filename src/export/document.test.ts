import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import JSZip from "jszip";
import { documentExport } from "./document.js";
import type { ResolvedTheme } from "../core/types.js";

const fixturesDir = path.join(import.meta.dirname, "../../tests/fixtures");

const defaultTheme: ResolvedTheme = {
  name: "default",
  colors: { primary: "2B579A", accent: "4472C4", text: "333333" },
  typography: { fontFamily: "Calibri", bodySize: 22 },
  spacing: { paragraphAfter: 120, headingBefore: 240, headingAfter: 120 },
  document: {},
  spreadsheet: {},
  presentation: {},
  transcript: {},
  defaults: {},
};

describe("documentExport", () => {
  it("has correct name, category, and formats", () => {
    expect(documentExport.name).toBe("document");
    expect(documentExport.category).toBe("document");
    expect(documentExport.formats).toHaveLength(3);
    expect(documentExport.formats[0].extension).toBe(".docx");
    expect(documentExport.formats[1].extension).toBe(".pdf");
    expect(documentExport.formats[2].extension).toBe(".html");
  });

  it("produces a valid DOCX buffer", { timeout: 15000 }, async () => {
    const content = fs.readFileSync(
      path.join(fixturesDir, "sample-export.md"),
      "utf-8",
    );
    const result = await documentExport.export({
      files: [{ relativePath: "sample.md", content }],
      format: ".docx",
      theme: defaultTheme,
    });

    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.buffer.length).toBeGreaterThan(0);
    expect(result.extension).toBe(".docx");
    expect(result.mimeType).toContain("wordprocessingml");
  });

  it("generates a valid ZIP (OOXML) structure", async () => {
    const content = fs.readFileSync(
      path.join(fixturesDir, "sample-export.md"),
      "utf-8",
    );
    const result = await documentExport.export({
      files: [{ relativePath: "sample.md", content }],
      format: ".docx",
      theme: defaultTheme,
    });

    const zip = await JSZip.loadAsync(result.buffer);
    const entries = Object.keys(zip.files);

    expect(entries).toContain("word/document.xml");
    expect(entries).toContain("[Content_Types].xml");
  });

  it("includes headings in the DOCX", async () => {
    const content = "# Hello World\n\nSome text.\n\n## Sub Heading\n";
    const result = await documentExport.export({
      files: [{ relativePath: "test.md", content }],
      format: ".docx",
      theme: defaultTheme,
    });

    const zip = await JSZip.loadAsync(result.buffer);
    const docXml = await zip.file("word/document.xml")!.async("string");

    expect(docXml).toContain("Hello World");
    expect(docXml).toContain("Sub Heading");
  });

  it("includes bold and italic text", async () => {
    const content =
      "This has **bold** and *italic* text.\n";
    const result = await documentExport.export({
      files: [{ relativePath: "test.md", content }],
      format: ".docx",
      theme: defaultTheme,
    });

    const zip = await JSZip.loadAsync(result.buffer);
    const docXml = await zip.file("word/document.xml")!.async("string");

    expect(docXml).toContain("bold");
    expect(docXml).toContain("italic");
    // Check for bold run property
    expect(docXml).toContain("<w:b");
    // Check for italic run property
    expect(docXml).toContain("<w:i");
  });

  it("includes list items", async () => {
    const content = "- Apple\n- Banana\n- Cherry\n";
    const result = await documentExport.export({
      files: [{ relativePath: "test.md", content }],
      format: ".docx",
      theme: defaultTheme,
    });

    const zip = await JSZip.loadAsync(result.buffer);
    const docXml = await zip.file("word/document.xml")!.async("string");

    expect(docXml).toContain("Apple");
    expect(docXml).toContain("Banana");
    expect(docXml).toContain("Cherry");
  });

  it("includes table content", async () => {
    const content =
      "| Name | Value |\n| --- | --- |\n| Alpha | 100 |\n| Beta | 200 |\n";
    const result = await documentExport.export({
      files: [{ relativePath: "test.md", content }],
      format: ".docx",
      theme: defaultTheme,
    });

    const zip = await JSZip.loadAsync(result.buffer);
    const docXml = await zip.file("word/document.xml")!.async("string");

    expect(docXml).toContain("Alpha");
    expect(docXml).toContain("Beta");
    expect(docXml).toContain("<w:tbl");
  });

  it("includes links", async () => {
    const content = "Visit [Example](https://example.com) for more.\n";
    const result = await documentExport.export({
      files: [{ relativePath: "test.md", content }],
      format: ".docx",
      theme: defaultTheme,
    });

    const zip = await JSZip.loadAsync(result.buffer);
    const docXml = await zip.file("word/document.xml")!.async("string");

    expect(docXml).toContain("Example");
  });

  it("includes code blocks", async () => {
    const content = '```\nconsole.log("hello");\n```\n';
    const result = await documentExport.export({
      files: [{ relativePath: "test.md", content }],
      format: ".docx",
      theme: defaultTheme,
    });

    const zip = await JSZip.loadAsync(result.buffer);
    const docXml = await zip.file("word/document.xml")!.async("string");

    expect(docXml).toContain("console.log");
    expect(docXml).toContain("Courier New");
  });
});
