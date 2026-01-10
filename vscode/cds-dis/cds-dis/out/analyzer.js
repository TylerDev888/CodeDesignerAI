"use strict";
/**
 * MIPS Disassembler and Analyzer
 * Provides comprehensive analysis including function detection, cross-references, and register tracking
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNonce = getNonce;
exports.formatBytes = formatBytes;
exports.disassemble = disassemble;
/**
 * Analysis context for tracking state across instructions
 */
class AnalysisContext {
    functions = new Map();
    xrefs = new Map(); // target -> [sources]
    labels = new Map();
    registers = Array(32).fill(null).map(() => ({}));
    /**
     * Add a cross-reference from source to target
     */
    addXref(source, target) {
        if (!this.xrefs.has(target)) {
            this.xrefs.set(target, []);
        }
        this.xrefs.get(target).push(source);
    }
    /**
     * Register a function at the given address
     */
    registerFunction(addr, name) {
        if (!this.functions.has(addr)) {
            this.functions.set(addr, {
                startAddr: addr,
                name: name || `func_${addr.toString(16).padStart(8, '0')}`,
                calls: [],
                calledFrom: []
            });
        }
    }
    /**
     * Add a function call relationship
     */
    addFunctionCall(from, to) {
        const fromFunc = this.findFunction(from);
        const toFunc = this.findFunction(to);
        if (fromFunc && toFunc) {
            if (!fromFunc.calls.includes(to)) {
                fromFunc.calls.push(to);
            }
            if (!toFunc.calledFrom.includes(from)) {
                toFunc.calledFrom.push(from);
            }
        }
    }
    /**
     * Find which function contains the given address
     */
    findFunction(addr) {
        for (const func of this.functions.values()) {
            if (addr >= func.startAddr && (!func.endAddr || addr < func.endAddr)) {
                return func;
            }
        }
        return undefined;
    }
}
/**
 * Generate a nonce for webview security
 */
function getNonce() {
    let text = "";
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
        text += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return text;
}
/**
 * Format a buffer as hex bytes (little-endian display)
 */
function formatBytes(bytes) {
    return [...bytes]
        .reverse()
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(" ");
}
/**
 * Main disassembly function with comprehensive analysis
 * @param startAddr - Virtual address where disassembly begins
 * @param buffer - Binary data to disassemble
 * @returns Array of disassembled instructions with analysis
 */
function disassemble(startAddr, buffer) {
    const rows = [];
    const context = new AnalysisContext();
    // First pass: Disassemble and identify functions/branches
    for (let offset = 0; offset < buffer.length; offset += 4) {
        const slice = buffer.slice(offset, offset + 4);
        if (slice.length < 4)
            break;
        const currentAddr = startAddr + offset;
        const instr = slice.readUInt32LE(0);
        // Detect function entry points (common patterns)
        if (offset === 0 || isFunctionEntry(instr, buffer, offset)) {
            context.registerFunction(currentAddr);
        }
        // Analyze instruction for branches/calls
        analyzeInstruction(instr, currentAddr, context);
    }
    // Second pass: Generate disassembly with analysis
    for (let offset = 0; offset < buffer.length; offset += 4) {
        const slice = buffer.slice(offset, offset + 4);
        if (slice.length < 4)
            break;
        const bytesLE = Array.from(slice)
            .reverse()
            .map(b => b.toString(16).padStart(2, '0').toUpperCase())
            .join(' ');
        const instr = slice.readUInt32LE(0);
        const currentAddr = startAddr + offset;
        const decoded = decodeMIPS(instr, currentAddr, context);
        if (decoded) {
            // Add cross-references
            const xrefs = context.xrefs.get(currentAddr);
            const xrefComment = xrefs ? `; XREF: ${xrefs.map(x => `$${x.toString(16).padStart(8, '0')}`).join(', ')}` : '';
            rows.push({
                addr: currentAddr.toString(16).toUpperCase().padStart(8, "0"),
                bytes: bytesLE,
                label: context.labels.get(currentAddr) || decoded.label || "",
                op: decoded.op,
                args: decoded.args,
                comment: [decoded.comment, xrefComment].filter(Boolean).join(' '),
                xrefs: xrefs?.map(x => x.toString(16).padStart(8, '0'))
            });
        }
    }
    console.log('Disassembled', rows.length, 'instructions');
    console.log('Detected', context.functions.size, 'functions');
    return rows;
}
/**
 * Detect if instruction is likely a function entry point
 */
function isFunctionEntry(instr, buffer, offset) {
    const opcode = (instr >> 26) & 0x3f;
    const rt = (instr >> 16) & 0x1f;
    const rs = (instr >> 21) & 0x1f;
    const imm = instr & 0xffff;
    const signedImm = imm & 0x8000 ? imm | 0xffff0000 : imm;
    // Common function prologue: addiu sp, sp, -X (stack allocation)
    if (opcode === 0x09 && rt === 29 && rs === 29 && signedImm < 0) {
        return true;
    }
    // Check if previous instruction was a JAL (function was called)
    if (offset >= 4) {
        const prevInstr = buffer.readUInt32LE(offset - 4);
        const prevOpcode = (prevInstr >> 26) & 0x3f;
        if (prevOpcode === 0x03) { // JAL
            return true;
        }
    }
    return false;
}
/**
 * Analyze instruction for branches, calls, and data flow
 */
function analyzeInstruction(instr, pc, context) {
    const opcode = (instr >> 26) & 0x3f;
    const rs = (instr >> 21) & 0x1f;
    const rt = (instr >> 16) & 0x1f;
    const imm = instr & 0xffff;
    const signedImm = imm & 0x8000 ? imm | 0xffff0000 : imm;
    const target = instr & 0x3ffffff;
    const funct = instr & 0x3f;
    // JAL - Function call
    if (opcode === 0x03) {
        const targetAddr = (pc & 0xf0000000) | (target << 2);
        context.addXref(pc, targetAddr);
        context.registerFunction(targetAddr);
        context.addFunctionCall(pc, targetAddr);
    }
    // JALR - Indirect function call
    if (opcode === 0x00 && funct === 0x09) {
        // Register-based call, harder to analyze statically
    }
    // Branch instructions - add cross-references
    if (opcode >= 0x04 && opcode <= 0x07 || opcode >= 0x14 && opcode <= 0x17) {
        const targetAddr = pc + 4 + (signedImm << 2);
        context.addXref(pc, targetAddr);
    }
    // REGIMM branches
    if (opcode === 0x01) {
        const targetAddr = pc + 4 + (signedImm << 2);
        context.addXref(pc, targetAddr);
    }
    // Track register values for pointer analysis
    // LUI - Load upper immediate (often used for address loading)
    if (opcode === 0x0f) {
        context.registers[rt].value = imm << 16;
        context.registers[rt].source = `lui $${imm.toString(16)}`;
    }
    // ORI/ADDIU - Complete address loading
    if ((opcode === 0x0d || opcode === 0x09) && context.registers[rs].value !== undefined) {
        context.registers[rt].value = (context.registers[rs].value + signedImm) >>> 0;
        context.registers[rt].isPointer = true;
    }
}
/**
 * Decode a single MIPS instruction
 * @param instr - 32-bit instruction word
 * @param pc - Program counter (current address)
 * @param context - Analysis context for labels and cross-references
 * @returns Decoded instruction or null
 */
