import type {
  IngestConverter,
  CanProcessInput,
  IngestInput,
  IngestOutput,
} from "../core/types.js";

function stripJsoncComments(text: string): string {
  let result = "";
  let i = 0;
  let inString = false;
  let escapeNext = false;

  while (i < text.length) {
    if (escapeNext) {
      result += text[i];
      escapeNext = false;
      i++;
      continue;
    }

    if (inString) {
      if (text[i] === "\\") {
        escapeNext = true;
        result += text[i];
      } else if (text[i] === '"') {
        inString = false;
        result += text[i];
      } else {
        result += text[i];
      }
      i++;
      continue;
    }

    if (text[i] === '"') {
      inString = true;
      result += text[i];
      i++;
      continue;
    }

    // Line comment
    if (text[i] === "/" && text[i + 1] === "/") {
      while (i < text.length && text[i] !== "\n") i++;
      continue;
    }

    // Block comment
    if (text[i] === "/" && text[i + 1] === "*") {
      i += 2;
      while (i < text.length && !(text[i] === "*" && text[i + 1] === "/"))
        i++;
      i += 2; // skip */
      continue;
    }

    result += text[i];
    i++;
  }

  return result;
}

function getType(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function schemaOutline(
  obj: Record<string, unknown>,
  indent: number = 0,
): string[] {
  const lines: string[] = [];
  const prefix = "  ".repeat(indent);
  for (const [key, value] of Object.entries(obj)) {
    const type = getType(value);
    if (type === "object" && value !== null && !Array.isArray(value)) {
      lines.push(`${prefix}- \`${key}\`: object`);
      lines.push(
        ...schemaOutline(value as Record<string, unknown>, indent + 1),
      );
    } else if (type === "array" && Array.isArray(value) && value.length > 0) {
      const elemType = getType(value[0]);
      lines.push(`${prefix}- \`${key}\`: array of ${elemType} (${value.length} items)`);
    } else {
      lines.push(`${prefix}- \`${key}\`: ${type}`);
    }
  }
  return lines;
}

function arrayToTable(arr: Record<string, unknown>[]): string[] {
  if (arr.length === 0) return [];

  // Collect all keys across all objects
  const keys = new Set<string>();
  for (const item of arr) {
    for (const key of Object.keys(item)) keys.add(key);
  }
  const headers = [...keys];

  const lines: string[] = [];
  lines.push(`| ${headers.join(" | ")} |`);
  lines.push(`| ${headers.map(() => "---").join(" | ")} |`);

  const maxRows = 20;
  const rows = arr.slice(0, maxRows);
  for (const row of rows) {
    const cells = headers.map((h) => {
      const val = row[h];
      if (val === undefined || val === null) return "";
      if (typeof val === "object") return JSON.stringify(val);
      return String(val);
    });
    lines.push(`| ${cells.join(" | ")} |`);
  }

  if (arr.length > maxRows) {
    lines.push("");
    lines.push(`*... and ${arr.length - maxRows} more rows*`);
  }

  return lines;
}

function isJsonl(content: string): boolean {
  const lines = content.trim().split("\n");
  if (lines.length < 2) return false;
  try {
    JSON.parse(lines[0]);
    JSON.parse(lines[1]);
    return true;
  } catch {
    return false;
  }
}

function processJsonObject(data: unknown): string[] {
  const lines: string[] = [];

  if (Array.isArray(data)) {
    lines.push(`Array with ${data.length} items.`, "");
    if (
      data.length > 0 &&
      typeof data[0] === "object" &&
      data[0] !== null &&
      !Array.isArray(data[0])
    ) {
      lines.push("## Data", "");
      lines.push(...arrayToTable(data as Record<string, unknown>[]));
    } else {
      lines.push("## Schema", "");
      const elemType = data.length > 0 ? getType(data[0]) : "unknown";
      lines.push(`- Array of ${elemType}`);
    }
  } else if (typeof data === "object" && data !== null) {
    lines.push("## Schema", "");
    lines.push(...schemaOutline(data as Record<string, unknown>));
  }

  return lines;
}

export const jsonIngest: IngestConverter = {
  name: "json",
  extensions: [".json", ".jsonl", ".jsonc"],

  async canProcess(input: CanProcessInput): Promise<boolean> {
    const content = input.head.trim();

    // JSONL check
    if (isJsonl(content)) return true;

    // JSONC: strip comments and try parsing
    try {
      JSON.parse(stripJsoncComments(content));
      return true;
    } catch {
      return false;
    }
  },

  async ingest(input: IngestInput): Promise<IngestOutput> {
    const content = input.buffer.toString("utf-8");
    const lines: string[] = ["# JSON Document", ""];

    // JSONL handling
    if (isJsonl(content)) {
      const jsonlLines = content
        .trim()
        .split("\n")
        .filter((l) => l.trim());
      const records: Record<string, unknown>[] = [];
      for (const line of jsonlLines) {
        try {
          records.push(JSON.parse(line) as Record<string, unknown>);
        } catch {
          // skip invalid lines
        }
      }

      lines.push(`JSONL file with ${records.length} records.`, "");

      if (records.length > 0) {
        // Collect common keys
        const keyCounts = new Map<string, number>();
        for (const rec of records) {
          for (const key of Object.keys(rec)) {
            keyCounts.set(key, (keyCounts.get(key) ?? 0) + 1);
          }
        }

        lines.push("## Common Keys", "");
        for (const [key, count] of keyCounts) {
          lines.push(`- \`${key}\` (${count}/${records.length} records)`);
        }
        lines.push("");

        // Table of records
        lines.push("## Data", "");
        lines.push(...arrayToTable(records));
      }

      return {
        markdown: lines.join("\n"),
        metadata: { format: "jsonl", recordCount: records.length },
      };
    }

    // JSONC / regular JSON
    const stripped = stripJsoncComments(content);
    const data = JSON.parse(stripped) as unknown;
    const isJsonc = stripped !== content;

    lines.push(...processJsonObject(data));
    lines.push("");

    return {
      markdown: lines.join("\n"),
      metadata: { format: isJsonc ? "jsonc" : "json" },
    };
  },
};
