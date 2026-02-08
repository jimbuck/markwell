import { describe, it, expect } from "vitest";
import JSZip from "jszip";
import { pptxIngest } from "./pptx.js";

/**
 * Create a minimal PPTX file with slides for testing.
 */
async function createTestPptx(): Promise<Buffer> {
  const zip = new JSZip();

  // Minimal [Content_Types].xml
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
  <Override PartName="/ppt/slides/slide2.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
  <Override PartName="/ppt/notesSlides/notesSlide2.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.notesSlide+xml"/>
</Types>`,
  );

  // Minimal presentation.xml
  zip.file(
    "ppt/presentation.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:sldIdLst>
    <p:sldId id="256" r:id="rId2"/>
    <p:sldId id="257" r:id="rId3"/>
  </p:sldIdLst>
</p:presentation>`,
  );

  // Slide 1: Title slide
  zip.file(
    "ppt/slides/slide1.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
  xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="1" name="Title"/><p:cNvSpPr/><p:nvPr><p:ph type="ctrTitle"/></p:nvPr></p:nvSpPr>
        <p:txBody>
          <a:p><a:r><a:t>Welcome to Markwell</a:t></a:r></a:p>
        </p:txBody>
      </p:sp>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="2" name="Subtitle"/><p:cNvSpPr/><p:nvPr><p:ph type="subTitle"/></p:nvPr></p:nvSpPr>
        <p:txBody>
          <a:p><a:r><a:t>Document conversion made easy</a:t></a:r></a:p>
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`,
  );

  // Slide 2: Content slide with speaker notes
  zip.file(
    "ppt/slides/slide2.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
  xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="1" name="Title"/><p:cNvSpPr/><p:nvPr><p:ph type="title"/></p:nvPr></p:nvSpPr>
        <p:txBody>
          <a:p><a:r><a:t>Key Features</a:t></a:r></a:p>
        </p:txBody>
      </p:sp>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="2" name="Content"/><p:cNvSpPr/><p:nvPr><p:ph idx="1"/></p:nvPr></p:nvSpPr>
        <p:txBody>
          <a:p><a:r><a:t>Convert DOCX to Markdown</a:t></a:r></a:p>
          <a:p><a:r><a:t>Convert XLSX to CSV</a:t></a:r></a:p>
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`,
  );

  // Speaker notes for slide 2
  zip.file(
    "ppt/notesSlides/notesSlide2.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:notes xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
  xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="1" name="Notes"/><p:cNvSpPr/><p:nvPr><p:ph type="body" idx="1"/></p:nvPr></p:nvSpPr>
        <p:txBody>
          <a:p><a:r><a:t>Mention the lazy-loading feature here</a:t></a:r></a:p>
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:notes>`,
  );

  // Relationships
  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`,
  );

  const buffer = await zip.generateAsync({ type: "nodebuffer" });
  return buffer;
}

describe("pptxIngest", () => {
  it("has correct name and extensions", () => {
    expect(pptxIngest.name).toBe("pptx");
    expect(pptxIngest.extensions).toContain(".pptx");
    expect(pptxIngest.extensions).toContain(".ppt");
  });

  it("canProcess returns true for a valid PPTX buffer", async () => {
    const buffer = await createTestPptx();
    const result = await pptxIngest.canProcess({
      filePath: "slides.pptx",
      extension: ".pptx",
      buffer,
      head: buffer.subarray(0, 1024).toString("utf-8"),
    });
    expect(result).toBe(true);
  });

  it("canProcess returns false for non-PPTX buffer", async () => {
    const buffer = Buffer.from("not a pptx");
    const result = await pptxIngest.canProcess({
      filePath: "slides.pptx",
      extension: ".pptx",
      buffer,
      head: "not a pptx",
    });
    expect(result).toBe(false);
  });

  it("extracts slide titles", async () => {
    const buffer = await createTestPptx();
    const result = await pptxIngest.ingest({
      filePath: "/tmp/slides.pptx",
      buffer,
    });

    expect(result.markdown).toBeDefined();
    expect(result.markdown).toContain("Welcome to Markwell");
    expect(result.markdown).toContain("Key Features");
  });

  it("extracts slide body content", async () => {
    const buffer = await createTestPptx();
    const result = await pptxIngest.ingest({
      filePath: "/tmp/slides.pptx",
      buffer,
    });

    expect(result.markdown).toContain("Convert DOCX to Markdown");
    expect(result.markdown).toContain("Convert XLSX to CSV");
  });

  it("extracts speaker notes", async () => {
    const buffer = await createTestPptx();
    const result = await pptxIngest.ingest({
      filePath: "/tmp/slides.pptx",
      buffer,
    });

    expect(result.markdown).toContain("Mention the lazy-loading feature here");
    expect(result.markdown).toContain("Speaker Notes");
  });

  it("includes slide count in metadata", async () => {
    const buffer = await createTestPptx();
    const result = await pptxIngest.ingest({
      filePath: "/tmp/slides.pptx",
      buffer,
    });

    expect(result.metadata).toBeDefined();
    expect(result.metadata!.slideCount).toBe(2);
  });
});
