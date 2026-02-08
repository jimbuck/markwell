import type {
  IngestConverter,
  CanProcessInput,
  IngestInput,
  IngestOutput,
} from "../core/types.js";

async function loadTurndown() {
  const TurndownModule = await import("turndown");
  return TurndownModule.default ?? TurndownModule;
}

export const htmlIngest: IngestConverter = {
  name: "html",
  extensions: [".html", ".htm"],

  async canProcess(_input: CanProcessInput): Promise<boolean> {
    // Extension match is sufficient for HTML files
    return true;
  },

  async ingest(input: IngestInput): Promise<IngestOutput> {
    const TurndownService = await loadTurndown();
    const turndown = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
      bulletListMarker: "-",
    });

    const html = input.buffer.toString("utf-8");
    const markdown = turndown.turndown(html);

    return {
      markdown,
      metadata: {},
    };
  },
};
