import { ConverterRegistry } from "../core/registry.js";
import { docxIngest } from "../ingest/docx.js";
import { xlsxIngest } from "../ingest/xlsx.js";
import { pptxIngest } from "../ingest/pptx.js";

let registry: ConverterRegistry | null = null;

export function getRegistry(): ConverterRegistry {
  if (!registry) {
    registry = new ConverterRegistry();

    // ── Ingest converters ──
    // Registration order matters: specific converters before generic ones.
    // Specific converters (Excalidraw, MARP) will be registered first
    // in tasks 0500-0600, before generic ones (JSON, etc.)

    // Office formats
    registry.registerIngest(docxIngest);
    registry.registerIngest(xlsxIngest);
    registry.registerIngest(pptxIngest);

    // ── Export converters ──
    // Will be registered in tasks 0700-1000
  }
  return registry;
}
