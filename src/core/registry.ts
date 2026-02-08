import path from "node:path";
import type {
  IngestConverter,
  ExportConverter,
  ExportCategory,
  CanProcessInput,
} from "./types.js";

const HEAD_SIZE = 1024;

export class ConverterRegistry {
  private ingestConverters: IngestConverter[] = [];
  private exportConverters: ExportConverter[] = [];

  registerIngest(converter: IngestConverter): void {
    this.ingestConverters.push(converter);
  }

  registerExport(converter: ExportConverter): void {
    this.exportConverters.push(converter);
  }

  /**
   * Find the best ingest converter for a file.
   * 1. Filter by extension match
   * 2. Call canProcess() on each match in registration order
   * 3. Return first converter that returns true
   */
  async resolveIngest(
    filePath: string,
    buffer: Buffer,
  ): Promise<IngestConverter | null> {
    const extension = path.extname(filePath).toLowerCase();

    const candidates = this.ingestConverters.filter((c) =>
      c.extensions.includes(extension),
    );

    if (candidates.length === 0) {
      return null;
    }

    const head = buffer.subarray(0, HEAD_SIZE).toString("utf-8");
    const input: CanProcessInput = { filePath, extension, buffer, head };

    for (const converter of candidates) {
      if (await converter.canProcess(input)) {
        return converter;
      }
    }

    return null;
  }

  /**
   * Find the export converter for a given category and optional format.
   * Returns null if no converter matches or the format is not supported.
   */
  resolveExport(
    category: ExportCategory,
    format?: string,
  ): ExportConverter | null {
    const converter = this.exportConverters.find(
      (c) => c.category === category,
    );

    if (!converter) {
      return null;
    }

    if (format) {
      const normalizedFormat = format.startsWith(".")
        ? format
        : `.${format}`;
      const supported = converter.formats.some(
        (f) => f.extension === normalizedFormat,
      );
      if (!supported) {
        return null;
      }
    }

    return converter;
  }

  listIngest(): IngestConverter[] {
    return [...this.ingestConverters];
  }

  listExport(): ExportConverter[] {
    return [...this.exportConverters];
  }
}
