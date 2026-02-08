import { ConverterRegistry } from "../core/registry.js";
import { docxIngest } from "../ingest/docx.js";
import { xlsxIngest } from "../ingest/xlsx.js";
import { pptxIngest } from "../ingest/pptx.js";
import { vttIngest } from "../ingest/vtt.js";
import { srtIngest } from "../ingest/srt.js";
import { htmlIngest } from "../ingest/html.js";
import { rtfIngest } from "../ingest/rtf.js";
import { excalidrawIngest } from "../ingest/excalidraw.js";
import { marpIngest } from "../ingest/marp.js";
import { jsonIngest } from "../ingest/json.js";
import { documentExport } from "../export/document.js";
import { spreadsheetExport } from "../export/spreadsheet.js";

let registry: ConverterRegistry | null = null;

export function getRegistry(): ConverterRegistry {
  if (!registry) {
    registry = new ConverterRegistry();

    // ── Ingest converters ──
    // Registration order matters: specific converters before generic ones.

    // Smart detection: specific converters first
    registry.registerIngest(excalidrawIngest); // before generic JSON
    registry.registerIngest(marpIngest); // before any generic Markdown

    // Office formats
    registry.registerIngest(docxIngest);
    registry.registerIngest(xlsxIngest);
    registry.registerIngest(pptxIngest);

    // Text-based formats
    registry.registerIngest(vttIngest);
    registry.registerIngest(srtIngest);
    registry.registerIngest(htmlIngest);
    registry.registerIngest(rtfIngest);

    // Generic fallbacks (must be last)
    registry.registerIngest(jsonIngest);

    // ── Export converters ──
    registry.registerExport(documentExport);
    registry.registerExport(spreadsheetExport);
  }
  return registry;
}
