import type {
  IngestConverter,
  CanProcessInput,
  IngestInput,
  IngestOutput,
} from "../core/types.js";

async function loadRtfToHtml() {
  const mod = await import("@iarna/rtf-to-html");
  return mod.default ?? mod;
}

async function loadTurndown() {
  const TurndownModule = await import("turndown");
  return TurndownModule.default ?? TurndownModule;
}

function rtfFromString(
  rtfToHTML: { fromString: (content: string, callback: (err: Error | null, html: string) => void) => void },
  content: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    rtfToHTML.fromString(content, (err: Error | null, html: string) => {
      if (err) reject(err);
      else resolve(html);
    });
  });
}

export const rtfIngest: IngestConverter = {
  name: "rtf",
  extensions: [".rtf"],

  async canProcess(input: CanProcessInput): Promise<boolean> {
    return input.head.trimStart().startsWith("{\\rtf");
  },

  async ingest(input: IngestInput): Promise<IngestOutput> {
    const rtfToHTML = await loadRtfToHtml();
    const TurndownService = await loadTurndown();

    const content = input.buffer.toString("utf-8");
    const html = await rtfFromString(rtfToHTML, content);

    const turndown = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
      bulletListMarker: "-",
    });

    const markdown = turndown.turndown(html);

    return {
      markdown,
      metadata: {},
    };
  },
};
