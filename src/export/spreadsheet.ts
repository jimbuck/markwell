import type {
  ExportConverter,
  ExportInput,
  ExportOutput,
} from "../core/types.js";

async function loadExcelJs() {
  const mod = await import("exceljs");
  return mod.default ?? mod;
}

function parseCSV(content: string, delimiter: string = ","): string[][] {
  const rows: string[][] = [];
  let current = "";
  let inQuote = false;
  let row: string[] = [];

  for (let i = 0; i < content.length; i++) {
    const ch = content[i];

    if (inQuote) {
      if (ch === '"' && content[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else if (ch === '"') {
        inQuote = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuote = true;
      } else if (ch === delimiter) {
        row.push(current);
        current = "";
      } else if (ch === "\n" || (ch === "\r" && content[i + 1] === "\n")) {
        row.push(current);
        current = "";
        if (row.some((c) => c !== "")) rows.push(row);
        row = [];
        if (ch === "\r") i++; // skip \n after \r
      } else {
        current += ch;
      }
    }
  }

  // Final row
  if (current || row.length > 0) {
    row.push(current);
    if (row.some((c) => c !== "")) rows.push(row);
  }

  return rows;
}

function detectDelimiter(content: string): string {
  const firstLine = content.split("\n")[0] ?? "";
  const tabCount = (firstLine.match(/\t/g) ?? []).length;
  const commaCount = (firstLine.match(/,/g) ?? []).length;
  return tabCount > commaCount ? "\t" : ",";
}

function sanitizeExcelSheetName(name: string): string {
  return name
    .replace(/[[\]:*?/\\]/g, "_")
    .trim()
    .slice(0, 31) || "Sheet";
}

function toNumericIfPossible(value: string): string | number {
  if (value === "") return value;
  const trimmed = value.trim();
  // Don't convert strings that look like IDs, zip codes, or phone numbers
  if (/^0\d/.test(trimmed) && trimmed.length > 1) return value;
  const num = Number(trimmed);
  if (!isNaN(num) && trimmed !== "") return num;
  return value;
}

export const spreadsheetExport: ExportConverter = {
  name: "spreadsheet",
  category: "spreadsheet",
  formats: [
    {
      extension: ".xlsx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      label: "Excel Spreadsheet",
    },
  ],

  async export(input: ExportInput): Promise<ExportOutput> {
    const ExcelJS = await loadExcelJs();
    const workbook = new ExcelJS.Workbook();
    const theme = input.theme;

    const headerBg = theme.spreadsheet?.headerBackground as string ?? "4472C4";
    const headerTextColor = theme.spreadsheet?.headerTextColor as string ?? "FFFFFF";
    const headerBold = (theme.spreadsheet?.headerBold as boolean) ?? true;

    const usedNames = new Set<string>();

    for (const file of input.files) {
      // Derive sheet name from file path
      let sheetName = file.relativePath
        .replace(/\.(csv|tsv)$/i, "")
        .replace(/.*[/\\]/, ""); // get basename
      sheetName = sanitizeExcelSheetName(sheetName);

      // Handle duplicate names
      let finalName = sheetName;
      let counter = 1;
      while (usedNames.has(finalName)) {
        const suffix = `_${counter}`;
        finalName = sheetName.slice(0, 31 - suffix.length) + suffix;
        counter++;
      }
      usedNames.add(finalName);

      const delimiter = detectDelimiter(file.content);
      const rows = parseCSV(file.content, delimiter);
      const sheet = workbook.addWorksheet(finalName);

      for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        const excelRow = sheet.addRow(
          row.map((cell) => (r === 0 ? cell : toNumericIfPossible(cell))),
        );

        // Style header row
        if (r === 0) {
          excelRow.eachCell((cell) => {
            cell.font = {
              bold: headerBold,
              color: { argb: `FF${headerTextColor}` },
            };
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: `FF${headerBg}` },
            };
          });
        }
      }

      // Auto-width columns
      sheet.columns.forEach((col) => {
        let maxLen = 10;
        col.eachCell?.({ includeEmpty: false }, (cell) => {
          const len = String(cell.value ?? "").length;
          if (len > maxLen) maxLen = len;
        });
        col.width = Math.min(maxLen + 2, 50);
      });

      // Freeze header row
      sheet.views = [{ state: "frozen", ySplit: 1 }];
    }

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return {
      buffer,
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      extension: ".xlsx",
    };
  },
};
