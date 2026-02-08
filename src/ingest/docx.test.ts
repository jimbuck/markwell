import { describe, it, expect } from "vitest";
import { Document, Paragraph, TextRun, HeadingLevel, Packer } from "docx";
import { docxIngest } from "./docx.js";

async function createTestDocx(): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun("Test Heading")],
          }),
          new Paragraph({
            children: [
              new TextRun("This is "),
              new TextRun({ text: "bold text", bold: true }),
              new TextRun(" and "),
              new TextRun({ text: "italic text", italics: true }),
              new TextRun("."),
            ],
          }),
          new Paragraph({
            children: [new TextRun("A simple paragraph.")],
          }),
        ],
      },
    ],
  });

  const arrayBuffer = await Packer.toBuffer(doc);
  return Buffer.from(arrayBuffer);
}

describe("docxIngest", () => {
  it("has correct name and extensions", () => {
    expect(docxIngest.name).toBe("docx");
    expect(docxIngest.extensions).toContain(".docx");
    expect(docxIngest.extensions).toContain(".doc");
  });

  it("canProcess returns true for a valid DOCX buffer", async () => {
    const buffer = await createTestDocx();
    const result = await docxIngest.canProcess({
      filePath: "test.docx",
      extension: ".docx",
      buffer,
      head: buffer.subarray(0, 1024).toString("utf-8"),
    });
    expect(result).toBe(true);
  });

  it("canProcess returns false for non-DOCX buffer", async () => {
    const buffer = Buffer.from("This is plain text");
    const result = await docxIngest.canProcess({
      filePath: "test.docx",
      extension: ".docx",
      buffer,
      head: "This is plain text",
    });
    expect(result).toBe(false);
  });

  it("ingests a DOCX file and produces markdown", async () => {
    const buffer = await createTestDocx();
    const result = await docxIngest.ingest({
      filePath: "/tmp/test.docx",
      buffer,
    });

    expect(result.markdown).toBeDefined();
    expect(result.markdown).toContain("Test Heading");
    expect(result.markdown).toContain("bold text");
    expect(result.markdown).toContain("italic text");
    expect(result.markdown).toContain("A simple paragraph");
  });
});
