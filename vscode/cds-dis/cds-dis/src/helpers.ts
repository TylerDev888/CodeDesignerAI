export function getNonce() {
  let text = "";
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++)
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  return text;
}

export function formatBytes(bytes: Buffer) {
  return [...bytes]
    .reverse()
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(" ");
}
export function padHex(hex: number, padSize: number) : string{
  return hex.toString(16).toUpperCase().padStart(padSize, "0");
}

export function getBytesLE(buffer: Buffer<ArrayBuffer>) : string {
  return Array.from(buffer)
      .reverse()
      .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
      .join(" ");
}

