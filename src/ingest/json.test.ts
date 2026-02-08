import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { jsonIngest } from "./json.js";

const fixturesDir = path.join(import.meta.dirname, "../../tests/fixtures");

describe("jsonIngest", () => {
  it("has correct name and extensions", () => {
    expect(jsonIngest.name).toBe("json");
    expect(jsonIngest.extensions).toContain(".json");
    expect(jsonIngest.extensions).toContain(".jsonl");
    expect(jsonIngest.extensions).toContain(".jsonc");
  });

  it("canProcess accepts valid JSON", async () => {
    const content = '{"key": "value"}';
    const result = await jsonIngest.canProcess({
      filePath: "data.json",
      extension: ".json",
      buffer: Buffer.from(content),
      head: content,
    });
    expect(result).toBe(true);
  });

  it("canProcess rejects invalid content", async () => {
    const result = await jsonIngest.canProcess({
      filePath: "bad.json",
      extension: ".json",
      buffer: Buffer.from("not json at all"),
      head: "not json at all",
    });
    expect(result).toBe(false);
  });

  it("canProcess accepts JSONL", async () => {
    const content = '{"a":1}\n{"a":2}\n';
    const result = await jsonIngest.canProcess({
      filePath: "data.jsonl",
      extension: ".jsonl",
      buffer: Buffer.from(content),
      head: content,
    });
    expect(result).toBe(true);
  });

  it("canProcess accepts JSONC with comments", async () => {
    const content = '// comment\n{"key": "value"}';
    const result = await jsonIngest.canProcess({
      filePath: "config.jsonc",
      extension: ".jsonc",
      buffer: Buffer.from(content),
      head: content,
    });
    expect(result).toBe(true);
  });

  it("produces schema outline for JSON objects", async () => {
    const buffer = fs.readFileSync(path.join(fixturesDir, "sample.json"));
    const result = await jsonIngest.ingest({
      filePath: path.join(fixturesDir, "sample.json"),
      buffer,
    });

    expect(result.markdown).toContain("# JSON Document");
    expect(result.markdown).toContain("## Schema");
    expect(result.markdown).toContain("`name`: string");
    expect(result.markdown).toContain("`version`: string");
    expect(result.markdown).toContain("`config`: object");
    expect(result.markdown).toContain("`debug`: boolean");
    expect(result.markdown).toContain("`tags`: array");
    expect(result.metadata?.format).toBe("json");
  });

  it("produces table for JSONL records", async () => {
    const buffer = fs.readFileSync(path.join(fixturesDir, "sample.jsonl"));
    const result = await jsonIngest.ingest({
      filePath: path.join(fixturesDir, "sample.jsonl"),
      buffer,
    });

    expect(result.markdown).toContain("JSONL file with 4 records");
    expect(result.markdown).toContain("## Common Keys");
    expect(result.markdown).toContain("`id` (4/4 records)");
    expect(result.markdown).toContain("`name` (4/4 records)");
    expect(result.markdown).toContain("## Data");
    expect(result.markdown).toContain("Alice");
    expect(result.markdown).toContain("Bob");
    expect(result.metadata?.format).toBe("jsonl");
    expect(result.metadata?.recordCount).toBe(4);
  });

  it("handles JSONC by stripping comments", async () => {
    const buffer = fs.readFileSync(path.join(fixturesDir, "sample.jsonc"));
    const result = await jsonIngest.ingest({
      filePath: path.join(fixturesDir, "sample.jsonc"),
      buffer,
    });

    expect(result.markdown).toContain("`name`: string");
    expect(result.markdown).toContain("`settings`: object");
    expect(result.markdown).not.toContain("// comment");
    expect(result.markdown).not.toContain("/* Block");
    expect(result.metadata?.format).toBe("jsonc");
  });

  it("produces table for JSON arrays of objects", async () => {
    const data = [
      { name: "Item A", price: 10 },
      { name: "Item B", price: 20 },
    ];
    const content = JSON.stringify(data);
    const result = await jsonIngest.ingest({
      filePath: "items.json",
      buffer: Buffer.from(content),
    });

    expect(result.markdown).toContain("Array with 2 items");
    expect(result.markdown).toContain("## Data");
    expect(result.markdown).toContain("Item A");
    expect(result.markdown).toContain("Item B");
  });
});
