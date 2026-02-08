declare module "@iarna/rtf-to-html" {
  type Callback = (err: Error | null, html: string) => void;

  interface RtfToHTML {
    fromString(rtf: string, cb: Callback): void;
    fromString(rtf: string, opts: Record<string, unknown>, cb: Callback): void;
  }

  const rtfToHTML: RtfToHTML;
  export default rtfToHTML;
}
