import type {
  IngestConverter,
  CanProcessInput,
  IngestInput,
  IngestOutput,
  OutputFile,
} from "../core/types.js";
import { isXlsx } from "./utils/ooxml.js";
import { sanitizeSheetName } from "./utils/sanitize.js";

async function loadExcelJS() {
  const ExcelJS = await import("exceljs");
  return ExcelJS.default ?? ExcelJS;
}

function worksheetToCsv(
  worksheet: import("exceljs").Worksheet,
): string {
  const rows: string[] = [];

  worksheet.eachRow((row) => {
    const cells: string[] = [];
    // row.values is 1-indexed (index 0 is undefined)
    const values = row.values as (
      | string
      | number
      | boolean
      | Date
      | null
      | undefined
    )[];
    for (let i = 1; i < values.length; i++) {
      const val = values[i];
      if (val === null || val === undefined) {
        cells.push("");
      } else if (val instanceof Date) {
        cells.push(val.toISOString());
      } else {
        const str = String(val);
        // Quote if contains comma, newline, or double quote
        if (str.includes(",") || str.includes("\n") || str.includes('"')) {
          cells.push(`"${str.replace(/"/g, '""')}"`);
        } else {
          cells.push(str);
        }
      }
    }
    rows.push(cells.join(","));
  });

  return rows.join("\n");
}

export const xlsxIngest: IngestConverter = {
  name: "xlsx",
  extensions: [".xlsx", ".xls", ".xlsm"],

  async canProcess(input: CanProcessInput): Promise<boolean> {
    return isXlsx(input.buffer);
  },

  async ingest(input: IngestInput): Promise<IngestOutput> {
    const ExcelJS = await loadExcelJS();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(input.buffer as unknown as ArrayBuffer);

    const files: OutputFile[] = [];
    const usedNames = new Set<string>();

    workbook.eachSheet((worksheet) => {
      let name = sanitizeSheetName(worksheet.name);

      // Handle duplicate names
      if (usedNames.has(name)) {
        let suffix = 2;
        while (usedNames.has(`${name}_${suffix}`)) {
          suffix++;
        }
        name = `${name}_${suffix}`;
      }
      usedNames.add(name);

      const csv = worksheetToCsv(worksheet);

      // Skip empty sheets
      if (csv.trim().length === 0) return;

      files.push({
        relativePath: `${name}.csv`,
        content: csv,
      });
    });

    return {
      files,
      metadata: {
        sheetCount: workbook.worksheets.length,
        sheetNames: workbook.worksheets.map((ws) => ws.name),
      },
    };
  },
};
