import JSZip from "jszip";

/** PK zip local file header signature */
const PK_SIGNATURE = Buffer.from([0x50, 0x4b, 0x03, 0x04]);

/**
 * Check if a buffer starts with the PK zip signature.
 */
export function isZipFile(buffer: Buffer): boolean {
  if (buffer.length < 4) return false;
  return buffer.subarray(0, 4).equals(PK_SIGNATURE);
}

/**
 * Check if a zip buffer contains an entry matching the given path pattern.
 */
export async function hasZipEntry(
  buffer: Buffer,
  entryPath: string,
): Promise<boolean> {
  if (!isZipFile(buffer)) return false;

  try {
    const zip = await JSZip.loadAsync(buffer);
    return zip.file(entryPath) !== null;
  } catch {
    return false;
  }
}

/**
 * Check if the buffer is an OOXML DOCX file.
 */
export async function isDocx(buffer: Buffer): Promise<boolean> {
  return hasZipEntry(buffer, "word/document.xml");
}

/**
 * Check if the buffer is an OOXML XLSX file.
 */
export async function isXlsx(buffer: Buffer): Promise<boolean> {
  return hasZipEntry(buffer, "xl/workbook.xml");
}

/**
 * Check if the buffer is an OOXML PPTX file.
 */
export async function isPptx(buffer: Buffer): Promise<boolean> {
  return hasZipEntry(buffer, "ppt/presentation.xml");
}
