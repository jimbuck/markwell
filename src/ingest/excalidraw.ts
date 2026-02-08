import type {
  IngestConverter,
  CanProcessInput,
  IngestInput,
  IngestOutput,
} from "../core/types.js";

interface ExcalidrawElement {
  type: string;
  text?: string;
  label?: { text?: string };
  id?: string;
}

interface ExcalidrawFile {
  type: string;
  elements?: ExcalidrawElement[];
}

function extractTextContent(elements: ExcalidrawElement[]): string[] {
  const texts: string[] = [];

  for (const el of elements) {
    if (el.type === "text" && el.text) {
      texts.push(el.text);
    } else if (el.label?.text) {
      texts.push(el.label.text);
    }
  }

  return texts;
}

export const excalidrawIngest: IngestConverter = {
  name: "excalidraw",
  extensions: [".excalidraw", ".json"],

  async canProcess(input: CanProcessInput): Promise<boolean> {
    try {
      const data = JSON.parse(input.head) as ExcalidrawFile;
      return data.type === "excalidraw";
    } catch {
      return false;
    }
  },

  async ingest(input: IngestInput): Promise<IngestOutput> {
    const content = input.buffer.toString("utf-8");
    const data = JSON.parse(content) as ExcalidrawFile;
    const elements = data.elements ?? [];
    const texts = extractTextContent(elements);

    const lines: string[] = ["# Excalidraw Drawing", ""];

    if (texts.length === 0) {
      lines.push("*No text content found in drawing.*");
    } else {
      lines.push("## Text Content", "");
      for (const text of texts) {
        lines.push(`- ${text}`);
      }
    }

    lines.push("");

    const elementTypes = new Map<string, number>();
    for (const el of elements) {
      elementTypes.set(el.type, (elementTypes.get(el.type) ?? 0) + 1);
    }

    if (elementTypes.size > 0) {
      lines.push("## Elements Summary", "");
      lines.push("| Type | Count |");
      lines.push("| --- | --- |");
      for (const [type, count] of elementTypes) {
        lines.push(`| ${type} | ${count} |`);
      }
      lines.push("");
    }

    return {
      markdown: lines.join("\n"),
      metadata: {
        elementCount: elements.length,
        textCount: texts.length,
      },
    };
  },
};
