
  // Format signed immediate with 4-digit hex padding
 export const formatImm = (val: number) => {
    const hex = (val & 0xffff).toString(16).toUpperCase().padStart(4, "0");
    return `$${hex}`;
  };

  // Format branch/jump target address with 8-digit hex padding
  export const formatAddr = (addr: number) => {
    const hex = (addr >>> 0).toString(16).toUpperCase().padStart(8, "0");
    return `$${hex}`;
  };

  // Format branch with target address and instruction count
  export const formatBranch = (targetAddr: number, offset: number) => {
    const addrHex = (targetAddr >>> 0)
      .toString(16)
      .toUpperCase()
      .padStart(8, "0");
    const instrCount = offset / 4; // Convert byte offset to instruction count
    const sign = instrCount >= 0 ? "+" : "";
    const arrow = instrCount >= 0 ? "▼" : "▲";
    return `$${addrHex} (${sign}${instrCount + 1}${arrow})`;
  };