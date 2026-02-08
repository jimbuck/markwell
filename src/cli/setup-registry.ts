import { ConverterRegistry } from "../core/registry.js";
import { docxIngest } from "../ingest/docx.js";
import { xlsxIngest } from "../ingest/xlsx.js";
import { pptxIngest } from "../ingest/pptx.js";
import { vttIngest } from "../ingest/vtt.js";
import { srtIngest } from "../ingest/srt.js";
import { htmlIngest } from "../ingest/html.js";
import { rtfIngest } from "../ingest/rtf.js";

let registry: ConverterRegistry | null = null;

export function getRegistry(): ConverterRegistry {
  if (!registry) {
    registry = new ConverterRegistry();

    // ── Ingest converters ──
    // Registration order matters: specific converters before generic ones.
    // Specific converters (Excalidraw, MARP) will be registered first
    // in task 0600, before generic ones (JSON, etc.)

    // Office formats
    registry.registerIngest(docxIngest);
    registry.registerIngest(xlsxIngest);
    registry.registerIngest(pptxIngest);

    // Text-based formats
    registry.registerIngest(vttIngest);
    registry.registerIngest(srtIngest);
    registry.registerIngest(htmlIngest);
    registry.registerIngest(rtfIngest);

    // ── Export converters ──
    // Will be registered in tasks 0700-1000
  }
  return registry;
}
