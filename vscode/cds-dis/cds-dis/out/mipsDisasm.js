"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.disassemble = disassemble;
const format_1 = require("./format");
const helpers_1 = require("./helpers");
const mipsAnalyst_1 = require("./mipsAnalyst");
/**
 * Enhanced disassemble with better comment system
 */
function disassemble(startAddr, buffer) {
    const rows = [];
    const regs = new Map();
    // First pass: decode all instructions
    for (let offset = 0; offset < buffer.length; offset += 4) {
        const slice = buffer.slice(offset, offset + 4);
        if (slice.length < 4)
            break;
        const bytesLE = (0, helpers_1.getBytesLE)(slice);
        const instr = slice.readUInt32LE(0);
        const currentAddr = startAddr + offset;
        const decoded = decodeMIPS(instr, currentAddr);
        if (decoded) {
            rows.push({
                addr: (0, helpers_1.padHex)(currentAddr, 8),
                bytes: bytesLE,
                label: decoded.label || "",
                op: decoded.op,
                args: decoded.args,
                comment: "",
                rawInstr: instr
            });
        }
    }
    // Second pass: detect functions and add labels
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const instr = row.rawInstr;
        const addr = parseInt(row.addr, 16);
        // Detect function prologue and add label
        if ((0, mipsAnalyst_1.isFunctionPrologue)(instr)) {
            row.label = "FUN_" + (0, helpers_1.padHex)(row.addr, 8);
        }
    }
    // Third pass: track registers and generate enhanced comments
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const addr = parseInt(row.addr, 16);
        const instr = row.rawInstr;
        const op = row.op.toLowerCase();
        const args = row.args.split(",").map((a) => a.trim());
        // Get previous instruction for delay slot detection
        const prevInstr = i > 0 ? rows[i - 1].rawInstr : undefined;
        // Check if this is first instruction in a function
        const isFirstInFunc = row.label.startsWith('FUN_');
        // Update register tracking
        (0, mipsAnalyst_1.updateRegisterTracking)(op, args, instr, regs);
        // Generate enhanced comment
        const enhancedComment = (0, mipsAnalyst_1.generateEnhancedComment)(addr, instr, regs, prevInstr, isFirstInFunc);
        if (enhancedComment) {
            row.comment = enhancedComment;
        }
    }
    // Clean up temporary field
    for (const row of rows) {
        delete row.rawInstr;
    }
    return rows;
}
function decodeMIPS(instr, pc) {
    const opcode = (instr >> 26) & 0x3f;
    const rs = (instr >> 21) & 0x1f;
    const rt = (instr >> 16) & 0x1f;
    const rd = (instr >> 11) & 0x1f;
    const sa = (instr >> 6) & 0x1f;
    const funct = instr & 0x3f;
    const imm = instr & 0xffff;
    const signedImm = imm & 0x8000 ? imm | 0xffff0000 : imm;
    const target = instr & 0x3ffffff;
    const code = (instr >> 6) & 0xfffff;
    const freg = (r) => `f${r}`;
    if (instr === 0)
        return { op: "nop", args: "" };
    // SPECIAL opcode (0x00)
    if (opcode === 0x00) {
        switch (funct) {
            case 0x00:
                return sa === 0
                    ? { op: "nop", args: "" }
                    : { op: "sll", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rt)}, ${sa}` };
            case 0x02:
                return { op: "srl", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rt)}, ${sa}` };
            case 0x03:
                return { op: "sra", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rt)}, ${sa}` };
            case 0x04:
                return { op: "sllv", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rt)}, ${(0, mipsAnalyst_1.regName)(rs)}` };
            case 0x06:
                return { op: "srlv", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rt)}, ${(0, mipsAnalyst_1.regName)(rs)}` };
            case 0x07:
                return { op: "srav", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rt)}, ${(0, mipsAnalyst_1.regName)(rs)}` };
            case 0x08:
                return { op: "jr", args: (0, mipsAnalyst_1.regName)(rs) };
            case 0x09:
                return rd === 31
                    ? { op: "jalr", args: (0, mipsAnalyst_1.regName)(rs) }
                    : { op: "jalr", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}` };
            case 0x0a:
                return { op: "movz", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
            case 0x0b:
                return { op: "movn", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
            case 0x0c:
                return { op: "syscall", args: code > 0 ? `${code}` : "" };
            case 0x0d:
                return { op: "break", args: code > 0 ? `${code}` : "" };
            case 0x0f:
                return { op: "sync", args: sa > 0 ? `${sa}` : "" };
            case 0x10:
                return { op: "mfhi", args: (0, mipsAnalyst_1.regName)(rd) };
            case 0x11:
                return { op: "mthi", args: (0, mipsAnalyst_1.regName)(rs) };
            case 0x12:
                return { op: "mflo", args: (0, mipsAnalyst_1.regName)(rd) };
            case 0x13:
                return { op: "mtlo", args: (0, mipsAnalyst_1.regName)(rs) };
            case 0x14:
                return { op: "dsllv", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rt)}, ${(0, mipsAnalyst_1.regName)(rs)}` };
            case 0x16:
                return { op: "dsrlv", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rt)}, ${(0, mipsAnalyst_1.regName)(rs)}` };
            case 0x17:
                return { op: "dsrav", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rt)}, ${(0, mipsAnalyst_1.regName)(rs)}` };
            case 0x18:
                return rd === 0
                    ? { op: "mult", args: `${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` }
                    : { op: "mult", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
            case 0x19:
                return rd === 0
                    ? { op: "multu", args: `${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` }
                    : { op: "multu", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
            case 0x1a:
                return { op: "div", args: `${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
            case 0x1b:
                return { op: "divu", args: `${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
            case 0x1c:
                return {
                    op: "dmult",
                    args: rd === 0
                        ? `${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}`
                        : `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}`,
                };
            case 0x1d:
                return {
                    op: "dmultu",
                    args: rd === 0
                        ? `${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}`
                        : `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}`,
                };
            case 0x1e:
                return { op: "ddiv", args: `${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
            case 0x1f:
                return { op: "ddivu", args: `${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
            case 0x20:
                return { op: "add", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
            case 0x21:
                return { op: "addu", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
            case 0x22:
                return { op: "sub", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
            case 0x23:
                return { op: "subu", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
            case 0x24:
                return { op: "and", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
            case 0x25:
                return { op: "or", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
            case 0x26:
                return { op: "xor", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
            case 0x27:
                return { op: "nor", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
            case 0x28:
                return { op: "mfsa", args: (0, mipsAnalyst_1.regName)(rd) };
            case 0x29:
                return { op: "mtsa", args: (0, mipsAnalyst_1.regName)(rs) };
            case 0x2a:
                return { op: "slt", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
            case 0x2b:
                return { op: "sltu", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
            case 0x2c:
                return { op: "dadd", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
            case 0x2d:
                return { op: "daddu", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
            case 0x2e:
                return { op: "dsub", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
            case 0x2f:
                return { op: "dsubu", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
            case 0x30:
                return { op: "tge", args: `${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
            case 0x31:
                return { op: "tgeu", args: `${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
            case 0x32:
                return { op: "tlt", args: `${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
            case 0x33:
                return { op: "tltu", args: `${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
            case 0x34:
                return { op: "teq", args: `${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
            case 0x36:
                return { op: "tne", args: `${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
            case 0x38:
                return { op: "dsll", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rt)}, ${sa}` };
            case 0x3a:
                return { op: "dsrl", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rt)}, ${sa}` };
            case 0x3b:
                return { op: "dsra", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rt)}, ${sa}` };
            case 0x3c:
                return { op: "dsll32", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rt)}, ${sa}` };
            case 0x3e:
                return { op: "dsrl32", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rt)}, ${sa}` };
            case 0x3f:
                return { op: "dsra32", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rt)}, ${sa}` };
        }
    }
    // REGIMM opcode (0x01)
    if (opcode === 0x01) {
        switch (rt) {
            case 0x00:
                return {
                    op: "bltz",
                    args: `${(0, mipsAnalyst_1.regName)(rs)}, ${(0, format_1.formatBranch)(pc + 4 + (signedImm << 2), signedImm << 2)}`,
                };
            case 0x01:
                return {
                    op: "bgez",
                    args: `${(0, mipsAnalyst_1.regName)(rs)}, ${(0, format_1.formatBranch)(pc + 4 + (signedImm << 2), signedImm << 2)}`,
                };
            case 0x02:
                return {
                    op: "bltzl",
                    args: `${(0, mipsAnalyst_1.regName)(rs)}, ${(0, format_1.formatBranch)(pc + 4 + (signedImm << 2), signedImm << 2)}`,
                };
            case 0x03:
                return {
                    op: "bgezl",
                    args: `${(0, mipsAnalyst_1.regName)(rs)}, ${(0, format_1.formatBranch)(pc + 4 + (signedImm << 2), signedImm << 2)}`,
                };
            case 0x08:
                return { op: "tgei", args: `${(0, mipsAnalyst_1.regName)(rs)}, ${(0, format_1.formatImm)(signedImm)}` };
            case 0x09:
                return { op: "tgeiu", args: `${(0, mipsAnalyst_1.regName)(rs)}, ${(0, format_1.formatImm)(signedImm)}` };
            case 0x0a:
                return { op: "tlti", args: `${(0, mipsAnalyst_1.regName)(rs)}, ${(0, format_1.formatImm)(signedImm)}` };
            case 0x0b:
                return { op: "tltiu", args: `${(0, mipsAnalyst_1.regName)(rs)}, ${(0, format_1.formatImm)(signedImm)}` };
            case 0x0c:
                return { op: "teqi", args: `${(0, mipsAnalyst_1.regName)(rs)}, ${(0, format_1.formatImm)(signedImm)}` };
            case 0x0e:
                return { op: "tnei", args: `${(0, mipsAnalyst_1.regName)(rs)}, ${(0, format_1.formatImm)(signedImm)}` };
            case 0x10:
                return {
                    op: "bltzal",
                    args: `${(0, mipsAnalyst_1.regName)(rs)}, ${(0, format_1.formatBranch)(pc + 4 + (signedImm << 2), signedImm << 2)}`,
                };
            case 0x11:
                return {
                    op: "bgezal",
                    args: `${(0, mipsAnalyst_1.regName)(rs)}, ${(0, format_1.formatBranch)(pc + 4 + (signedImm << 2), signedImm << 2)}`,
                };
            case 0x12:
                return {
                    op: "bltzall",
                    args: `${(0, mipsAnalyst_1.regName)(rs)}, ${(0, format_1.formatBranch)(pc + 4 + (signedImm << 2), signedImm << 2)}`,
                };
            case 0x13:
                return {
                    op: "bgezall",
                    args: `${(0, mipsAnalyst_1.regName)(rs)}, ${(0, format_1.formatBranch)(pc + 4 + (signedImm << 2), signedImm << 2)}`,
                };
            case 0x18:
                return { op: "mtsab", args: `${(0, mipsAnalyst_1.regName)(rs)}, ${(0, format_1.formatImm)(imm)}` };
            case 0x19:
                return { op: "mtsah", args: `${(0, mipsAnalyst_1.regName)(rs)}, ${(0, format_1.formatImm)(imm)}` };
        }
    }
    // J and JAL (0x02, 0x03)
    if (opcode === 0x02) {
        return { op: "j", args: (0, format_1.formatAddr)((pc & 0xf0000000) | (target << 2)) };
    }
    if (opcode === 0x03) {
        return { op: "jal", args: (0, format_1.formatAddr)((pc & 0xf0000000) | (target << 2)) };
    }
    // Branch instructions (0x04-0x07, 0x14-0x17)
    if (opcode === 0x04)
        return {
            op: "beq",
            args: `${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}, ${(0, format_1.formatBranch)(pc + 4 + (signedImm << 2), signedImm << 2)}`,
        };
    if (opcode === 0x05)
        return {
            op: "bne",
            args: `${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}, ${(0, format_1.formatBranch)(pc + 4 + (signedImm << 2), signedImm << 2)}`,
        };
    if (opcode === 0x06)
        return {
            op: "blez",
            args: `${(0, mipsAnalyst_1.regName)(rs)}, ${(0, format_1.formatBranch)(pc + 4 + (signedImm << 2), signedImm << 2)}`,
        };
    if (opcode === 0x07)
        return {
            op: "bgtz",
            args: `${(0, mipsAnalyst_1.regName)(rs)}, ${(0, format_1.formatBranch)(pc + 4 + (signedImm << 2), signedImm << 2)}`,
        };
    if (opcode === 0x14)
        return {
            op: "beql",
            args: `${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}, ${(0, format_1.formatBranch)(pc + 4 + (signedImm << 2), signedImm << 2)}`,
        };
    if (opcode === 0x15)
        return {
            op: "bnel",
            args: `${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}, ${(0, format_1.formatBranch)(pc + 4 + (signedImm << 2), signedImm << 2)}`,
        };
    if (opcode === 0x16)
        return {
            op: "blezl",
            args: `${(0, mipsAnalyst_1.regName)(rs)}, ${(0, format_1.formatBranch)(pc + 4 + (signedImm << 2), signedImm << 2)}`,
        };
    if (opcode === 0x17)
        return {
            op: "bgtzl",
            args: `${(0, mipsAnalyst_1.regName)(rs)}, ${(0, format_1.formatBranch)(pc + 4 + (signedImm << 2), signedImm << 2)}`,
        };
    // Immediate arithmetic/logical (0x08-0x0f, 0x18-0x19)
    if (opcode === 0x08)
        return {
            op: "addi",
            args: `${(0, mipsAnalyst_1.regName)(rt)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, format_1.formatImm)(signedImm)}`,
        };
    if (opcode === 0x09)
        return {
            op: "addiu",
            args: `${(0, mipsAnalyst_1.regName)(rt)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, format_1.formatImm)(signedImm)}`,
        };
    if (opcode === 0x0a)
        return {
            op: "slti",
            args: `${(0, mipsAnalyst_1.regName)(rt)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, format_1.formatImm)(signedImm)}`,
        };
    if (opcode === 0x0b)
        return { op: "sltiu", args: `${(0, mipsAnalyst_1.regName)(rt)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, format_1.formatImm)(imm)}` };
    if (opcode === 0x0c)
        return { op: "andi", args: `${(0, mipsAnalyst_1.regName)(rt)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, format_1.formatImm)(imm)}` };
    if (opcode === 0x0d)
        return { op: "ori", args: `${(0, mipsAnalyst_1.regName)(rt)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, format_1.formatImm)(imm)}` };
    if (opcode === 0x0e)
        return { op: "xori", args: `${(0, mipsAnalyst_1.regName)(rt)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, format_1.formatImm)(imm)}` };
    if (opcode === 0x0f)
        return { op: "lui", args: `${(0, mipsAnalyst_1.regName)(rt)}, ${(0, format_1.formatImm)(imm)}` };
    if (opcode === 0x18)
        return {
            op: "daddi",
            args: `${(0, mipsAnalyst_1.regName)(rt)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, format_1.formatImm)(signedImm)}`,
        };
    if (opcode === 0x19)
        return {
            op: "daddiu",
            args: `${(0, mipsAnalyst_1.regName)(rt)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, format_1.formatImm)(signedImm)}`,
        };
    // Load instructions (0x1a-0x1b, 0x20-0x27, 0x37)
    if (opcode === 0x1a)
        return {
            op: "ldl",
            args: `${(0, mipsAnalyst_1.regName)(rt)}, ${(0, format_1.formatImm)(signedImm)}(${(0, mipsAnalyst_1.regName)(rs)})`,
        };
    if (opcode === 0x1b)
        return {
            op: "ldr",
            args: `${(0, mipsAnalyst_1.regName)(rt)}, ${(0, format_1.formatImm)(signedImm)}(${(0, mipsAnalyst_1.regName)(rs)})`,
        };
    if (opcode === 0x20)
        return {
            op: "lb",
            args: `${(0, mipsAnalyst_1.regName)(rt)}, ${(0, format_1.formatImm)(signedImm)}(${(0, mipsAnalyst_1.regName)(rs)})`,
        };
    if (opcode === 0x21)
        return {
            op: "lh",
            args: `${(0, mipsAnalyst_1.regName)(rt)}, ${(0, format_1.formatImm)(signedImm)}(${(0, mipsAnalyst_1.regName)(rs)})`,
        };
    if (opcode === 0x22)
        return {
            op: "lwl",
            args: `${(0, mipsAnalyst_1.regName)(rt)}, ${(0, format_1.formatImm)(signedImm)}(${(0, mipsAnalyst_1.regName)(rs)})`,
        };
    if (opcode === 0x23)
        return {
            op: "lw",
            args: `${(0, mipsAnalyst_1.regName)(rt)}, ${(0, format_1.formatImm)(signedImm)}(${(0, mipsAnalyst_1.regName)(rs)})`,
        };
    if (opcode === 0x24)
        return {
            op: "lbu",
            args: `${(0, mipsAnalyst_1.regName)(rt)}, ${(0, format_1.formatImm)(signedImm)}(${(0, mipsAnalyst_1.regName)(rs)})`,
        };
    if (opcode === 0x25)
        return {
            op: "lhu",
            args: `${(0, mipsAnalyst_1.regName)(rt)}, ${(0, format_1.formatImm)(signedImm)}(${(0, mipsAnalyst_1.regName)(rs)})`,
        };
    if (opcode === 0x26)
        return {
            op: "lwr",
            args: `${(0, mipsAnalyst_1.regName)(rt)}, ${(0, format_1.formatImm)(signedImm)}(${(0, mipsAnalyst_1.regName)(rs)})`,
        };
    if (opcode === 0x27)
        return {
            op: "lwu",
            args: `${(0, mipsAnalyst_1.regName)(rt)}, ${(0, format_1.formatImm)(signedImm)}(${(0, mipsAnalyst_1.regName)(rs)})`,
        };
    if (opcode === 0x37)
        return {
            op: "ld",
            args: `${(0, mipsAnalyst_1.regName)(rt)}, ${(0, format_1.formatImm)(signedImm)}(${(0, mipsAnalyst_1.regName)(rs)})`,
        };
    // Store instructions (0x28-0x2f, 0x3f)
    if (opcode === 0x28)
        return {
            op: "sb",
            args: `${(0, mipsAnalyst_1.regName)(rt)}, ${(0, format_1.formatImm)(signedImm)}(${(0, mipsAnalyst_1.regName)(rs)})`,
        };
    if (opcode === 0x29)
        return {
            op: "sh",
            args: `${(0, mipsAnalyst_1.regName)(rt)}, ${(0, format_1.formatImm)(signedImm)}(${(0, mipsAnalyst_1.regName)(rs)})`,
        };
    if (opcode === 0x2a)
        return {
            op: "swl",
            args: `${(0, mipsAnalyst_1.regName)(rt)}, ${(0, format_1.formatImm)(signedImm)}(${(0, mipsAnalyst_1.regName)(rs)})`,
        };
    if (opcode === 0x2b)
        return {
            op: "sw",
            args: `${(0, mipsAnalyst_1.regName)(rt)}, ${(0, format_1.formatImm)(signedImm)}(${(0, mipsAnalyst_1.regName)(rs)})`,
        };
    if (opcode === 0x2c)
        return {
            op: "sdl",
            args: `${(0, mipsAnalyst_1.regName)(rt)}, ${(0, format_1.formatImm)(signedImm)}(${(0, mipsAnalyst_1.regName)(rs)})`,
        };
    if (opcode === 0x2d)
        return {
            op: "sdr",
            args: `${(0, mipsAnalyst_1.regName)(rt)}, ${(0, format_1.formatImm)(signedImm)}(${(0, mipsAnalyst_1.regName)(rs)})`,
        };
    if (opcode === 0x2e)
        return {
            op: "swr",
            args: `${(0, mipsAnalyst_1.regName)(rt)}, ${(0, format_1.formatImm)(signedImm)}(${(0, mipsAnalyst_1.regName)(rs)})`,
        };
    if (opcode === 0x2f)
        return { op: "cache", args: `${rt}, ${(0, format_1.formatImm)(signedImm)}(${(0, mipsAnalyst_1.regName)(rs)})` };
    if (opcode === 0x33)
        return { op: "pref", args: `${rt}, ${(0, format_1.formatImm)(signedImm)}(${(0, mipsAnalyst_1.regName)(rs)})` };
    if (opcode === 0x3f)
        return {
            op: "sd",
            args: `${(0, mipsAnalyst_1.regName)(rt)}, ${(0, format_1.formatImm)(signedImm)}(${(0, mipsAnalyst_1.regName)(rs)})`,
        };
    // Quadword loads/stores (PS2 specific - 128-bit)
    if (opcode === 0x1e)
        return {
            op: "lq",
            args: `${(0, mipsAnalyst_1.regName)(rt)}, ${(0, format_1.formatImm)(signedImm)}(${(0, mipsAnalyst_1.regName)(rs)})`,
        };
    if (opcode === 0x1f)
        return {
            op: "sq",
            args: `${(0, mipsAnalyst_1.regName)(rt)}, ${(0, format_1.formatImm)(signedImm)}(${(0, mipsAnalyst_1.regName)(rs)})`,
        };
    // Floating point loads/stores
    if (opcode === 0x31)
        return {
            op: "lwc1",
            args: `${freg(rt)}, ${(0, format_1.formatImm)(signedImm)}(${(0, mipsAnalyst_1.regName)(rs)})`,
        };
    if (opcode === 0x35)
        return {
            op: "ldc1",
            args: `${freg(rt)}, ${(0, format_1.formatImm)(signedImm)}(${(0, mipsAnalyst_1.regName)(rs)})`,
        };
    if (opcode === 0x36)
        return {
            op: "lqc2",
            args: `${freg(rt)}, ${(0, format_1.formatImm)(signedImm)}(${(0, mipsAnalyst_1.regName)(rs)})`,
        };
    if (opcode === 0x39)
        return {
            op: "swc1",
            args: `${freg(rt)}, ${(0, format_1.formatImm)(signedImm)}(${(0, mipsAnalyst_1.regName)(rs)})`,
        };
    if (opcode === 0x3d)
        return {
            op: "sdc1",
            args: `${freg(rt)}, ${(0, format_1.formatImm)(signedImm)}(${(0, mipsAnalyst_1.regName)(rs)})`,
        };
    if (opcode === 0x3e)
        return {
            op: "sqc2",
            args: `${freg(rt)}, ${(0, format_1.formatImm)(signedImm)}(${(0, mipsAnalyst_1.regName)(rs)})`,
        };
    // MMI opcode (0x1C) - PS2 specific
    if (opcode === 0x1c) {
        const mmiFunc = funct & 0x3f;
        const mmiFmt = (instr >> 6) & 0x1f;
        switch (mmiFunc) {
            case 0x00:
                return {
                    op: "madd",
                    args: rd === 0
                        ? `${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}`
                        : `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}`,
                };
            case 0x01:
                return {
                    op: "maddu",
                    args: rd === 0
                        ? `${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}`
                        : `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}`,
                };
            case 0x04:
                return { op: "plzcw", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}` };
            case 0x08:
                switch (mmiFmt) {
                    case 0x00:
                        return { op: "paddw", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x01:
                        return { op: "psubw", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x02:
                        return { op: "pcgtw", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x03:
                        return { op: "pmaxw", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x04:
                        return { op: "paddh", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x05:
                        return { op: "psubh", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x06:
                        return { op: "pcgth", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x07:
                        return { op: "pmaxh", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x08:
                        return { op: "paddb", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x09:
                        return { op: "psubb", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x0a:
                        return { op: "pcgtb", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x10:
                        return { op: "paddsw", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x11:
                        return { op: "psubsw", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x12:
                        return { op: "pextlw", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x13:
                        return { op: "ppacw", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x14:
                        return { op: "paddsh", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x15:
                        return { op: "psubsh", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x16:
                        return { op: "pextlh", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x17:
                        return { op: "ppach", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x18:
                        return { op: "paddsb", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x19:
                        return { op: "psubsb", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x1a:
                        return { op: "pextlb", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x1b:
                        return { op: "ppacb", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x1e:
                        return { op: "pext5", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x1f:
                        return { op: "ppac5", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                }
                break;
            case 0x09:
                switch (mmiFmt) {
                    case 0x00:
                        return { op: "pmaddw", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x01:
                        return { op: "pmsubw", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x02:
                        return { op: "psllvw", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rt)}, ${(0, mipsAnalyst_1.regName)(rs)}` };
                    case 0x03:
                        return { op: "psrlvw", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rt)}, ${(0, mipsAnalyst_1.regName)(rs)}` };
                    case 0x04:
                        return { op: "pmfhi", args: (0, mipsAnalyst_1.regName)(rd) };
                    case 0x05:
                        return { op: "pmflo", args: (0, mipsAnalyst_1.regName)(rd) };
                    case 0x06:
                        return { op: "pinth", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x08:
                        return { op: "pmultw", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x09:
                        return { op: "pdivw", args: `${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x0a:
                        return { op: "pcpyld", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x0c:
                        return { op: "pmaddh", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x0d:
                        return { op: "phmadh", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x0e:
                        return { op: "pand", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x0f:
                        return { op: "pxor", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x10:
                        return { op: "pmsubh", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x11:
                        return { op: "phmsbh", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x12:
                        return { op: "pexeh", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x13:
                        return { op: "prevh", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x14:
                        return { op: "pmulth", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x15:
                        return { op: "pdivbw", args: `${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x16:
                        return { op: "pexew", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x17:
                        return { op: "prot3w", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                }
                break;
            case 0x10:
                return { op: "mfhi1", args: (0, mipsAnalyst_1.regName)(rd) };
            case 0x11:
                return { op: "mthi1", args: (0, mipsAnalyst_1.regName)(rs) };
            case 0x12:
                return { op: "mflo1", args: (0, mipsAnalyst_1.regName)(rd) };
            case 0x13:
                return { op: "mtlo1", args: (0, mipsAnalyst_1.regName)(rs) };
            case 0x18:
                return {
                    op: "mult1",
                    args: rd === 0
                        ? `${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}`
                        : `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}`,
                };
            case 0x19:
                return {
                    op: "multu1",
                    args: rd === 0
                        ? `${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}`
                        : `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}`,
                };
            case 0x1a:
                return { op: "div1", args: `${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
            case 0x1b:
                return { op: "divu1", args: `${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
            case 0x20:
                return {
                    op: "madd1",
                    args: rd === 0
                        ? `${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}`
                        : `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}`,
                };
            case 0x21:
                return {
                    op: "maddu1",
                    args: rd === 0
                        ? `${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}`
                        : `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}`,
                };
            case 0x28:
                switch (mmiFmt) {
                    case 0x00:
                        return {
                            op: "pmadduw",
                            args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}`,
                        };
                    case 0x02:
                        return { op: "psravw", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rt)}, ${(0, mipsAnalyst_1.regName)(rs)}` };
                    case 0x03:
                        return { op: "pmthi", args: (0, mipsAnalyst_1.regName)(rs) };
                    case 0x04:
                        return { op: "pmtlo", args: (0, mipsAnalyst_1.regName)(rs) };
                    case 0x05:
                        return { op: "pinteh", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x08:
                        return {
                            op: "pmultuw",
                            args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}`,
                        };
                    case 0x09:
                        return { op: "pdivuw", args: `${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x0a:
                        return { op: "pcpyud", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x0e:
                        return { op: "por", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x0f:
                        return { op: "pnor", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x12:
                        return { op: "pexch", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x13:
                        return { op: "pcpyh", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x16:
                        return { op: "pexcw", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                }
                break;
            case 0x29:
                switch (mmiFmt) {
                    case 0x00:
                        return { op: "psubuw", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x01:
                        return { op: "pextuw", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x02:
                        return { op: "pceqw", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x03:
                        return { op: "pminw", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x04:
                        return { op: "padsbh", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x05:
                        return { op: "psubuh", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x06:
                        return { op: "pceqh", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x07:
                        return { op: "pminh", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x0a:
                        return { op: "pceqb", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x10:
                        return { op: "padduw", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x11:
                        return { op: "pextuw", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x14:
                        return { op: "padduh", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x15:
                        return { op: "psubuh", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x16:
                        return { op: "pextuh", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x18:
                        return { op: "paddub", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x19:
                        return { op: "psubub", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x1a:
                        return { op: "pextub", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x1b:
                        return { op: "qfsrv", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rs)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x1d:
                        return { op: "pabsw", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                    case 0x1e:
                        return { op: "pabsh", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rt)}` };
                }
                break;
            case 0x30:
                const fmt = mmiFmt & 0x1f;
                switch (fmt) {
                    case 0x00:
                        return { op: "pmfhl.lw", args: (0, mipsAnalyst_1.regName)(rd) };
                    case 0x01:
                        return { op: "pmfhl.uw", args: (0, mipsAnalyst_1.regName)(rd) };
                    case 0x02:
                        return { op: "pmfhl.slw", args: (0, mipsAnalyst_1.regName)(rd) };
                    case 0x03:
                        return { op: "pmfhl.lh", args: (0, mipsAnalyst_1.regName)(rd) };
                    case 0x04:
                        return { op: "pmfhl.sh", args: (0, mipsAnalyst_1.regName)(rd) };
                }
                break;
            case 0x31:
                if (mmiFmt === 0x00)
                    return { op: "pmthl.lw", args: (0, mipsAnalyst_1.regName)(rs) };
                break;
            case 0x34:
                return { op: "psllh", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rt)}, ${sa}` };
            case 0x36:
                return { op: "psrlh", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rt)}, ${sa}` };
            case 0x37:
                return { op: "psrah", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rt)}, ${sa}` };
            case 0x3c:
                return { op: "psllw", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rt)}, ${sa}` };
            case 0x3e:
                return { op: "psrlw", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rt)}, ${sa}` };
            case 0x3f:
                return { op: "psraw", args: `${(0, mipsAnalyst_1.regName)(rd)}, ${(0, mipsAnalyst_1.regName)(rt)}, ${sa}` };
        }
    }
    // COP0 opcode (0x10)
    if (opcode === 0x10) {
        const cop0Func = rs;
        if (cop0Func === 0x00)
            return { op: "mfc0", args: `${(0, mipsAnalyst_1.regName)(rt)}, $${rd}` };
        if (cop0Func === 0x04)
            return { op: "mtc0", args: `${(0, mipsAnalyst_1.regName)(rt)}, $${rd}` };
        if (cop0Func === 0x08) {
            const bc0 = rt;
            if (bc0 === 0x00)
                return {
                    op: "bc0f",
                    args: (0, format_1.formatBranch)(pc + 4 + (signedImm << 2), signedImm << 2),
                };
            if (bc0 === 0x01)
                return {
                    op: "bc0t",
                    args: (0, format_1.formatBranch)(pc + 4 + (signedImm << 2), signedImm << 2),
                };
            if (bc0 === 0x02)
                return {
                    op: "bc0fl",
                    args: (0, format_1.formatBranch)(pc + 4 + (signedImm << 2), signedImm << 2),
                };
            if (bc0 === 0x03)
                return {
                    op: "bc0tl",
                    args: (0, format_1.formatBranch)(pc + 4 + (signedImm << 2), signedImm << 2),
                };
        }
        if (cop0Func === 0x10) {
            if (funct === 0x01)
                return { op: "tlbr", args: "" };
            if (funct === 0x02)
                return { op: "tlbwi", args: "" };
            if (funct === 0x06)
                return { op: "tlbwr", args: "" };
            if (funct === 0x08)
                return { op: "tlbp", args: "" };
            if (funct === 0x18)
                return { op: "eret", args: "" };
            if (funct === 0x38)
                return { op: "ei", args: "" };
            if (funct === 0x39)
                return { op: "di", args: "" };
        }
    }
    // COP1 (FPU) opcode (0x11)
    if (opcode === 0x11) {
        const cop1Func = rs;
        if (cop1Func === 0x00)
            return { op: "mfc1", args: `${(0, mipsAnalyst_1.regName)(rt)}, ${freg(rd)}` };
        if (cop1Func === 0x02)
            return { op: "cfc1", args: `${(0, mipsAnalyst_1.regName)(rt)}, ${freg(rd)}` };
        if (cop1Func === 0x04)
            return { op: "mtc1", args: `${(0, mipsAnalyst_1.regName)(rt)}, ${freg(rd)}` };
        if (cop1Func === 0x06)
            return { op: "ctc1", args: `${(0, mipsAnalyst_1.regName)(rt)}, ${freg(rd)}` };
        if (cop1Func === 0x08) {
            const bc1 = rt;
            if (bc1 === 0x00)
                return {
                    op: "bc1f",
                    args: (0, format_1.formatBranch)(pc + 4 + (signedImm << 2), signedImm << 2),
                };
            if (bc1 === 0x01)
                return {
                    op: "bc1t",
                    args: (0, format_1.formatBranch)(pc + 4 + (signedImm << 2), signedImm << 2),
                };
            if (bc1 === 0x02)
                return {
                    op: "bc1fl",
                    args: (0, format_1.formatBranch)(pc + 4 + (signedImm << 2), signedImm << 2),
                };
            if (bc1 === 0x03)
                return {
                    op: "bc1tl",
                    args: (0, format_1.formatBranch)(pc + 4 + (signedImm << 2), signedImm << 2),
                };
        }
        if (cop1Func === 0x10) {
            // S format (single precision)
            switch (funct) {
                case 0x00:
                    return { op: "add.s", args: `${freg(sa)}, ${freg(rd)}, ${freg(rt)}` };
                case 0x01:
                    return { op: "sub.s", args: `${freg(sa)}, ${freg(rd)}, ${freg(rt)}` };
                case 0x02:
                    return { op: "mul.s", args: `${freg(sa)}, ${freg(rd)}, ${freg(rt)}` };
                case 0x03:
                    return { op: "div.s", args: `${freg(sa)}, ${freg(rd)}, ${freg(rt)}` };
                case 0x04:
                    return { op: "sqrt.s", args: `${freg(sa)}, ${freg(rt)}` };
                case 0x05:
                    return { op: "abs.s", args: `${freg(sa)}, ${freg(rd)}` };
                case 0x06:
                    return { op: "mov.s", args: `${freg(sa)}, ${freg(rd)}` };
                case 0x07:
                    return { op: "neg.s", args: `${freg(sa)}, ${freg(rd)}` };
                case 0x16:
                    return {
                        op: "rsqrt.s",
                        args: `${freg(sa)}, ${freg(rd)}, ${freg(rt)}`,
                    };
                case 0x18:
                    return { op: "adda.s", args: `${freg(rd)}, ${freg(rt)}` };
                case 0x19:
                    return { op: "suba.s", args: `${freg(rd)}, ${freg(rt)}` };
                case 0x1a:
                    return { op: "mula.s", args: `${freg(rd)}, ${freg(rt)}` };
                case 0x1c:
                    return {
                        op: "madd.s",
                        args: `${freg(sa)}, ${freg(rd)}, ${freg(rt)}`,
                    };
                case 0x1d:
                    return {
                        op: "msub.s",
                        args: `${freg(sa)}, ${freg(rd)}, ${freg(rt)}`,
                    };
                case 0x1e:
                    return { op: "madda.s", args: `${freg(rd)}, ${freg(rt)}` };
                case 0x1f:
                    return { op: "msuba.s", args: `${freg(rd)}, ${freg(rt)}` };
                case 0x24:
                    return { op: "cvt.w.s", args: `${freg(sa)}, ${freg(rd)}` };
                case 0x28:
                    return { op: "max.s", args: `${freg(sa)}, ${freg(rd)}, ${freg(rt)}` };
                case 0x29:
                    return { op: "min.s", args: `${freg(sa)}, ${freg(rd)}, ${freg(rt)}` };
                case 0x30:
                    return { op: "c.f.s", args: `${freg(rd)}, ${freg(rt)}` };
                case 0x32:
                    return { op: "c.eq.s", args: `${freg(rd)}, ${freg(rt)}` };
                case 0x34:
                    return { op: "c.lt.s", args: `${freg(rd)}, ${freg(rt)}` };
                case 0x36:
                    return { op: "c.le.s", args: `${freg(rd)}, ${freg(rt)}` };
            }
        }
        if (cop1Func === 0x14) {
            // W format (word fixed point)
            if (funct === 0x20)
                return { op: "cvt.s.w", args: `${freg(sa)}, ${freg(rd)}` };
        }
    }
    // COP2 (VU0) opcode (0x12) - PS2 Vector Unit
    if (opcode === 0x12) {
        const cop2Func = rs;
        if (cop2Func === 0x01)
            return { op: "qmfc2", args: `${(0, mipsAnalyst_1.regName)(rt)}, ${freg(rd)}` };
        if (cop2Func === 0x02)
            return { op: "cfc2", args: `${(0, mipsAnalyst_1.regName)(rt)}, ${freg(rd)}` };
        if (cop2Func === 0x05)
            return { op: "qmtc2", args: `${(0, mipsAnalyst_1.regName)(rt)}, ${freg(rd)}` };
        if (cop2Func === 0x06)
            return { op: "ctc2", args: `${(0, mipsAnalyst_1.regName)(rt)}, ${freg(rd)}` };
        if (cop2Func === 0x08) {
            const bc2 = rt;
            if (bc2 === 0x00)
                return {
                    op: "bc2f",
                    args: (0, format_1.formatBranch)(pc + 4 + (signedImm << 2), signedImm << 2),
                };
            if (bc2 === 0x01)
                return {
                    op: "bc2t",
                    args: (0, format_1.formatBranch)(pc + 4 + (signedImm << 2), signedImm << 2),
                };
            if (bc2 === 0x02)
                return {
                    op: "bc2fl",
                    args: (0, format_1.formatBranch)(pc + 4 + (signedImm << 2), signedImm << 2),
                };
            if (bc2 === 0x03)
                return {
                    op: "bc2tl",
                    args: (0, format_1.formatBranch)(pc + 4 + (signedImm << 2), signedImm << 2),
                };
        }
        // VU0 macro mode instructions (COP2 special functions)
        if ((cop2Func & 0x10) === 0x10) {
            const vuFunc = funct & 0x3f;
            const dest = (instr >> 21) & 0xf; // destination mask (xyzw)
            const ft = (instr >> 16) & 0x1f;
            const fs = (instr >> 11) & 0x1f;
            const fd = (instr >> 6) & 0x1f;
            const bc = (instr >> 0) & 0x3; // broadcast field
            const vreg = (r) => `vf${r}`;
            const vireg = (r) => `vi${r}`;
            const destStr = (d) => {
                if (d === 0xf)
                    return "";
                let s = "";
                if (d & 8)
                    s += "x";
                if (d & 4)
                    s += "y";
                if (d & 2)
                    s += "z";
                if (d & 1)
                    s += "w";
                return s ? `.${s}` : "";
            };
            const bcStr = (b) => ["x", "y", "z", "w"][b];
            // VU0 computational instructions
            switch (vuFunc) {
                case 0x00:
                    return {
                        op: "vadd",
                        args: `${vreg(fd)}${destStr(dest)}, ${vreg(fs)}, ${vreg(ft)}`,
                    };
                case 0x01:
                    return {
                        op: "vsub",
                        args: `${vreg(fd)}${destStr(dest)}, ${vreg(fs)}, ${vreg(ft)}`,
                    };
                case 0x02:
                    return {
                        op: "vmul",
                        args: `${vreg(fd)}${destStr(dest)}, ${vreg(fs)}, ${vreg(ft)}`,
                    };
                case 0x03:
                    return {
                        op: "vmax",
                        args: `${vreg(fd)}${destStr(dest)}, ${vreg(fs)}, ${vreg(ft)}`,
                    };
                case 0x04:
                    return {
                        op: "vmin",
                        args: `${vreg(fd)}${destStr(dest)}, ${vreg(fs)}, ${vreg(ft)}`,
                    };
                case 0x05:
                    return {
                        op: "vmul",
                        args: `${vreg(fd)}${destStr(dest)}, ${vreg(fs)}, ${vreg(ft)}.${bcStr(bc)}`,
                    };
                case 0x06:
                    return {
                        op: "vmulq",
                        args: `${vreg(fd)}${destStr(dest)}, ${vreg(fs)}, Q`,
                    };
                case 0x07:
                    return {
                        op: "vmaxi",
                        args: `${vreg(fd)}${destStr(dest)}, ${vreg(fs)}, I`,
                    };
                case 0x08:
                    return {
                        op: "vaddq",
                        args: `${vreg(fd)}${destStr(dest)}, ${vreg(fs)}, Q`,
                    };
                case 0x09:
                    return {
                        op: "vsubq",
                        args: `${vreg(fd)}${destStr(dest)}, ${vreg(fs)}, Q`,
                    };
                case 0x0a:
                    return {
                        op: "vaddi",
                        args: `${vreg(fd)}${destStr(dest)}, ${vreg(fs)}, I`,
                    };
                case 0x0b:
                    return {
                        op: "vsubi",
                        args: `${vreg(fd)}${destStr(dest)}, ${vreg(fs)}, I`,
                    };
                case 0x0c:
                    return {
                        op: "vmini",
                        args: `${vreg(fd)}${destStr(dest)}, ${vreg(fs)}, I`,
                    };
                case 0x0d:
                    return {
                        op: "vadd",
                        args: `${vreg(fd)}${destStr(dest)}, ${vreg(fs)}, ${vreg(ft)}.${bcStr(bc)}`,
                    };
                case 0x0e:
                    return {
                        op: "vsub",
                        args: `${vreg(fd)}${destStr(dest)}, ${vreg(fs)}, ${vreg(ft)}.${bcStr(bc)}`,
                    };
                case 0x0f:
                    return {
                        op: "vopmsub",
                        args: `${vreg(fd)}, ${vreg(fs)}, ${vreg(ft)}`,
                    };
                case 0x10:
                    return {
                        op: "vacc",
                        args: `${vreg(fd)}${destStr(dest)}, ${vreg(fs)}, ${vreg(ft)}`,
                    };
                case 0x11:
                    return {
                        op: "vmsub",
                        args: `${vreg(fd)}${destStr(dest)}, ${vreg(fs)}, ${vreg(ft)}`,
                    };
                case 0x12:
                    return {
                        op: "vmadd",
                        args: `${vreg(fd)}${destStr(dest)}, ${vreg(fs)}, ${vreg(ft)}`,
                    };
                case 0x13:
                    return {
                        op: "vmmax",
                        args: `${vreg(fd)}${destStr(dest)}, ${vreg(fs)}, ${vreg(ft)}`,
                    };
                case 0x14:
                    return {
                        op: "vmmin",
                        args: `${vreg(fd)}${destStr(dest)}, ${vreg(fs)}, ${vreg(ft)}`,
                    };
                case 0x15:
                    return {
                        op: "vmsub",
                        args: `${vreg(fd)}${destStr(dest)}, ${vreg(fs)}, ${vreg(ft)}.${bcStr(bc)}`,
                    };
                case 0x16:
                    return {
                        op: "vmsubq",
                        args: `${vreg(fd)}${destStr(dest)}, ${vreg(fs)}, Q`,
                    };
                case 0x17:
                    return {
                        op: "vmmini",
                        args: `${vreg(fd)}${destStr(dest)}, ${vreg(fs)}, I`,
                    };
                case 0x18:
                    return {
                        op: "vaddabc",
                        args: `ACC${destStr(dest)}, ${vreg(fs)}, ${vreg(ft)}.${bcStr(bc)}`,
                    };
                case 0x19:
                    return {
                        op: "vsubabc",
                        args: `ACC${destStr(dest)}, ${vreg(fs)}, ${vreg(ft)}.${bcStr(bc)}`,
                    };
                case 0x1a:
                    return {
                        op: "vmulabc",
                        args: `ACC${destStr(dest)}, ${vreg(fs)}, ${vreg(ft)}.${bcStr(bc)}`,
                    };
                case 0x1b:
                    return {
                        op: "vmadda",
                        args: `ACC${destStr(dest)}, ${vreg(fs)}, ${vreg(ft)}`,
                    };
                case 0x1c:
                    return {
                        op: "vmsuba",
                        args: `ACC${destStr(dest)}, ${vreg(fs)}, ${vreg(ft)}`,
                    };
                case 0x1d:
                    return {
                        op: "vmadd",
                        args: `${vreg(fd)}${destStr(dest)}, ${vreg(fs)}, ${vreg(ft)}.${bcStr(bc)}`,
                    };
                case 0x1e:
                    return {
                        op: "vmaddq",
                        args: `${vreg(fd)}${destStr(dest)}, ${vreg(fs)}, Q`,
                    };
                case 0x1f:
                    return {
                        op: "vmmaxi",
                        args: `${vreg(fd)}${destStr(dest)}, ${vreg(fs)}, I`,
                    };
                case 0x20:
                    return { op: "vaddai", args: `ACC${destStr(dest)}, ${vreg(fs)}, I` };
                case 0x21:
                    return { op: "vsubai", args: `ACC${destStr(dest)}, ${vreg(fs)}, I` };
                case 0x22:
                    return { op: "vmulai", args: `ACC${destStr(dest)}, ${vreg(fs)}, I` };
                case 0x23:
                    return { op: "vmaddai", args: `ACC${destStr(dest)}, ${vreg(fs)}, I` };
                case 0x24:
                    return { op: "vmsubai", args: `ACC${destStr(dest)}, ${vreg(fs)}, I` };
                case 0x25:
                    return {
                        op: "vadda",
                        args: `ACC${destStr(dest)}, ${vreg(fs)}, ${vreg(ft)}`,
                    };
                case 0x26:
                    return {
                        op: "vsuba",
                        args: `ACC${destStr(dest)}, ${vreg(fs)}, ${vreg(ft)}`,
                    };
                case 0x27:
                    return {
                        op: "vmula",
                        args: `ACC${destStr(dest)}, ${vreg(fs)}, ${vreg(ft)}`,
                    };
                case 0x28:
                    return { op: "vopmula", args: `ACC, ${vreg(fs)}, ${vreg(ft)}` };
                case 0x29:
                    return { op: "vnop", args: "" };
                case 0x2a:
                    return {
                        op: "vmove",
                        args: `${vreg(fd)}${destStr(dest)}, ${vreg(fs)}`,
                    };
                case 0x2b:
                    return {
                        op: "vmr32",
                        args: `${vreg(fd)}${destStr(dest)}, ${vreg(fs)}`,
                    };
                case 0x2c:
                    return {
                        op: "vlqi",
                        args: `${vreg(fd)}${destStr(dest)}, (${vireg(fs)}++)`,
                    };
                case 0x2d:
                    return {
                        op: "vsqi",
                        args: `${vreg(fs)}${destStr(dest)}, (${vireg(ft)}++)`,
                    };
                case 0x2e:
                    return {
                        op: "vlqd",
                        args: `${vreg(fd)}${destStr(dest)}, (--${vireg(fs)})`,
                    };
                case 0x2f:
                    return {
                        op: "vsqd",
                        args: `${vreg(fs)}${destStr(dest)}, (--${vireg(ft)})`,
                    };
                case 0x30:
                    return { op: "vdiv", args: `Q, ${vreg(fs)}, ${vreg(ft)}` };
                case 0x31:
                    return { op: "vsqrt", args: `Q, ${vreg(ft)}` };
                case 0x32:
                    return { op: "vrsqrt", args: `Q, ${vreg(fs)}, ${vreg(ft)}` };
                case 0x33:
                    return { op: "vwaitq", args: "" };
                case 0x34:
                    return { op: "vmtir", args: `${vireg(ft)}, ${vreg(fs)}` };
                case 0x35:
                    return {
                        op: "vmfir",
                        args: `${vreg(fd)}${destStr(dest)}, ${vireg(fs)}`,
                    };
                case 0x36:
                    return { op: "vilwr", args: `${vireg(ft)}, (${vireg(fs)})` };
                case 0x37:
                    return { op: "viswr", args: `${vireg(ft)}, (${vireg(fs)})` };
                case 0x38:
                    return { op: "vrnext", args: `${vreg(fd)}${destStr(dest)}, R` };
                case 0x39:
                    return { op: "vrget", args: `${vreg(fd)}${destStr(dest)}, R` };
                case 0x3a:
                    return { op: "vrinit", args: `R, ${vreg(fs)}` };
                case 0x3b:
                    return { op: "vrxor", args: `R, ${vreg(fs)}` };
                case 0x3c:
                    return { op: "vclip", args: `${vreg(fs)}, ${vreg(ft)}` };
                case 0x3d:
                    return { op: "vmaddaq", args: `ACC${destStr(dest)}, ${vreg(fs)}, Q` };
                case 0x3e:
                    return { op: "vmsubaq", args: `ACC${destStr(dest)}, ${vreg(fs)}, Q` };
                case 0x3f:
                    return { op: "vmulaq", args: `ACC${destStr(dest)}, ${vreg(fs)}, Q` };
            }
            // VU0 special instructions (lower instructions with different encoding)
            const vuLower = (instr >> 25) & 0x7f;
            if (vuLower === 0x30 ||
                vuLower === 0x31 ||
                vuLower === 0x32 ||
                vuLower === 0x33) {
                const it = (instr >> 16) & 0x1f;
                const is = (instr >> 11) & 0x1f;
                const id = (instr >> 6) & 0x1f;
                const vireg = (r) => `vi${r}`;
                switch (funct) {
                    case 0x30:
                        return {
                            op: "viadd",
                            args: `${vireg(id)}, ${vireg(is)}, ${vireg(it)}`,
                        };
                    case 0x31:
                        return {
                            op: "visub",
                            args: `${vireg(id)}, ${vireg(is)}, ${vireg(it)}`,
                        };
                    case 0x32:
                        return {
                            op: "viaddi",
                            args: `${vireg(it)}, ${vireg(is)}, ${(instr & 0x1f) - (instr & 0x10 ? 32 : 0)}`,
                        };
                    case 0x33:
                        return {
                            op: "viand",
                            args: `${vireg(id)}, ${vireg(is)}, ${vireg(it)}`,
                        };
                    case 0x34:
                        return {
                            op: "vior",
                            args: `${vireg(id)}, ${vireg(is)}, ${vireg(it)}`,
                        };
                }
            }
        }
    }
    // VU1 instructions via VCALLMS/VCALLMSR (executed through COP2 interface)
    // VU1 uses same instruction encoding as VU0 but executes on VU1 unit
    // These are typically triggered via special COP2 instructions or DMA
    // If we reach here, instruction is unknown
    return { op: "unknown", args: "", label: "", comment: "" };
}
//# sourceMappingURL=mipsDisasm.js.map