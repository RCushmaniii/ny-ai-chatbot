declare module "mammoth" {
  export type ExtractRawTextResult = {
    value: string;
    messages: unknown[];
  };

  export function extractRawText(options: {
    buffer: Buffer;
  }): Promise<ExtractRawTextResult>;

  const mammoth: {
    extractRawText: typeof extractRawText;
  };

  export default mammoth;
}
