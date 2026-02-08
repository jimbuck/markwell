import { describe, it, expect, beforeEach } from "vitest";
import { ConverterRegistry } from "../core/registry.js";
import { excalidrawIngest } from "./excalidraw.js";
import { jsonIngest } from "./json.js";
import { marpIngest } from "./marp.js";

describe("smart detection conflict resolution", () => {
  describe("Excalidraw vs JSON", () => {
    let registry: ConverterRegistry;

    beforeEach(() => {
      registry = new ConverterRegistry();
      // Excalidraw registered BEFORE JSON
      registry.registerIngest(excalidrawIngest);
      registry.registerIngest(jsonIngest);
    });

    it("resolves Excalidraw .json to excalidraw converter", async () => {
      const content = JSON.stringify({
        type: "excalidraw",
        elements: [],
      });
      const buffer = Buffer.from(content);
      const converter = await registry.resolveIngest("drawing.json", buffer);
      expect(converter?.name).toBe("excalidraw");
    });

    it("resolves regular .json to json converter", async () => {
      const content = JSON.stringify({ name: "test", version: "1.0" });
      const buffer = Buffer.from(content);
      const converter = await registry.resolveIngest("data.json", buffer);
      expect(converter?.name).toBe("json");
    });

    it("resolves .excalidraw to excalidraw converter", async () => {
      const content = JSON.stringify({
        type: "excalidraw",
        elements: [],
      });
      const buffer = Buffer.from(content);
      const converter = await registry.resolveIngest(
        "drawing.excalidraw",
        buffer,
      );
      expect(converter?.name).toBe("excalidraw");
    });
  });

  describe("MARP vs regular Markdown", () => {
    let registry: ConverterRegistry;

    beforeEach(() => {
      registry = new ConverterRegistry();
      registry.registerIngest(marpIngest);
    });

    it("resolves .md with marp: true to marp converter", async () => {
      const content = "---\nmarp: true\ntheme: default\n---\n\n# Slide 1";
      const buffer = Buffer.from(content);
      const converter = await registry.resolveIngest("slides.md", buffer);
      expect(converter?.name).toBe("marp");
    });

    it("does not resolve regular .md file", async () => {
      const content = "# Just a heading\n\nSome text.";
      const buffer = Buffer.from(content);
      const converter = await registry.resolveIngest("readme.md", buffer);
      expect(converter).toBeNull();
    });

    it("does not resolve .md with non-marp frontmatter", async () => {
      const content = "---\ntitle: My Doc\nauthor: Me\n---\n\n# Hello";
      const buffer = Buffer.from(content);
      const converter = await registry.resolveIngest("doc.md", buffer);
      expect(converter).toBeNull();
    });
  });
});
