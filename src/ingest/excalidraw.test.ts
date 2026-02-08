import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { excalidrawIngest } from "./excalidraw.js";

const fixturesDir = path.join(import.meta.dirname, "../../tests/fixtures");

describe("excalidrawIngest", () => {
  it("has correct name and extensions", () => {
    expect(excalidrawIngest.name).toBe("excalidraw");
    expect(excalidrawIngest.extensions).toContain(".excalidraw");
    expect(excalidrawIngest.extensions).toContain(".json");
  });

  it("canProcess detects Excalidraw JSON", async () => {
    const content = JSON.stringify({ type: "excalidraw", elements: [] });
    const result = await excalidrawIngest.canProcess({
      filePath: "drawing.excalidraw",
      extension: ".excalidraw",
      buffer: Buffer.from(content),
      head: content,
    });
    expect(result).toBe(true);
  });

  it("canProcess rejects regular JSON", async () => {
    const content = JSON.stringify({ name: "test", version: "1.0" });
    const result = await excalidrawIngest.canProcess({
      filePath: "data.json",
      extension: ".json",
      buffer: Buffer.from(content),
      head: content,
    });
    expect(result).toBe(false);
  });

  it("canProcess rejects invalid JSON", async () => {
    const result = await excalidrawIngest.canProcess({
      filePath: "bad.json",
      extension: ".json",
      buffer: Buffer.from("not json"),
      head: "not json",
    });
    expect(result).toBe(false);
  });

  it("extracts text elements from Excalidraw file", async () => {
    const buffer = fs.readFileSync(
      path.join(fixturesDir, "sample.excalidraw"),
    );
    const result = await excalidrawIngest.ingest({
      filePath: path.join(fixturesDir, "sample.excalidraw"),
      buffer,
    });

    expect(result.markdown).toContain("# Excalidraw Drawing");
    expect(result.markdown).toContain("User Service");
    expect(result.markdown).toContain("Database");
    expect(result.markdown).toContain("Architecture Overview");
    expect(result.markdown).toContain(
      "Handles user authentication and profile management",
    );
  });

  it("includes element summary table", async () => {
    const buffer = fs.readFileSync(
      path.join(fixturesDir, "sample.excalidraw"),
    );
    const result = await excalidrawIngest.ingest({
      filePath: path.join(fixturesDir, "sample.excalidraw"),
      buffer,
    });

    expect(result.markdown).toContain("## Elements Summary");
    expect(result.markdown).toContain("rectangle");
    expect(result.markdown).toContain("arrow");
    expect(result.markdown).toContain("text");
  });

  it("reports correct metadata", async () => {
    const buffer = fs.readFileSync(
      path.join(fixturesDir, "sample.excalidraw"),
    );
    const result = await excalidrawIngest.ingest({
      filePath: path.join(fixturesDir, "sample.excalidraw"),
      buffer,
    });

    expect(result.metadata?.elementCount).toBe(5);
    expect(result.metadata?.textCount).toBe(4); // 2 labels + 2 text elements
  });

  it("handles drawing with no text", async () => {
    const content = JSON.stringify({
      type: "excalidraw",
      elements: [{ type: "rectangle", id: "r1" }],
    });
    const result = await excalidrawIngest.ingest({
      filePath: "empty.excalidraw",
      buffer: Buffer.from(content),
    });

    expect(result.markdown).toContain("No text content found");
  });
});
