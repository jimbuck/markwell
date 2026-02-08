import { describe, it, expect } from "vitest";
import ExcelJS from "exceljs";
import { xlsxIngest } from "./xlsx.js";

async function createTestXlsx(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();

  // Sheet 1: Sales Data
  const sheet1 = workbook.addWorksheet("Sales Data");
  sheet1.addRow(["Product", "Quantity", "Price"]);
  sheet1.addRow(["Widget", 100, 9.99]);
  sheet1.addRow(["Gadget", 50, 24.99]);

  // Sheet 2: Employees
  const sheet2 = workbook.addWorksheet("Employees");
  sheet2.addRow(["Name", "Department"]);
  sheet2.addRow(["Alice", "Engineering"]);
  sheet2.addRow(["Bob", "Sales"]);

  // Sheet 3: Empty sheet
  workbook.addWorksheet("Empty");

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

describe("xlsxIngest", () => {
  it("has correct name and extensions", () => {
    expect(xlsxIngest.name).toBe("xlsx");
    expect(xlsxIngest.extensions).toContain(".xlsx");
    expect(xlsxIngest.extensions).toContain(".xls");
    expect(xlsxIngest.extensions).toContain(".xlsm");
  });

  it("canProcess returns true for a valid XLSX buffer", async () => {
    const buffer = await createTestXlsx();
    const result = await xlsxIngest.canProcess({
      filePath: "test.xlsx",
      extension: ".xlsx",
      buffer,
      head: buffer.subarray(0, 1024).toString("utf-8"),
    });
    expect(result).toBe(true);
  });

  it("canProcess returns false for non-XLSX buffer", async () => {
    const buffer = Buffer.from("not an xlsx");
    const result = await xlsxIngest.canProcess({
      filePath: "test.xlsx",
      extension: ".xlsx",
      buffer,
      head: "not an xlsx",
    });
    expect(result).toBe(false);
  });

  it("produces one CSV per non-empty sheet", async () => {
    const buffer = await createTestXlsx();
    const result = await xlsxIngest.ingest({
      filePath: "/tmp/test.xlsx",
      buffer,
    });

    expect(result.files).toBeDefined();
    // Should have 2 files (empty sheet is skipped)
    expect(result.files!.length).toBe(2);

    const fileNames = result.files!.map((f) => f.relativePath);
    expect(fileNames).toContain("Sales Data.csv");
    expect(fileNames).toContain("Employees.csv");
  });

  it("produces valid CSV content", async () => {
    const buffer = await createTestXlsx();
    const result = await xlsxIngest.ingest({
      filePath: "/tmp/test.xlsx",
      buffer,
    });

    const salesCsv = result.files!.find(
      (f) => f.relativePath === "Sales Data.csv",
    )!;
    expect(salesCsv.content).toContain("Product,Quantity,Price");
    expect(salesCsv.content).toContain("Widget,100,9.99");
    expect(salesCsv.content).toContain("Gadget,50,24.99");
  });

  it("includes sheet metadata", async () => {
    const buffer = await createTestXlsx();
    const result = await xlsxIngest.ingest({
      filePath: "/tmp/test.xlsx",
      buffer,
    });

    expect(result.metadata).toBeDefined();
    expect(result.metadata!.sheetCount).toBe(3);
    expect(result.metadata!.sheetNames).toEqual([
      "Sales Data",
      "Employees",
      "Empty",
    ]);
  });
});