function decodeMIPS(instr, pc, context) {
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
    // Register name lookup
    const reg = (r) => {
        const names = [
            "zero", "at", "v0", "v1", "a0", "a1", "a2", "a3",
            "t0", "t1", "t2", "t3", "t4", "t5", "t6", "t7",
            "s0", "s1", "s2", "s3", "s4", "s5", "s6", "s7",
            "t8", "t9", "k0", "k1", "gp", "sp", "fp", "ra",
        ];
        return names[r];
    };
    const freg = (r) => `f${r}`;
    // Format signed immediate with 4-digit hex padding
    const formatImm = (val) => {
        const hex = (val & 0xffff).toString(16).toUpperCase().padStart(4, '0');
        return `$${hex}`;
    };
    // Format branch with target address and instruction count
    const formatBranch = (targetAddr, offset) => {
        const addrHex = (targetAddr >>> 0).toString(16).toUpperCase().padStart(8, '0');
        const instrCount = offset / 4;
        const sign = instrCount >= 0 ? '+' : '';
        const arrow = instrCount >= 0 ? '▼' : '▲';
        // Add label if function exists at target
        const func = context.functions.get(targetAddr);
        const label = func ? ` ; ${func.name}` : '';
        return `$${addrHex} (${sign}${instrCount}${arrow})${label}`;
    };
    // Format jump target address
    const formatAddr = (addr) => {
        const hex = (addr >>> 0).toString(16).toUpperCase().padStart(8, '0');
        const func = context.functions.get(addr);
        const label = func ? ` ; ${func.name}` : '';
        return `$${hex}${label}`;
    };
    // Generate analysis comments
    let comment = "";
    if (instr === 0) {
        return { op: "nop", args: "", comment: "; no operation" };
    }
    // SPECIAL opcode (0x00)
    if (opcode === 0x00) {
        switch (funct) {
            case 0x00:
                return sa === 0 ? { op: "nop", args: "", comment } : { op: "sll", args: `${reg(rd)}, ${reg(rt)}, ${sa}`, comment };
            case 0x02:
                return { op: "srl", args: `${reg(rd)}, ${reg(rt)}, ${sa}`, comment };
            case 0x03:
                return { op: "sra", args: `${reg(rd)}, ${reg(rt)}, ${sa}`, comment };
            case 0x04:
                return { op: "sllv", args: `${reg(rd)}, ${reg(rt)}, ${reg(rs)}`, comment };
            case 0x06:
                return { op: "srlv", args: `${reg(rd)}, ${reg(rt)}, ${reg(rs)}`, comment };
            case 0x07:
                return { op: "srav", args: `${reg(rd)}, ${reg(rt)}, ${reg(rs)}`, comment };
            case 0x08:
                comment = rd === 31 ? "; return from function" : "";
                return { op: "jr", args: reg(rs), comment };
            case 0x09:
                comment = "; call via register";
                return rd === 31 ? { op: "jalr", args: reg(rs), comment } : { op: "jalr", args: `${reg(rd)}, ${reg(rs)}`, comment };
            case 0x0a:
                return { op: "movz", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
            case 0x0b:
                return { op: "movn", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
            case 0x0c:
                return { op: "syscall", args: code > 0 ? `${code}` : "", comment: "; system call" };
            case 0x0d:
                return { op: "break", args: code > 0 ? `${code}` : "", comment: "; breakpoint" };
            case 0x0f:
                return { op: "sync", args: sa > 0 ? `${sa}` : "", comment };
            case 0x10:
                return { op: "mfhi", args: reg(rd), comment: "; move from HI" };
            case 0x11:
                return { op: "mthi", args: reg(rs), comment: "; move to HI" };
            case 0x12:
                return { op: "mflo", args: reg(rd), comment: "; move from LO" };
            case 0x13:
                return { op: "mtlo", args: reg(rs), comment: "; move to LO" };
            case 0x14:
                return { op: "dsllv", args: `${reg(rd)}, ${reg(rt)}, ${reg(rs)}`, comment };
            case 0x16:
                return { op: "dsrlv", args: `${reg(rd)}, ${reg(rt)}, ${reg(rs)}`, comment };
            case 0x17:
                return { op: "dsrav", args: `${reg(rd)}, ${reg(rt)}, ${reg(rs)}`, comment };
            case 0x18:
                return rd === 0 ? { op: "mult", args: `${reg(rs)}, ${reg(rt)}`, comment } : { op: "mult", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
            case 0x19:
                return rd === 0 ? { op: "multu", args: `${reg(rs)}, ${reg(rt)}`, comment } : { op: "multu", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
            case 0x1a:
                return { op: "div", args: `${reg(rs)}, ${reg(rt)}`, comment };
            case 0x1b:
                return { op: "divu", args: `${reg(rs)}, ${reg(rt)}`, comment };
            case 0x1c:
                return { op: "dmult", args: rd === 0 ? `${reg(rs)}, ${reg(rt)}` : `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
            case 0x1d:
                return { op: "dmultu", args: rd === 0 ? `${reg(rs)}, ${reg(rt)}` : `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
            case 0x1e:
                return { op: "ddiv", args: `${reg(rs)}, ${reg(rt)}`, comment };
            case 0x1f:
                return { op: "ddivu", args: `${reg(rs)}, ${reg(rt)}`, comment };
            case 0x20:
                return { op: "add", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
            case 0x21:
                return { op: "addu", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
            case 0x22:
                return { op: "sub", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
            case 0x23:
                return { op: "subu", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
            case 0x24:
                return { op: "and", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
            case 0x25:
                return { op: "or", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
            case 0x26:
                return { op: "xor", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
            case 0x27:
                return { op: "nor", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
            case 0x28:
                return { op: "mfsa", args: reg(rd), comment };
            case 0x29:
                return { op: "mtsa", args: reg(rs), comment };
            case 0x2a:
                return { op: "slt", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment: "; set if less than" };
            case 0x2b:
                return { op: "sltu", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment: "; set if less than unsigned" };
            case 0x2c:
                return { op: "dadd", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
            case 0x2d:
                return { op: "daddu", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
            case 0x2e:
                return { op: "dsub", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
            case 0x2f:
                return { op: "dsubu", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
            case 0x30:
                return { op: "tge", args: `${reg(rs)}, ${reg(rt)}`, comment };
            case 0x31:
                return { op: "tgeu", args: `${reg(rs)}, ${reg(rt)}`, comment };
            case 0x32:
                return { op: "tlt", args: `${reg(rs)}, ${reg(rt)}`, comment };
            case 0x33:
                return { op: "tltu", args: `${reg(rs)}, ${reg(rt)}`, comment };
            case 0x34:
                return { op: "teq", args: `${reg(rs)}, ${reg(rt)}`, comment };
            case 0x36:
                return { op: "tne", args: `${reg(rs)}, ${reg(rt)}`, comment };
            case 0x38:
                return { op: "dsll", args: `${reg(rd)}, ${reg(rt)}, ${sa}`, comment };
            case 0x3a:
                return { op: "dsrl", args: `${reg(rd)}, ${reg(rt)}, ${sa}`, comment };
            case 0x3b:
                return { op: "dsra", args: `${reg(rd)}, ${reg(rt)}, ${sa}`, comment };
            case 0x3c:
                return { op: "dsll32", args: `${reg(rd)}, ${reg(rt)}, ${sa}`, comment };
            case 0x3e:
                return { op: "dsrl32", args: `${reg(rd)}, ${reg(rt)}, ${sa}`, comment };
            case 0x3f:
                return { op: "dsra32", args: `${reg(rd)}, ${reg(rt)}, ${sa}`, comment };
        }
    }
    // REGIMM opcode (0x01) - Branch instructions
    if (opcode === 0x01) {
        switch (rt) {
            case 0x00:
                return { op: "bltz", args: `${reg(rs)}, ${formatBranch(pc + 4 + (signedImm << 2), signedImm << 2)}`, comment };
            case 0x01:
                return { op: "bgez", args: `${reg(rs)}, ${formatBranch(pc + 4 + (signedImm << 2), signedImm << 2)}`, comment };
            case 0x02:
                return { op: "bltzl", args: `${reg(rs)}, ${formatBranch(pc + 4 + (signedImm << 2), signedImm << 2)}`, comment };
            case 0x03:
                return { op: "bgezl", args: `${reg(rs)}, ${formatBranch(pc + 4 + (signedImm << 2), signedImm << 2)}`, comment };
            case 0x08:
                return { op: "tgei", args: `${reg(rs)}, ${formatImm(signedImm)}`, comment };
            case 0x09:
                return { op: "tgeiu", args: `${reg(rs)}, ${formatImm(signedImm)}`, comment };
            case 0x0a:
                return { op: "tlti", args: `${reg(rs)}, ${formatImm(signedImm)}`, comment };
            case 0x0b:
                return { op: "tltiu", args: `${reg(rs)}, ${formatImm(signedImm)}`, comment };
            case 0x0c:
                return { op: "teqi", args: `${reg(rs)}, ${formatImm(signedImm)}`, comment };
            case 0x0e:
                return { op: "tnei", args: `${reg(rs)}, ${formatImm(signedImm)}`, comment };
            case 0x10:
                return { op: "bltzal", args: `${reg(rs)}, ${formatBranch(pc + 4 + (signedImm << 2), signedImm << 2)}`, comment: "; branch and link" };
            case 0x11:
                return { op: "bgezal", args: `${reg(rs)}, ${formatBranch(pc + 4 + (signedImm << 2), signedImm << 2)}`, comment: "; branch and link" };
            case 0x12:
                return { op: "bltzall", args: `${reg(rs)}, ${formatBranch(pc + 4 + (signedImm << 2), signedImm << 2)}`, comment };
            case 0x13:
                return { op: "bgezall", args: `${reg(rs)}, ${formatBranch(pc + 4 + (signedImm << 2), signedImm << 2)}`, comment };
            case 0x18:
                return { op: "mtsab", args: `${reg(rs)}, ${formatImm(imm)}`, comment };
            case 0x19:
                return { op: "mtsah", args: `${reg(rs)}, ${formatImm(imm)}`, comment };
        }
    }
    // J and JAL (0x02, 0x03) - Jump instructions
    if (opcode === 0x02) {
        return { op: "j", args: formatAddr((pc & 0xf0000000) | (target << 2)), comment };
    }
    if (opcode === 0x03) {
        comment = "; call function";
        return { op: "jal", args: formatAddr((pc & 0xf0000000) | (target << 2)), comment };
    }
    // Branch instructions (0x04-0x07, 0x14-0x17)
    if (opcode === 0x04)
        return { op: "beq", args: `${reg(rs)}, ${reg(rt)}, ${formatBranch(pc + 4 + (signedImm << 2), signedImm << 2)}`, comment };
    if (opcode === 0x05)
        return { op: "bne", args: `${reg(rs)}, ${reg(rt)}, ${formatBranch(pc + 4 + (signedImm << 2), signedImm << 2)}`, comment };
    if (opcode === 0x06)
        return { op: "blez", args: `${reg(rs)}, ${formatBranch(pc + 4 + (signedImm << 2), signedImm << 2)}`, comment };
    if (opcode === 0x07)
        return { op: "bgtz", args: `${reg(rs)}, ${formatBranch(pc + 4 + (signedImm << 2), signedImm << 2)}`, comment };
    if (opcode === 0x14)
        return { op: "beql", args: `${reg(rs)}, ${reg(rt)}, ${formatBranch(pc + 4 + (signedImm << 2), signedImm << 2)}`, comment };
    if (opcode === 0x15)
        return { op: "bnel", args: `${reg(rs)}, ${reg(rt)}, ${formatBranch(pc + 4 + (signedImm << 2), signedImm << 2)}`, comment };
    if (opcode === 0x16)
        return { op: "blezl", args: `${reg(rs)}, ${formatBranch(pc + 4 + (signedImm << 2), signedImm << 2)}`, comment };
    if (opcode === 0x17)
        return { op: "bgtzl", args: `${reg(rs)}, ${formatBranch(pc + 4 + (signedImm << 2), signedImm << 2)}`, comment };
    // Immediate arithmetic/logical (0x08-0x0f, 0x18-0x19)
    if (opcode === 0x08) {
        comment = rs === 29 && signedImm < 0 ? "; allocate stack frame" : "";
        return { op: "addi", args: `${reg(rt)}, ${reg(rs)}, ${formatImm(signedImm)}`, comment };
    }
    if (opcode === 0x09) {
        comment = rs === 29 && signedImm < 0 ? "; allocate stack frame" : rs === 29 && signedImm > 0 ? "; deallocate stack frame" : "";
        return { op: "addiu", args: `${reg(rt)}, ${reg(rs)}, ${formatImm(signedImm)}`, comment };
    }
    if (opcode === 0x0a)
        return { op: "slti", args: `${reg(rt)}, ${reg(rs)}, ${formatImm(signedImm)}`, comment };
    if (opcode === 0x0b)
        return { op: "sltiu", args: `${reg(rt)}, ${reg(rs)}, ${formatImm(imm)}`, comment };
    if (opcode === 0x0c)
        return { op: "andi", args: `${reg(rt)}, ${reg(rs)}, ${formatImm(imm)}`, comment };
    if (opcode === 0x0d)
        return { op: "ori", args: `${reg(rt)}, ${reg(rs)}, ${formatImm(imm)}`, comment };
    if (opcode === 0x0e)
        return { op: "xori", args: `${reg(rt)}, ${reg(rs)}, ${formatImm(imm)}`, comment };
    if (opcode === 0x0f) {
        comment = "; load upper immediate";
        return { op: "lui", args: `${reg(rt)}, ${formatImm(imm)}`, comment };
    }
    if (opcode === 0x18)
        return { op: "daddi", args: `${reg(rt)}, ${reg(rs)}, ${formatImm(signedImm)}`, comment };
    if (opcode === 0x19)
        return { op: "daddiu", args: `${reg(rt)}, ${reg(rs)}, ${formatImm(signedImm)}`, comment };
    // Load instructions (0x1a-0x1b, 0x20-0x27, 0x37)
    if (opcode === 0x1a)
        return { op: "ldl", args: `${reg(rt)}, ${formatImm(signedImm)}(${reg(rs)})`, comment };
    if (opcode === 0x1b)
        return { op: "ldr", args: `${reg(rt)}, ${formatImm(signedImm)}(${reg(rs)})`, comment };
    if (opcode === 0x20)
        return { op: "lb", args: `${reg(rt)}, ${formatImm(signedImm)}(${reg(rs)})`, comment: "; load byte" };
    if (opcode === 0x21)
        return { op: "lh", args: `${reg(rt)}, ${formatImm(signedImm)}(${reg(rs)})`, comment: "; load halfword" };
    if (opcode === 0x22)
        return { op: "lwl", args: `${reg(rt)}, ${formatImm(signedImm)}(${reg(rs)})`, comment };
    if (opcode === 0x23)
        return { op: "lw", args: `${reg(rt)}, ${formatImm(signedImm)}(${reg(rs)})`, comment: "; load word" };
    if (opcode === 0x24)
        return { op: "lbu", args: `${reg(rt)}, ${formatImm(signedImm)}(${reg(rs)})`, comment: "; load byte unsigned" };
    if (opcode === 0x25)
        return { op: "lhu", args: `${reg(rt)}, ${formatImm(signedImm)}(${reg(rs)})`, comment: "; load halfword unsigned" };
    if (opcode === 0x26)
        return { op: "lwr", args: `${reg(rt)}, ${formatImm(signedImm)}(${reg(rs)})`, comment };
    if (opcode === 0x27)
        return { op: "lwu", args: `${reg(rt)}, ${formatImm(signedImm)}(${reg(rs)})`, comment };
    if (opcode === 0x37)
        return { op: "ld", args: `${reg(rt)}, ${formatImm(signedImm)}(${reg(rs)})`, comment: "; load doubleword" };
    // Store instructions (0x28-0x2f, 0x3f)
    if (opcode === 0x28)
        return { op: "sb", args: `${reg(rt)}, ${formatImm(signedImm)}(${reg(rs)})`, comment: "; store byte" };
    if (opcode === 0x29)
        return { op: "sh", args: `${reg(rt)}, ${formatImm(signedImm)}(${reg(rs)})`, comment: "; store halfword" };
    if (opcode === 0x2a)
        return { op: "swl", args: `${reg(rt)}, ${formatImm(signedImm)}(${reg(rs)})`, comment };
    if (opcode === 0x2b)
        return { op: "sw", args: `${reg(rt)}, ${formatImm(signedImm)}(${reg(rs)})`, comment: "; store word" };
    if (opcode === 0x2c)
        return { op: "sdl", args: `${reg(rt)}, ${formatImm(signedImm)}(${reg(rs)})`, comment };
    if (opcode === 0x2d)
        return { op: "sdr", args: `${reg(rt)}, ${formatImm(signedImm)}(${reg(rs)})`, comment };
    if (opcode === 0x2e)
        return { op: "swr", args: `${reg(rt)}, ${formatImm(signedImm)}(${reg(rs)})`, comment };
    if (opcode === 0x2f)
        return { op: "cache", args: `${rt}, ${formatImm(signedImm)}(${reg(rs)})`, comment };
    if (opcode === 0x33)
        return { op: "pref", args: `${rt}, ${formatImm(signedImm)}(${reg(rs)})`, comment };
    if (opcode === 0x3f)
        return { op: "sd", args: `${reg(rt)}, ${formatImm(signedImm)}(${reg(rs)})`, comment: "; store doubleword" };
    // Quadword loads/stores (PS2 specific - 128-bit)
    if (opcode === 0x1e)
        return { op: "lq", args: `${reg(rt)}, ${formatImm(signedImm)}(${reg(rs)})`, comment: "; load quadword" };
    if (opcode === 0x1f)
        return { op: "sq", args: `${reg(rt)}, ${formatImm(signedImm)}(${reg(rs)})`, comment: "; store quadword" };
    // Floating point loads/stores
    if (opcode === 0x31)
        return { op: "lwc1", args: `${freg(rt)}, ${formatImm(signedImm)}(${reg(rs)})`, comment };
    if (opcode === 0x35)
        return { op: "ldc1", args: `${freg(rt)}, ${formatImm(signedImm)}(${reg(rs)})`, comment };
    if (opcode === 0x36)
        return { op: "lqc2", args: `${freg(rt)}, ${formatImm(signedImm)}(${reg(rs)})`, comment };
    if (opcode === 0x39)
        return { op: "swc1", args: `${freg(rt)}, ${formatImm(signedImm)}(${reg(rs)})`, comment };
    if (opcode === 0x3d)
        return { op: "sdc1", args: `${freg(rt)}, ${formatImm(signedImm)}(${reg(rs)})`, comment };
    if (opcode === 0x3e)
        return { op: "sqc2", args: `${freg(rt)}, ${formatImm(signedImm)}(${reg(rs)})`, comment };
    // MMI opcode (0x1C) - PS2 specific multimedia instructions
    if (opcode === 0x1c) {
        const mmiFunc = funct & 0x3f;
        const mmiFmt = (instr >> 6) & 0x1f;
        switch (mmiFunc) {
            case 0x00:
                return { op: "madd", args: rd === 0 ? `${reg(rs)}, ${reg(rt)}` : `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
            case 0x01:
                return { op: "maddu", args: rd === 0 ? `${reg(rs)}, ${reg(rt)}` : `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
            case 0x04:
                return { op: "plzcw", args: `${reg(rd)}, ${reg(rs)}`, comment };
            case 0x08:
                switch (mmiFmt) {
                    case 0x00: return { op: "paddw", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
                    case 0x01: return { op: "psubw", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
                    case 0x02: return { op: "pcgtw", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
                    case 0x03: return { op: "pmaxw", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
                    case 0x04: return { op: "paddh", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
                    case 0x05: return { op: "psubh", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
                    case 0x06: return { op: "pcgth", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
                    case 0x07: return { op: "pmaxh", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
                    case 0x08: return { op: "paddb", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
                    case 0x09: return { op: "psubb", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
                    case 0x0a: return { op: "pcgtb", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
                    case 0x10: return { op: "paddsw", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
                    case 0x11: return { op: "psubsw", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
                    case 0x12: return { op: "pextlw", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
                    case 0x13: return { op: "ppacw", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
                    case 0x14: return { op: "paddsh", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
                    case 0x15: return { op: "psubsh", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
                    case 0x16: return { op: "pextlh", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
                    case 0x17: return { op: "ppach", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
                    case 0x18: return { op: "paddsb", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
                    case 0x19: return { op: "psubsb", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
                    case 0x1a: return { op: "pextlb", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
                    case 0x1b: return { op: "ppacb", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
                    case 0x1e: return { op: "pext5", args: `${reg(rd)}, ${reg(rt)}`, comment };
                    case 0x1f: return { op: "ppac5", args: `${reg(rd)}, ${reg(rt)}`, comment };
                }
                break;
            case 0x09:
                switch (mmiFmt) {
                    case 0x00: return { op: "pmaddw", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
                    case 0x01: return { op: "pmsubw", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
                    case 0x02: return { op: "psllvw", args: `${reg(rd)}, ${reg(rt)}, ${reg(rs)}`, comment };
                    case 0x03: return { op: "psrlvw", args: `${reg(rd)}, ${reg(rt)}, ${reg(rs)}`, comment };
                    case 0x04: return { op: "pmfhi", args: reg(rd), comment };
                    case 0x05: return { op: "pmflo", args: reg(rd), comment };
                    case 0x06: return { op: "pinth", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
                    case 0x08: return { op: "pmultw", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
                    case 0x09: return { op: "pdivw", args: `${reg(rs)}, ${reg(rt)}`, comment };
                    case 0x0a: return { op: "pcpyld", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
                    case 0x0c: return { op: "pmaddh", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
                    case 0x0d: return { op: "phmadh", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
                    case 0x0e: return { op: "pand", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
                    case 0x0f: return { op: "pxor", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
                    case 0x10: return { op: "pmsubh", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
                    case 0x11: return { op: "phmsbh", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
                    case 0x12: return { op: "pexeh", args: `${reg(rd)}, ${reg(rt)}`, comment };
                    case 0x13: return { op: "prevh", args: `${reg(rd)}, ${reg(rt)}`, comment };
                    case 0x14: return { op: "pmulth", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
                    case 0x15: return { op: "pdivbw", args: `${reg(rs)}, ${reg(rt)}`, comment };
                    case 0x16: return { op: "pexew", args: `${reg(rd)}, ${reg(rt)}`, comment };
                    case 0x17: return { op: "prot3w", args: `${reg(rd)}, ${reg(rt)}`, comment };
                }
                break;
            case 0x10: return { op: "mfhi1", args: reg(rd), comment };
            case 0x11: return { op: "mthi1", args: reg(rs), comment };
            case 0x12: return { op: "mflo1", args: reg(rd), comment };
            case 0x13: return { op: "mtlo1", args: reg(rs), comment };
            case 0x18:
                return { op: "mult1", args: rd === 0 ? `${reg(rs)}, ${reg(rt)}` : `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
            case 0x19:
                return { op: "multu1", args: rd === 0 ? `${reg(rs)}, ${reg(rt)}` : `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
            case 0x1a: return { op: "div1", args: `${reg(rs)}, ${reg(rt)}`, comment };
            case 0x1b: return { op: "divu1", args: `${reg(rs)}, ${reg(rt)}`, comment };
            case 0x20:
                return { op: "madd1", args: rd === 0 ? `${reg(rs)}, ${reg(rt)}` : `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
            case 0x21:
                return { op: "maddu1", args: rd === 0 ? `${reg(rs)}, ${reg(rt)}` : `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
            case 0x28:
                switch (mmiFmt) {
                    case 0x00: return { op: "pmadduw", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
                    case 0x02: return { op: "psravw", args: `${reg(rd)}, ${reg(rt)}, ${reg(rs)}`, comment };
                    case 0x03: return { op: "pmthi", args: reg(rs), comment };
                    case 0x04: return { op: "pmtlo", args: reg(rs), comment };
                    case 0x05: return { op: "pinteh", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
                    case 0x08: return { op: "pmultuw", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
                    case 0x09: return { op: "pdivuw", args: `${reg(rs)}, ${reg(rt)}`, comment };
                    case 0x0a: return { op: "pcpyud", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
                    case 0x0e: return { op: "por", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
                    case 0x0f: return { op: "pnor", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
                    case 0x12: return { op: "pexch", args: `${reg(rd)}, ${reg(rt)}`, comment };
                    case 0x13: return { op: "pcpyh", args: `${reg(rd)}, ${reg(rt)}`, comment };
                    case 0x16: return { op: "pexcw", args: `${reg(rd)}, ${reg(rt)}`, comment };
                }
                break;
            case 0x29:
                switch (mmiFmt) {
                    case 0x00: return { op: "psubuw", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
                    case 0x01: return { op: "pextuw", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
                    case 0x02: return { op: "pceqw", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
                    case 0x03: return { op: "pminw", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
                    case 0x04: return { op: "padsbh", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
                    case 0x05: return { op: "psubuh", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
                    case 0x06: return { op: "pceqh", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
                    case 0x07: return { op: "pminh", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
                    case 0x0a: return { op: "pceqb", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
                    case 0x10: return { op: "padduw", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
                    case 0x11: return { op: "pextuw", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
                    case 0x14: return { op: "padduh", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
                    case 0x15: return { op: "psubuh", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
                    case 0x16: return { op: "pextuh", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
                    case 0x18: return { op: "paddub", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
                    case 0x19: return { op: "psubub", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
                    case 0x1a: return { op: "pextub", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
                    case 0x1b: return { op: "qfsrv", args: `${reg(rd)}, ${reg(rs)}, ${reg(rt)}`, comment };
                    case 0x1d: return { op: "pabsw", args: `${reg(rd)}, ${reg(rt)}`, comment };
                    case 0x1e: return { op: "pabsh", args: `${reg(rd)}, ${reg(rt)}`, comment };
                }
                break;
            case 0x30:
                const fmt = mmiFmt & 0x1f;
                switch (fmt) {
                    case 0x00: return { op: "pmfhl.lw", args: reg(rd), comment };
                    case 0x01: return { op: "pmfhl.uw", args: reg(rd), comment };
                    case 0x02: return { op: "pmfhl.slw", args: reg(rd), comment };
                    case 0x03: return { op: "pmfhl.lh", args: reg(rd), comment };
                    case 0x04: return { op: "pmfhl.sh", args: reg(rd), comment };
                }
                break;
            case 0x31:
                if (mmiFmt === 0x00)
                    return { op: "pmthl.lw", args: reg(rs), comment };
                break;
            case 0x34: return { op: "psllh", args: `${reg(rd)}, ${reg(rt)}, ${sa}`, comment };
            case 0x36: return { op: "psrlh", args: `${reg(rd)}, ${reg(rt)}, ${sa}`, comment };
            case 0x37: return { op: "psrah", args: `${reg(rd)}, ${reg(rt)}, ${sa}`, comment };
            case 0x3c: return { op: "psllw", args: `${reg(rd)}, ${reg(rt)}, ${sa}`, comment };
            case 0x3e: return { op: "psrlw", args: `${reg(rd)}, ${reg(rt)}, ${sa}`, comment };
            case 0x3f: return { op: "psraw", args: `${reg(rd)}, ${reg(rt)}, ${sa}`, comment };
        }
    }
    // COP0 opcode (0x10) - Coprocessor 0 (System Control)
    if (opcode === 0x10) {
        const cop0Func = rs;
        if (cop0Func === 0x00)
            return { op: "mfc0", args: `${reg(rt)}, $${rd}`, comment: "; move from CP0" };
        if (cop0Func === 0x04)
            return { op: "mtc0", args: `${reg(rt)}, $${rd}`, comment: "; move to CP0" };
        if (cop0Func === 0x08) {
            const bc0 = rt;
            if (bc0 === 0x00)
                return { op: "bc0f", args: formatBranch(pc + 4 + (signedImm << 2), signedImm << 2), comment };
            if (bc0 === 0x01)
                return { op: "bc0t", args: formatBranch(pc + 4 + (signedImm << 2), signedImm << 2), comment };
            if (bc0 === 0x02)
                return { op: "bc0fl", args: formatBranch(pc + 4 + (signedImm << 2), signedImm << 2), comment };
            if (bc0 === 0x03)
                return { op: "bc0tl", args: formatBranch(pc + 4 + (signedImm << 2), signedImm << 2), comment };
        }
        if (cop0Func === 0x10) {
            if (funct === 0x01)
                return { op: "tlbr", args: "", comment };
            if (funct === 0x02)
                return { op: "tlbwi", args: "", comment };
            if (funct === 0x06)
                return { op: "tlbwr", args: "", comment };
            if (funct === 0x08)
                return { op: "tlbp", args: "", comment };
            if (funct === 0x18)
                return { op: "eret", args: "", comment: "; exception return" };
            if (funct === 0x38)
                return { op: "ei", args: "", comment: "; enable interrupts" };
            if (funct === 0x39)
                return { op: "di", args: "", comment: "; disable interrupts" };
        }
    }
    // COP1 (FPU) opcode (0x11) - Floating Point Unit
    if (opcode === 0x11) {
        const cop1Func = rs;
        if (cop1Func === 0x00)
            return { op: "mfc1", args: `${reg(rt)}, ${freg(rd)}`, comment };
        if (cop1Func === 0x02)
            return { op: "cfc1", args: `${reg(rt)}, ${freg(rd)}`, comment };
        if (cop1Func === 0x04)
            return { op: "mtc1", args: `${reg(rt)}, ${freg(rd)}`, comment };
        if (cop1Func === 0x06)
            return { op: "ctc1", args: `${reg(rt)}, ${freg(rd)}`, comment };
        if (cop1Func === 0x08) {
            const bc1 = rt;
            if (bc1 === 0x00)
                return { op: "bc1f", args: formatBranch(pc + 4 + (signedImm << 2), signedImm << 2), comment };
            if (bc1 === 0x01)
                return { op: "bc1t", args: formatBranch(pc + 4 + (signedImm << 2), signedImm << 2), comment };
            if (bc1 === 0x02)
                return { op: "bc1fl", args: formatBranch(pc + 4 + (signedImm << 2), signedImm << 2), comment };
            if (bc1 === 0x03)
                return { op: "bc1tl", args: formatBranch(pc + 4 + (signedImm << 2), signedImm << 2), comment };
        }
        if (cop1Func === 0x10) {
            // S format (single precision)
            switch (funct) {
                case 0x00: return { op: "add.s", args: `${freg(sa)}, ${freg(rd)}, ${freg(rt)}`, comment };
                case 0x01: return { op: "sub.s", args: `${freg(sa)}, ${freg(rd)}, ${freg(rt)}`, comment };
                case 0x02: return { op: "mul.s", args: `${freg(sa)}, ${freg(rd)}, ${freg(rt)}`, comment };
                case 0x03: return { op: "div.s", args: `${freg(sa)}, ${freg(rd)}, ${freg(rt)}`, comment };
                case 0x04: return { op: "sqrt.s", args: `${freg(sa)}, ${freg(rt)}`, comment };
                case 0x05: return { op: "abs.s", args: `${freg(sa)}, ${freg(rd)}`, comment };
                case 0x06: return { op: "mov.s", args: `${freg(sa)}, ${freg(rd)}`, comment };
                case 0x07: return { op: "neg.s", args: `${freg(sa)}, ${freg(rd)}`, comment };
                case 0x16: return { op: "rsqrt.s", args: `${freg(sa)}, ${freg(rd)}, ${freg(rt)}`, comment };
                case 0x18: return { op: "adda.s", args: `${freg(rd)}, ${freg(rt)}`, comment };
                case 0x19: return { op: "suba.s", args: `${freg(rd)}, ${freg(rt)}`, comment };
                case 0x1a: return { op: "mula.s", args: `${freg(rd)}, ${freg(rt)}`, comment };
                case 0x1c: return { op: "madd.s", args: `${freg(sa)}, ${freg(rd)}, ${freg(rt)}`, comment };
                case 0x1d: return { op: "msub.s", args: `${freg(sa)}, ${freg(rd)}, ${freg(rt)}`, comment };
                case 0x1e: return { op: "madda.s", args: `${freg(rd)}, ${freg(rt)}`, comment };
                case 0x1f: return { op: "msuba.s", args: `${freg(rd)}, ${freg(rt)}`, comment };
                case 0x24: return { op: "cvt.w.s", args: `${freg(sa)}, ${freg(rd)}`, comment };
                case 0x28: return { op: "max.s", args: `${freg(sa)}, ${freg(rd)}, ${freg(rt)}`, comment };
                case 0x29: return { op: "min.s", args: `${freg(sa)}, ${freg(rd)}, ${freg(rt)}`, comment };
                case 0x30: return { op: "c.f.s", args: `${freg(rd)}, ${freg(rt)}`, comment };
                case 0x32: return { op: "c.eq.s", args: `${freg(rd)}, ${freg(rt)}`, comment };
                case 0x34: return { op: "c.lt.s", args: `${freg(rd)}, ${freg(rt)}`, comment };
                case 0x36: return { op: "c.le.s", args: `${freg(rd)}, ${freg(rt)}`, comment };
            }
        }
        if (cop1Func === 0x14) {
            // W format (word fixed point)
            if (funct === 0x20)
                return { op: "cvt.s.w", args: `${freg(sa)}, ${freg(rd)}`, comment };
        }
    }
    // COP2 (VU0) opcode (0x12) - PS2 Vector Unit
    if (opcode === 0x12) {
        const cop2Func = rs;
        if (cop2Func === 0x01)
            return { op: "qmfc2", args: `${reg(rt)}, ${freg(rd)}`, comment };
        if (cop2Func === 0x02)
            return { op: "cfc2", args: `${reg(rt)}, ${freg(rd)}`, comment };
        if (cop2Func === 0x05)
            return { op: "qmtc2", args: `${reg(rt)}, ${freg(rd)}`, comment };
        if (cop2Func === 0x06)
            return { op: "ctc2", args: `${reg(rt)}, ${freg(rd)}`, comment };
        if (cop2Func === 0x08) {
            const bc2 = rt;
            if (bc2 === 0x00)
                return { op: "bc2f", args: formatBranch(pc + 4 + (signedImm << 2), signedImm << 2), comment };
            if (bc2 === 0x01)
                return { op: "bc2t", args: formatBranch(pc + 4 + (signedImm << 2), signedImm << 2), comment };
            if (bc2 === 0x02)
                return { op: "bc2fl", args: formatBranch(pc + 4 + (signedImm << 2), signedImm << 2), comment };
            if (bc2 === 0x03)
                return { op: "bc2tl", args: formatBranch(pc + 4 + (signedImm << 2), signedImm << 2), comment };
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
                case 0x00: return { op: "vadd", args: `${vreg(fd)}${destStr(dest)}, ${vreg(fs)}, ${vreg(ft)}`, comment };
                case 0x01: return { op: "vsub", args: `${vreg(fd)}${destStr(dest)}, ${vreg(fs)}, ${vreg(ft)}`, comment };
                case 0x02: return { op: "vmul", args: `${vreg(fd)}${destStr(dest)}, ${vreg(fs)}, ${vreg(ft)}`, comment };
                case 0x03: return { op: "vmax", args: `${vreg(fd)}${destStr(dest)}, ${vreg(fs)}, ${vreg(ft)}`, comment };
                case 0x04: return { op: "vmin", args: `${vreg(fd)}${destStr(dest)}, ${vreg(fs)}, ${vreg(ft)}`, comment };
                case 0x05: return { op: "vmul", args: `${vreg(fd)}${destStr(dest)}, ${vreg(fs)}, ${vreg(ft)}.${bcStr(bc)}`, comment };
                case 0x06: return { op: "vmulq", args: `${vreg(fd)}${destStr(dest)}, ${vreg(fs)}, Q`, comment };
                case 0x07: return { op: "vmaxi", args: `${vreg(fd)}${destStr(dest)}, ${vreg(fs)}, I`, comment };
                case 0x08: return { op: "vaddq", args: `${vreg(fd)}${destStr(dest)}, ${vreg(fs)}, Q`, comment };
                case 0x09: return { op: "vsubq", args: `${vreg(fd)}${destStr(dest)}, ${vreg(fs)}, Q`, comment };
                case 0x0a: return { op: "vaddi", args: `${vreg(fd)}${destStr(dest)}, ${vreg(fs)}, I`, comment };
                case 0x0b: return { op: "vsubi", args: `${vreg(fd)}${destStr(dest)}, ${vreg(fs)}, I`, comment };
                case 0x0c: return { op: "vmini", args: `${vreg(fd)}${destStr(dest)}, ${vreg(fs)}, I`, comment };
                case 0x0d: return { op: "vadd", args: `${vreg(fd)}${destStr(dest)}, ${vreg(fs)}, ${vreg(ft)}.${bcStr(bc)}`, comment };
                case 0x0e: return { op: "vsub", args: `${vreg(fd)}${destStr(dest)}, ${vreg(fs)}, ${vreg(ft)}.${bcStr(bc)}`, comment };
                case 0x0f: return { op: "vopmsub", args: `${vreg(fd)}, ${vreg(fs)}, ${vreg(ft)}`, comment };
                case 0x10: return { op: "vacc", args: `${vreg(fd)}${destStr(dest)}, ${vreg(fs)}, ${vreg(ft)}`, comment };
                case 0x11: return { op: "vmsub", args: `${vreg(fd)}${destStr(dest)}, ${vreg(fs)}, ${vreg(ft)}`, comment };
                case 0x12: return { op: "vmadd", args: `${vreg(fd)}${destStr(dest)}, ${vreg(fs)}, ${vreg(ft)}`, comment };
                case 0x13: return { op: "vmmax", args: `${vreg(fd)}${destStr(dest)}, ${vreg(fs)}, ${vreg(ft)}`, comment };
                case 0x14: return { op: "vmmin", args: `${vreg(fd)}${destStr(dest)}, ${vreg(fs)}, ${vreg(ft)}`, comment };
                case 0x15: return { op: "vmsub", args: `${vreg(fd)}${destStr(dest)}, ${vreg(fs)}, ${vreg(ft)}.${bcStr(bc)}`, comment };
                case 0x16: return { op: "vmsubq", args: `${vreg(fd)}${destStr(dest)}, ${vreg(fs)}, Q`, comment };
                case 0x17: return { op: "vmmini", args: `${vreg(fd)}${destStr(dest)}, ${vreg(fs)}, I`, comment };
                case 0x18: return { op: "vaddabc", args: `ACC${destStr(dest)}, ${vreg(fs)}, ${vreg(ft)}.${bcStr(bc)}`, comment };
                case 0x19: return { op: "vsubabc", args: `ACC${destStr(dest)}, ${vreg(fs)}, ${vreg(ft)}.${bcStr(bc)}`, comment };
                case 0x1a: return { op: "vmulabc", args: `ACC${destStr(dest)}, ${vreg(fs)}, ${vreg(ft)}.${bcStr(bc)}`, comment };
                case 0x1b: return { op: "vmadda", args: `ACC${destStr(dest)}, ${vreg(fs)}, ${vreg(ft)}`, comment };
                case 0x1c: return { op: "vmsuba", args: `ACC${destStr(dest)}, ${vreg(fs)}, ${vreg(ft)}`, comment };
                case 0x1d: return { op: "vmadd", args: `${vreg(fd)}${destStr(dest)}, ${vreg(fs)}, ${vreg(ft)}.${bcStr(bc)}`, comment };
                case 0x1e: return { op: "vmaddq", args: `${vreg(fd)}${destStr(dest)}, ${vreg(fs)}, Q`, comment };
                case 0x1f: return { op: "vmmaxi", args: `${vreg(fd)}${destStr(dest)}, ${vreg(fs)}, I`, comment };
                case 0x20: return { op: "vaddai", args: `ACC${destStr(dest)}, ${vreg(fs)}, I`, comment };
                case 0x21: return { op: "vsubai", args: `ACC${destStr(dest)}, ${vreg(fs)}, I`, comment };
                case 0x22: return { op: "vmulai", args: `ACC${destStr(dest)}, ${vreg(fs)}, I`, comment };
                case 0x23: return { op: "vmaddai", args: `ACC${destStr(dest)}, ${vreg(fs)}, I`, comment };
                case 0x24: return { op: "vmsubai", args: `ACC${destStr(dest)}, ${vreg(fs)}, I`, comment };
                case 0x25: return { op: "vadda", args: `ACC${destStr(dest)}, ${vreg(fs)}, ${vreg(ft)}`, comment };
                case 0x26: return { op: "vsuba", args: `ACC${destStr(dest)}, ${vreg(fs)}, ${vreg(ft)}`, comment };
                case 0x27: return { op: "vmula", args: `ACC${destStr(dest)}, ${vreg(fs)}, ${vreg(ft)}`, comment };
                case 0x28: return { op: "vopmula", args: `ACC, ${vreg(fs)}, ${vreg(ft)}`, comment };
                case 0x29: return { op: "vnop", args: "", comment };
                case 0x2a: return { op: "vmove", args: `${vreg(fd)}${destStr(dest)}, ${vreg(fs)}`, comment };
                case 0x2b: return { op: "vmr32", args: `${vreg(fd)}${destStr(dest)}, ${vreg(fs)}`, comment };
                case 0x2c: return { op: "vlqi", args: `${vreg(fd)}${destStr(dest)}, (${vireg(fs)}++)`, comment };
                case 0x2d: return { op: "vsqi", args: `${vreg(fs)}${destStr(dest)}, (${vireg(ft)}++)`, comment };
                case 0x2e: return { op: "vlqd", args: `${vreg(fd)}${destStr(dest)}, (--${vireg(fs)})`, comment };
                case 0x2f: return { op: "vsqd", args: `${vreg(fs)}${destStr(dest)}, (--${vireg(ft)})`, comment };
                case 0x30: return { op: "vdiv", args: `Q, ${vreg(fs)}, ${vreg(ft)}`, comment };
                case 0x31: return { op: "vsqrt", args: `Q, ${vreg(ft)}`, comment };
                case 0x32: return { op: "vrsqrt", args: `Q, ${vreg(fs)}, ${vreg(ft)}`, comment };
                case 0x33: return { op: "vwaitq", args: "", comment };
                case 0x34: return { op: "vmtir", args: `${vireg(ft)}, ${vreg(fs)}`, comment };
                case 0x35: return { op: "vmfir", args: `${vreg(fd)}${destStr(dest)}, ${vireg(fs)}`, comment };
                case 0x36: return { op: "vilwr", args: `${vireg(ft)}, (${vireg(fs)})`, comment };
                case 0x37: return { op: "viswr", args: `${vireg(ft)}, (${vireg(fs)})`, comment };
                case 0x38: return { op: "vrnext", args: `${vreg(fd)}${destStr(dest)}, R`, comment };
                case 0x39: return { op: "vrget", args: `${vreg(fd)}${destStr(dest)}, R`, comment };
                case 0x3a: return { op: "vrinit", args: `R, ${vreg(fs)}`, comment };
                case 0x3b: return { op: "vrxor", args: `R, ${vreg(fs)}`, comment };
                case 0x3c: return { op: "vclip", args: `${vreg(fs)}, ${vreg(ft)}`, comment };
                case 0x3d: return { op: "vmaddaq", args: `ACC${destStr(dest)}, ${vreg(fs)}, Q`, comment };
                case 0x3e: return { op: "vmsubaq", args: `ACC${destStr(dest)}, ${vreg(fs)}, Q`, comment };
                case 0x3f: return { op: "vmulaq", args: `ACC${destStr(dest)}, ${vreg(fs)}, Q`, comment };
            }
            // VU0 special instructions (lower instructions with different encoding)
            const vuLower = (instr >> 25) & 0x7f;
            if (vuLower === 0x30 || vuLower === 0x31 || vuLower === 0x32 || vuLower === 0x33) {
                const it = (instr >> 16) & 0x1f;
                const is = (instr >> 11) & 0x1f;
                const id = (instr >> 6) & 0x1f;
                const vireg = (r) => `vi${r}`;
                switch (funct) {
                    case 0x30: return { op: "viadd", args: `${vireg(id)}, ${vireg(is)}, ${vireg(it)}`, comment };
                    case 0x31: return { op: "visub", args: `${vireg(id)}, ${vireg(is)}, ${vireg(it)}`, comment };
                    case 0x32: return { op: "viaddi", args: `${vireg(it)}, ${vireg(is)}, ${(instr & 0x1f) - ((instr & 0x10) ? 32 : 0)}`, comment };
                    case 0x33: return { op: "viand", args: `${vireg(id)}, ${vireg(is)}, ${vireg(it)}`, comment };
                    case 0x34: return { op: "vior", args: `${vireg(id)}, ${vireg(is)}, ${vireg(it)}`, comment };
                }
            }
        }
    }
    // If we reach here, instruction is unknown
    return { op: "unknown", args: "", label: "", comment: "; unrecognized instruction" };
}
//# sourceMappingURL=analyzer.js.map