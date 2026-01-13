"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatBranch = exports.formatAddr = exports.formatImm = void 0;
// Format signed immediate with 4-digit hex padding
const formatImm = (val) => {
    const hex = (val & 0xffff).toString(16).toUpperCase().padStart(4, "0");
    return `$${hex}`;
};
exports.formatImm = formatImm;
// Format branch/jump target address with 8-digit hex padding
const formatAddr = (addr) => {
    const hex = (addr >>> 0).toString(16).toUpperCase().padStart(8, "0");
    return `$${hex}`;
};
exports.formatAddr = formatAddr;
// Format branch with target address and instruction count
const formatBranch = (targetAddr, offset) => {
    const addrHex = (targetAddr >>> 0)
        .toString(16)
        .toUpperCase()
        .padStart(8, "0");
    const instrCount = offset / 4; // Convert byte offset to instruction count
    const sign = instrCount >= 0 ? "+" : "";
    const arrow = instrCount >= 0 ? "▼" : "▲";
    return `$${addrHex} (${sign}${instrCount + 1}${arrow})`;
};
exports.formatBranch = formatBranch;
//# sourceMappingURL=format.js.map