import type {
  IngestConverter,
  CanProcessInput,
  IngestInput,
  IngestOutput,
} from "../core/types.js";
import { cuesToMarkdown, type Cue } from "./vtt.js";

/**
 * Check if content looks like SRT format:
 * sequential number, then timestamp line with -->
 */
function isSrtFormat(head: string): boolean {
  const lines = head.trim().replace(/\r\n/g, "\n").split("\n");
  if (lines.length < 2) return false;

  // First line should be a number (cue index)
  if (!/^\d+$/.test(lines[0].trim())) return false;

  // Second line should be a timestamp line with -->
  return /\d{2}:\d{2}:\d{2},\d{3}\s*-->\s*\d{2}:\d{2}:\d{2},\d{3}/.test(
    lines[1],
  );
}

/**
 * Normalize SRT timestamp (comma for ms) to VTT-style (period for ms).
 * "00:01:23,456" → "00:01:23.456"
 */
function normalizeTimestamp(ts: string): string {
  return ts.replace(",", ".");
}

function parseSrtContent(content: string): Cue[] {
  const cues: Cue[] = [];
  const normalized = content.replace(/\r\n/g, "\n");
  const blocks = normalized.trim().split(/\n\n+/);

  for (const block of blocks) {
    const lines = block.trim().split("\n");
    if (lines.length < 3) continue;

    // Line 0: cue index (skip)
    // Line 1: timestamps
    const tsMatch = lines[1].match(
      /(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/,
    );
    if (!tsMatch) continue;

    // Lines 2+: cue text
    const text = lines.slice(2).join("\n").trim();

    if (text) {
      cues.push({
        startTime: normalizeTimestamp(tsMatch[1]),
        endTime: normalizeTimestamp(tsMatch[2]),
        // SRT has no native speaker labels
        text,
      });
    }
  }

  return cues;
}

export const srtIngest: IngestConverter = {
  name: "srt",
  extensions: [".srt"],

  async canProcess(input: CanProcessInput): Promise<boolean> {
    return isSrtFormat(input.head);
  },

  async ingest(input: IngestInput): Promise<IngestOutput> {
    const content = input.buffer.toString("utf-8");
    const cues = parseSrtContent(content);
    const markdown = cuesToMarkdown(cues);

    return {
      markdown,
      metadata: {
        cueCount: cues.length,
      },
    };
  },
};
