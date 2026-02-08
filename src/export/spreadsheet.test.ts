import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { spreadsheetExport } from "./spreadsheet.js";
import type { ResolvedTheme } from "../core/types.js";

const fixturesDir = path.join(import.meta.dirname, "../../tests/fixtures");

const defaultTheme: ResolvedTheme = {
  name: "default",
  colors: { primary: "2B579A", accent: "4472C4" },
  typography: {},
  spacing: {},
  document: {},
  spreadsheet: {
    headerBackground: "4472C4",
    headerTextColor: "FFFFFF",
    headerBold: true,
  },
  presentation: {},
  transcript: {},
  defaults: {},
};

async function readXlsxBuffer(buffer: Buffer) {
  const ExcelJS = await import("exceljs");
  const Workbook = ExcelJS.default?.Workbook ?? ExcelJS.Workbook;
  const wb = new Workbook();
  await wb.xlsx.load(buffer);
  return wb;
}

describe("spreadsheetExport", () => {
  it("has correct name, category, and formats", () => {
    expect(spreadsheetExport.name).toBe("spreadsheet");
    expect(spreadsheetExport.category).toBe("spreadsheet");
    expect(spreadsheetExport.formats).toHaveLength(1);
    expect(spreadsheetExport.formats[0].extension).toBe(".xlsx");
  });

  it("produces a valid XLSX buffer from CSV", { timeout: 15000 }, async () => {
    const csv = fs.readFileSync(
      path.join(fixturesDir, "sample.csv"),
      "utf-8",
    );
    const result = await spreadsheetExport.export({
      files: [{ relativePath: "sample.csv", content: csv }],
      format: ".xlsx",
      theme: defaultTheme,
    });

    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.buffer.length).toBeGreaterThan(0);
    expect(result.extension).toBe(".xlsx");
  });

  it("creates correct sheet with data", async () => {
    const csv = fs.readFileSync(
      path.join(fixturesDir, "sample.csv"),
      "utf-8",
    );
    const result = await spreadsheetExport.export({
      files: [{ relativePath: "sample.csv", content: csv }],
      format: ".xlsx",
      theme: defaultTheme,
    });

    const wb = await readXlsxBuffer(result.buffer);
    expect(wb.worksheets).toHaveLength(1);
    expect(wb.worksheets[0].name).toBe("sample");

    const sheet = wb.worksheets[0];
    // Header row
    expect(sheet.getRow(1).getCell(1).value).toBe("Name");
    expect(sheet.getRow(1).getCell(2).value).toBe("Age");
    // Data rows with numeric detection
    expect(sheet.getRow(2).getCell(1).value).toBe("Alice");
    expect(sheet.getRow(2).getCell(2).value).toBe(30);
  });

  it("handles TSV files", async () => {
    const tsv = fs.readFileSync(
      path.join(fixturesDir, "sample.tsv"),
      "utf-8",
    );
    const result = await spreadsheetExport.export({
      files: [{ relativePath: "products.tsv", content: tsv }],
      format: ".xlsx",
      theme: defaultTheme,
    });

    const wb = await readXlsxBuffer(result.buffer);
    const sheet = wb.worksheets[0];
    expect(sheet.getRow(1).getCell(1).value).toBe("Product");
    expect(sheet.getRow(2).getCell(1).value).toBe("Widget");
    expect(sheet.getRow(2).getCell(2).value).toBe(9.99);
  });

  it("handles quoted CSV fields", async () => {
    const csv = fs.readFileSync(
      path.join(fixturesDir, "quoted.csv"),
      "utf-8",
    );
    const result = await spreadsheetExport.export({
      files: [{ relativePath: "quoted.csv", content: csv }],
      format: ".xlsx",
      theme: defaultTheme,
    });

    const wb = await readXlsxBuffer(result.buffer);
    const sheet = wb.worksheets[0];
    expect(sheet.getRow(2).getCell(1).value).toBe("Smith, John");
    expect(sheet.getRow(2).getCell(2).value).toBe('A "special" person');
    expect(sheet.getRow(2).getCell(3).value).toBe(42);
  });

  it("creates multiple sheets from multiple files", async () => {
    const csv1 = "A,B\n1,2\n";
    const csv2 = "X,Y\n3,4\n";

    const result = await spreadsheetExport.export({
      files: [
        { relativePath: "sheet1.csv", content: csv1 },
        { relativePath: "sheet2.csv", content: csv2 },
      ],
      format: ".xlsx",
      theme: defaultTheme,
    });

    const wb = await readXlsxBuffer(result.buffer);
    expect(wb.worksheets).toHaveLength(2);
    expect(wb.worksheets[0].name).toBe("sheet1");
    expect(wb.worksheets[1].name).toBe("sheet2");
  });

  it("applies header row styling", async () => {
    const csv = "Name,Value\nTest,123\n";
    const result = await spreadsheetExport.export({
      files: [{ relativePath: "data.csv", content: csv }],
      format: ".xlsx",
      theme: defaultTheme,
    });

    const wb = await readXlsxBuffer(result.buffer);
    const sheet = wb.worksheets[0];
    const headerCell = sheet.getRow(1).getCell(1);
    expect(headerCell.font?.bold).toBe(true);
  });

  it("handles duplicate sheet names", async () => {
    const csv = "A,B\n1,2\n";
    const result = await spreadsheetExport.export({
      files: [
        { relativePath: "data.csv", content: csv },
        { relativePath: "subdir/data.csv", content: csv },
      ],
      format: ".xlsx",
      theme: defaultTheme,
    });

    const wb = await readXlsxBuffer(result.buffer);
    expect(wb.worksheets).toHaveLength(2);
    const names = wb.worksheets.map((s) => s.name);
    expect(new Set(names).size).toBe(2); // all unique
  });
});
