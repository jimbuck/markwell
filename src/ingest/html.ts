import type {
  IngestConverter,
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

  canProcess: async () => true,

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
