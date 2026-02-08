import { describe, it, expect } from "vitest";
import { ConverterRegistry } from "./registry.js";
import type {
  IngestConverter,
  ExportConverter,
  CanProcessInput,
  IngestInput,
  IngestOutput,
  ExportInput,
  ExportOutput,
} from "./types.js";

function makeIngestConverter(
  name: string,
  extensions: string[],
  canProcess: (input: CanProcessInput) => Promise<boolean> = async () => true,
): IngestConverter {
  return {
    name,
    extensions,
    canProcess,
    async ingest(_input: IngestInput): Promise<IngestOutput> {
      return { markdown: `# ${name}` };
    },
  };
}

function makeExportConverter(
  name: string,
  category: ExportConverter["category"],
  formats: ExportConverter["formats"],
): ExportConverter {
  return {
    name,
    category,
    formats,
    async export(_input: ExportInput): Promise<ExportOutput> {
      return {
        buffer: Buffer.from("test"),
        mimeType: formats[0].mimeType,
        extension: formats[0].extension,
      };
    },
  };
}

describe("ConverterRegistry", () => {
  describe("registerIngest / listIngest", () => {
    it("registers and lists ingest converters", () => {
      const registry = new ConverterRegistry();
      const converter = makeIngestConverter("docx", [".docx"]);
      registry.registerIngest(converter);

      const list = registry.listIngest();
      expect(list).toHaveLength(1);
      expect(list[0].name).toBe("docx");
    });

    it("returns a copy of the list", () => {
      const registry = new ConverterRegistry();
      registry.registerIngest(makeIngestConverter("docx", [".docx"]));

      const list = registry.listIngest();
      list.pop();
      expect(registry.listIngest()).toHaveLength(1);
    });
  });

  describe("registerExport / listExport", () => {
    it("registers and lists export converters", () => {
      const registry = new ConverterRegistry();
      const converter = makeExportConverter("document", "document", [
        { extension: ".docx", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", label: "Word Document" },
      ]);
      registry.registerExport(converter);

      const list = registry.listExport();
      expect(list).toHaveLength(1);
      expect(list[0].name).toBe("document");
    });
  });

  describe("resolveIngest", () => {
    it("resolves by extension and canProcess", async () => {
      const registry = new ConverterRegistry();
      registry.registerIngest(makeIngestConverter("docx", [".docx"]));

      const result = await registry.resolveIngest(
        "report.docx",
        Buffer.from("PK test"),
      );
      expect(result).not.toBeNull();
      expect(result!.name).toBe("docx");
    });

    it("returns null when no extension matches", async () => {
      const registry = new ConverterRegistry();
      registry.registerIngest(makeIngestConverter("docx", [".docx"]));

      const result = await registry.resolveIngest(
        "image.png",
        Buffer.from("PNG"),
      );
      expect(result).toBeNull();
    });

    it("returns null when canProcess returns false for all matches", async () => {
      const registry = new ConverterRegistry();
      registry.registerIngest(
        makeIngestConverter("docx", [".docx"], async () => false),
      );

      const result = await registry.resolveIngest(
        "file.docx",
        Buffer.from("not a docx"),
      );
      expect(result).toBeNull();
    });

    it("respects registration order — specific before generic", async () => {
      const registry = new ConverterRegistry();

      // Specific converter registered first — checks for excalidraw schema
      registry.registerIngest(
        makeIngestConverter("excalidraw", [".json"], async (input) => {
          return input.head.includes('"type": "excalidraw"');
        }),
      );

      // Generic converter registered second — accepts any JSON
      registry.registerIngest(
        makeIngestConverter("json", [".json"], async () => true),
      );

      // Excalidraw file should match the excalidraw converter
      const excalidrawResult = await registry.resolveIngest(
        "drawing.json",
        Buffer.from('{"type": "excalidraw", "elements": []}'),
      );
      expect(excalidrawResult!.name).toBe("excalidraw");

      // Regular JSON should fall through to the generic converter
      const jsonResult = await registry.resolveIngest(
        "data.json",
        Buffer.from('{"name": "test"}'),
      );
      expect(jsonResult!.name).toBe("json");
    });

    it("falls through when specific converter rejects", async () => {
      const registry = new ConverterRegistry();

      // MARP converter — checks for marp: true frontmatter
      registry.registerIngest(
        makeIngestConverter("marp", [".md"], async (input) => {
          return input.head.includes("marp: true");
        }),
      );

      // Regular markdown file — no marp frontmatter
      const result = await registry.resolveIngest(
        "notes.md",
        Buffer.from("# Just a heading\n\nSome text."),
      );
      expect(result).toBeNull();

      // MARP file — has marp frontmatter
      const marpResult = await registry.resolveIngest(
        "slides.md",
        Buffer.from("---\nmarp: true\n---\n# Slide 1"),
      );
      expect(marpResult!.name).toBe("marp");
    });

    it("normalizes extension to lowercase", async () => {
      const registry = new ConverterRegistry();
      registry.registerIngest(makeIngestConverter("docx", [".docx"]));

      const result = await registry.resolveIngest(
        "report.DOCX",
        Buffer.from("PK test"),
      );
      expect(result).not.toBeNull();
      expect(result!.name).toBe("docx");
    });

    it("provides head as first ~1KB of file content", async () => {
      const registry = new ConverterRegistry();
      let capturedHead = "";

      registry.registerIngest(
        makeIngestConverter("test", [".txt"], async (input) => {
          capturedHead = input.head;
          return true;
        }),
      );

      const longContent = "A".repeat(2048);
      await registry.resolveIngest("file.txt", Buffer.from(longContent));

      expect(capturedHead.length).toBe(1024);
    });
  });

  describe("resolveExport", () => {
    it("resolves by category", () => {
      const registry = new ConverterRegistry();
      registry.registerExport(
        makeExportConverter("document", "document", [
          { extension: ".docx", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", label: "Word" },
        ]),
      );

      const result = registry.resolveExport("document");
      expect(result).not.toBeNull();
      expect(result!.name).toBe("document");
    });

    it("validates format is supported", () => {
      const registry = new ConverterRegistry();
      registry.registerExport(
        makeExportConverter("document", "document", [
          { extension: ".docx", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", label: "Word" },
        ]),
      );

      // Supported format
      expect(registry.resolveExport("document", "docx")).not.toBeNull();
      expect(registry.resolveExport("document", ".docx")).not.toBeNull();

      // Unsupported format
      expect(registry.resolveExport("document", "pdf")).toBeNull();
    });

    it("returns null for unknown category", () => {
      const registry = new ConverterRegistry();
      const result = registry.resolveExport("document");
      expect(result).toBeNull();
    });

    it("handles multiple export converters", () => {
      const registry = new ConverterRegistry();
      registry.registerExport(
        makeExportConverter("document", "document", [
          { extension: ".docx", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", label: "Word" },
        ]),
      );
      registry.registerExport(
        makeExportConverter("spreadsheet", "spreadsheet", [
          { extension: ".xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", label: "Excel" },
        ]),
      );

      expect(registry.resolveExport("document")!.name).toBe("document");
      expect(registry.resolveExport("spreadsheet")!.name).toBe("spreadsheet");
      expect(registry.resolveExport("transcript")).toBeNull();
    });
  });
});
