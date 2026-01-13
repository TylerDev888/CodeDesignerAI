"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNonce = getNonce;
exports.formatBytes = formatBytes;
exports.padHex = padHex;
exports.getBytesLE = getBytesLE;
function getNonce() {
    let text = "";
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++)
        text += chars.charAt(Math.floor(Math.random() * chars.length));
    return text;
}
function formatBytes(bytes) {
    return [...bytes]
        .reverse()
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(" ");
}
function padHex(hex, padSize) {
    return hex.toString(16).toUpperCase().padStart(padSize, "0");
}
function getBytesLE(buffer) {
    return Array.from(buffer)
        .reverse()
        .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
        .join(" ");
}
//# sourceMappingURL=helpers.js.map