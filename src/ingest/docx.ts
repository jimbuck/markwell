import type {
  IngestConverter,
  CanProcessInput,
  IngestInput,
  IngestOutput,
} from "../core/types.js";
import { isDocx } from "./utils/ooxml.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadMammoth(): Promise<any> {
  const mammoth = await import("mammoth");
  return mammoth.default ?? mammoth;
}

export const docxIngest: IngestConverter = {
  name: "docx",
  extensions: [".docx", ".doc"],

  async canProcess(input: CanProcessInput): Promise<boolean> {
    return isDocx(input.buffer);
  },

  async ingest(input: IngestInput): Promise<IngestOutput> {
    const mammoth = await loadMammoth();
    const result = await mammoth.convertToMarkdown({ buffer: input.buffer });

    const assets = new Map<string, Buffer>();

    // Extract images if mammoth provides them
    if (result.messages) {
      for (const msg of result.messages) {
        if (msg.type === "warning") {
          // Log warnings but don't fail
        }
      }
    }

    return {
      markdown: result.value,
      assets: assets.size > 0 ? assets : undefined,
      metadata: {},
    };
  },
};
