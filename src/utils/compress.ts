export async function compress(str: string): Promise<ArrayBuffer> {
  const compressedStream = new Response(str).body.pipeThrough(
    new CompressionStream("gzip")
  );
  const bytes = await new Response(compressedStream).arrayBuffer();
  return bytes;
}

export async function decompress(bytes: ArrayBuffer): Promise<string> {
  const decompressedStream = new Response(bytes).body.pipeThrough(
    new DecompressionStream("gzip")
  );
  const outString = await new Response(decompressedStream).text();
  return outString;
}
