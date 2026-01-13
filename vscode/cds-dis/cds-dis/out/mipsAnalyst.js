"use strict";
/**
 * Enhanced MIPS Comment Generation System
 * Extends basic instruction analysis with advanced pattern detection
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.regName = regName;
exports.isFunctionPrologue = isFunctionPrologue;
exports.isFunctionEpilogue = isFunctionEpilogue;
exports.updateRegisterTracking = updateRegisterTracking;
exports.generateEnhancedComment = generateEnhancedComment;
const helpers_1 = require("./helpers");
/**
 * Helper: Get register name from register number
 */
function regName(r) {
    const names = [
        "zero",
        "at",
        "v0",
        "v1",
        "a0",
        "a1",
        "a2",
        "a3",
        "t0",
        "t1",
        "t2",
        "t3",
        "t4",
        "t5",
        "t6",
        "t7",
        "s0",
        "s1",
        "s2",
        "s3",
        "s4",
        "s5",
        "s6",
        "s7",
        "t8",
        "t9",
        "k0",
        "k1",
        "gp",
        "sp",
        "fp",
        "ra",
    ];
    return names[r] || `r${r}`;
}
/**
 * Detect if instruction is in a delay slot
 */
function isDelaySlot(prevInstr) {
    if (!prevInstr)
        return false;
    const opcode = (prevInstr >> 26) & 0x3f;
    const funct = prevInstr & 0x3f;
    // Branch instructions
    if (opcode >= 0x04 && opcode <= 0x07)
        return true;
    if (opcode >= 0x14 && opcode <= 0x17)
        return true;
    if (opcode === 0x01)
        return true;
    // Jump instructions
    if (opcode === 0x02 || opcode === 0x03)
        return true;
    // Register jumps
    if (opcode === 0x00 && (funct === 0x08 || funct === 0x09))
        return true;
    return false;
}
/**
 * Detect MIPS idioms and pseudo-instructions
 */
function detectIdiom(instr, prevInstr) {
    const opcode = (instr >> 26) & 0x3f;
    const funct = instr & 0x3f;
    const rs = (instr >> 21) & 0x1f;
    const rt = (instr >> 16) & 0x1f;
    const rd = (instr >> 11) & 0x1f;
    const imm = instr & 0xffff;
    // NOP with delay slot detection
    if (instr === 0x00000000) {
        if (isDelaySlot(prevInstr)) {
            return { type: "calc", text: "delay slot", priority: 3 };
        }
        return null;
    }
    // OR rd, rs, zero → move rd, rs
    if (opcode === 0x00 && funct === 0x25 && rt === 0) {
        return {
            type: "calc",
            text: `move ${regName(rd)} ← ${regName(rs)}`,
            priority: 4,
        };
    }
    // ADDU rd, rs, zero → move rd, rs
    if (opcode === 0x00 && funct === 0x21 && rt === 0) {
        return {
            type: "calc",
            text: `move ${regName(rd)} ← ${regName(rs)}`,
            priority: 4,
        };
    }
    // XOR rd, rs, rs → clear rd
    if (opcode === 0x00 && funct === 0x26 && rs === rt) {
        return {
            type: "calc",
            text: `${regName(rd)} = 0 (xor clear)`,
            priority: 5,
        };
    }
    // SUBU rd, zero, rs → negate
    if (opcode === 0x00 && funct === 0x23 && rs === 0) {
        return {
            type: "calc",
            text: `${regName(rd)} = -${regName(rt)}`,
            priority: 5,
        };
    }
    // LUI rt, imm → load upper
    if (opcode === 0x0f) {
        return {
            type: "calc",
            text: `load upper 0x${(0, helpers_1.padHex)(imm << 16, 8)}`,
            priority: 4,
        };
    }
    // Sign extension: SLL + SRA
    if (prevInstr) {
        const prevOp = (prevInstr >> 26) & 0x3f;
        const prevFunct = prevInstr & 0x3f;
        const prevRd = (prevInstr >> 11) & 0x1f;
        const prevSa = (prevInstr >> 6) & 0x1f;
        const sa = (instr >> 6) & 0x1f;
        if (prevOp === 0x00 &&
            prevFunct === 0x00 &&
            prevSa === 16 &&
            opcode === 0x00 &&
            funct === 0x03 &&
            sa === 16 &&
            rd === prevRd &&
            rt === rd) {
            return { type: "calc", text: "sign extend half → word", priority: 6 };
        }
    }
    return null;
}
/**
 * Detect shift-based optimizations
 */
function detectShiftOpt(instr) {
    const opcode = (instr >> 26) & 0x3f;
    const funct = instr & 0x3f;
    const sa = (instr >> 6) & 0x1f;
    if (opcode !== 0x00 || sa === 0)
        return null;
    // SLL - multiply by power of 2
    if (funct === 0x00) {
        if (sa === 1)
            return { type: "calc", text: "× 2", priority: 5 };
        if (sa === 2)
            return { type: "calc", text: "× 4 (word index)", priority: 5 };
        if (sa === 3)
            return { type: "calc", text: "× 8 (dword index)", priority: 5 };
        return { type: "calc", text: `× ${1 << sa}`, priority: 5 };
    }
    // SRA - signed divide by power of 2
    if (funct === 0x03) {
        return { type: "calc", text: `÷ ${1 << sa} (signed)`, priority: 5 };
    }
    // SRL - unsigned divide by power of 2
    if (funct === 0x02) {
        return { type: "calc", text: `÷ ${1 << sa} (unsigned)`, priority: 5 };
    }
    return null;
}
/**
 * Detect PS2 syscalls
 */
function detectSyscall(instr) {
    const opcode = (instr >> 26) & 0x3f;
    const funct = instr & 0x3f;
    if (opcode !== 0x00 || funct !== 0x0c)
        return null;
    const code = (instr >> 6) & 0xfffff;
    const syscalls = {
        0x00: "RFU000_FullReset",
        0x01: "ResetEE",
        0x02: "SetGsCrt",
        0x03: "RFU003",
        0x04: "Exit",
        0x05: "RFU005",
        0x06: "LoadExecPS2",
        0x07: "ExecPS2",
        0x08: "RFU008",
        0x09: "RFU009",
        0x0a: "AddSbusIntcHandler",
        0x0b: "RemoveSbusIntcHandler",
        0x0c: "Interrupt2Iop",
        0x0d: "SetVTLBRefillHandler",
        0x0e: "SetVCommonHandler",
        0x0f: "SetVInterruptHandler",
        0x10: "AddIntcHandler",
        0x11: "RemoveIntcHandler",
        0x12: "AddDmacHandler",
        0x13: "RemoveDmacHandler",
        0x14: "_EnableIntc",
        0x15: "_DisableIntc",
        0x16: "_EnableDmac",
        0x17: "_DisableDmac",
        0x18: "_SetAlarm",
        0x19: "_ReleaseAlarm",
        0x1a: "_iEnableIntc",
        0x1b: "_iDisableIntc",
        0x1c: "_iEnableDmac",
        0x1d: "_iDisableDmac",
        0x1e: "_iSetAlarm",
        0x1f: "_iReleaseAlarm",
        0x20: "CreateThread",
        0x21: "DeleteThread",
        0x22: "StartThread",
        0x23: "ExitThread",
        0x24: "ExitDeleteThread",
        0x25: "TerminateThread",
        0x26: "iTerminateThread",
        0x27: "DisableDispatchThread",
        0x28: "EnableDispatchThread",
        0x29: "ChangeThreadPriority",
        0x2a: "iChangeThreadPriority",
        0x2b: "RotateThreadReadyQueue",
        0x2c: "iRotateThreadReadyQueue",
        0x2d: "ReleaseWaitThread",
        0x2e: "iReleaseWaitThread",
        0x2f: "GetThreadId",
        0x30: "ReferThreadStatus",
        0x31: "iReferThreadStatus",
        0x32: "SleepThread",
        0x33: "WakeupThread",
        0x34: "iWakeupThread",
        0x35: "CancelWakeupThread",
        0x36: "iCancelWakeupThread",
        0x37: "SuspendThread",
        0x38: "iSuspendThread",
        0x39: "ResumeThread",
        0x3a: "iResumeThread",
        0x3b: "JoinThread",
        0x3c: "RFU060",
        0x3d: "RFU061",
        0x3e: "EndOfHeap",
        0x3f: "RFU063",
        0x40: "CreateSema",
        0x41: "DeleteSema",
        0x42: "SignalSema",
        0x43: "iSignalSema",
        0x44: "WaitSema",
        0x45: "PollSema",
        0x46: "iPollSema",
        0x47: "ReferSemaStatus",
        0x48: "iReferSemaStatus",
        0x49: "RFU073",
        0x4a: "SetOsdConfigParam",
        0x4b: "GetOsdConfigParam",
        0x4c: "GetGsHParam",
        0x4d: "GetGsVParam",
        0x4e: "SetGsHParam",
        0x4f: "SetGsVParam",
        0x50: "RFU080_CreateEventFlag",
        0x51: "RFU081_DeleteEventFlag",
        0x52: "RFU082_SetEventFlag",
        0x53: "RFU083_iSetEventFlag",
        0x54: "RFU084_ClearEventFlag",
        0x55: "RFU085_iClearEventFlag",
        0x56: "RFU086_WaitEventFlag",
        0x57: "RFU087_PollEventFlag",
        0x58: "RFU088_iPollEventFlag",
        0x59: "RFU089_ReferEventFlagStatus",
        0x5a: "RFU090_iReferEventFlagStatus",
        0x5b: "RFU091",
        0x5c: "EnableIntcHandler",
        0x5d: "DisableIntcHandler",
        0x5e: "EnableDmacHandler",
        0x5f: "DisableDmacHandler",
        0x60: "KSeg0",
        0x61: "EnableCache",
        0x62: "DisableCache",
        0x63: "GetCop0",
        0x64: "FlushCache",
        0x66: "CpuConfig",
        0x67: "iGetCop0",
        0x68: "iFlushCache",
        0x6a: "iCpuConfig",
        0x6b: "sceSifStopDma",
        0x6c: "SetCPUTimerHandler",
        0x6d: "SetCPUTimer",
        0x6e: "ForceRead",
        0x6f: "ForceWrite",
        0x70: "GsGetIMR",
        0x71: "GsPutIMR",
        0x72: "SetPgifHandler",
        0x73: "SetVSyncFlag",
        0x74: "RFU116",
        0x75: "print",
        0x76: "sceSifDmaStat",
        0x77: "sceSifSetDma",
        0x78: "sceSifSetDChain",
        0x79: "sceSifSetReg",
        0x7a: "sceSifGetReg",
        0x7b: "ExecOSD",
        0x7c: "Deci2Call",
        0x7d: "PSMode",
        0x7e: "MachineType",
        0x7f: "GetMemorySize",
    };
    const name = syscalls[code];
    return {
        type: "syscall",
        text: name ? `syscall: ${name}` : `syscall 0x${(0, helpers_1.padHex)(code, 8)}`,
        priority: 10,
    };
}
/**
 * Detect VU0 operations
 */
function detectVectorOp(instr) {
    const opcode = (instr >> 26) & 0x3f;
    // COP2 (VU0)
    if (opcode === 0x12) {
        const cop2Func = (instr >> 21) & 0x1f;
        if (cop2Func === 0x01)
            return { type: "vector", text: "VU0: get from VU", priority: 6 };
        if (cop2Func === 0x05)
            return { type: "vector", text: "VU0: send to VU", priority: 6 };
        if ((cop2Func & 0x10) === 0x10) {
            const vuFunc = instr & 0x3f;
            const ops = {
                0x00: "vadd",
                0x01: "vsub",
                0x02: "vmul",
                0x03: "vmax",
                0x04: "vmin",
                0x2a: "vmove",
                0x30: "vdiv",
                0x31: "vsqrt",
            };
            if (ops[vuFunc]) {
                return { type: "vector", text: `VU0: ${ops[vuFunc]}`, priority: 6 };
            }
        }
    }
    // Quadword load/store
    if (opcode === 0x1e)
        return { type: "vector", text: "load qword (128-bit)", priority: 6 };
    if (opcode === 0x1f)
        return { type: "vector", text: "store qword (128-bit)", priority: 6 };
    return null;
}
/**
 * Detect FPU operations
 */
function detectFloatOp(instr) {
    const opcode = (instr >> 26) & 0x3f;
    // COP1 (FPU)
    if (opcode === 0x11) {
        const cop1Func = (instr >> 21) & 0x1f;
        const funct = instr & 0x3f;
        if (cop1Func === 0x10) {
            const ops = {
                0x00: "add.s",
                0x01: "sub.s",
                0x02: "mul.s",
                0x03: "div.s",
                0x04: "sqrt.s",
                0x05: "abs.s",
                0x06: "mov.s",
                0x07: "neg.s",
                0x24: "cvt.w.s",
            };
            if (ops[funct]) {
                return { type: "float", text: `FPU: ${ops[funct]}`, priority: 6 };
            }
        }
    }
    // FPU load/store
    if (opcode === 0x31)
        return { type: "float", text: "load float", priority: 5 };
    if (opcode === 0x39)
        return { type: "float", text: "store float", priority: 5 };
    if (opcode === 0x35)
        return { type: "float", text: "load double", priority: 5 };
    if (opcode === 0x3d)
        return { type: "float", text: "store double", priority: 5 };
    return null;
}
/**
 * Analyze branch instructions
 */
function analyzeBranch(addr, instr) {
    const opcode = (instr >> 26) & 0x3f;
    const rs = (instr >> 21) & 0x1f;
    const rt = (instr >> 16) & 0x1f;
    const imm = instr & 0xffff;
    const signedImm = imm & 0x8000 ? imm | 0xffff0000 : imm;
    const target = addr + 4 + (signedImm << 2);
    if (opcode < 0x04 || opcode > 0x17) {
        if (opcode !== 0x01)
            return null;
    }
    const offset = target - addr - 4;
    const instrCount = offset / 4;
    const isBackward = offset < 0;
    // Unconditional branch
    if (opcode === 0x04 && rs === rt) {
        if (isBackward) {
            return {
                type: "branch",
                text: Math.abs(instrCount) === 1
                    ? "infinite loop"
                    : `loop to 0x${(0, helpers_1.padHex)(target, 8)}`,
                priority: 9,
            };
        }
        return { type: "branch", text: "unconditional jump", priority: 8 };
    }
    if (!isBackward)
        return null;
    let condition = "";
    if (opcode === 0x05 || opcode === 0x15)
        condition = "!=";
    else if (opcode === 0x04 || opcode === 0x14)
        condition = "==";
    else if (opcode === 0x06 || opcode === 0x16)
        condition = "<=";
    else if (opcode === 0x07 || opcode === 0x17)
        condition = ">";
    if (condition) {
        return {
            type: "branch",
            text: `loop while ${regName(rs)} ${condition} ${regName(rt)}`,
            priority: 8,
        };
    }
    return null;
}
/**
 * Analyze function calls
 */
function analyzeFunctionCall(addr, instr) {
    const opcode = (instr >> 26) & 0x3f;
    const funct = instr & 0x3f;
    const rs = (instr >> 21) & 0x1f;
    // JAL
    if (opcode === 0x03) {
        const target = ((addr & 0xf0000000) | (((instr & 0x03ffffff) << 2) >>> 0)) >>> 0;
        return {
            type: "function",
            text: `call 0x${(0, helpers_1.padHex)(target, 8)}`,
            priority: 9,
        };
    }
    // JALR
    if (opcode === 0x00 && funct === 0x09) {
        return {
            type: "function",
            text: `indirect call via ${regName(rs)}`,
            priority: 9,
        };
    }
    // JR RA
    if (opcode === 0x00 && funct === 0x08 && rs === 31) {
        return { type: "function", text: "return", priority: 9 };
    }
    return null;
}
/**
 * Analyze bitwise operations
 */
function analyzeBitwiseOp(instr) {
    const opcode = (instr >> 26) & 0x3f;
    const imm = instr & 0xffff;
    if (opcode === 0x0c) {
        const isPowerOf2 = imm !== 0 && (imm & (imm - 1)) === 0;
        if (isPowerOf2) {
            const bitNum = Math.log2(imm);
            return { type: "bitwise", text: `test bit ${bitNum}`, priority: 6 };
        }
        else if (imm < 0x100) {
            return {
                type: "bitwise",
                text: `mask 0x${(0, helpers_1.padHex)(imm, 8)}`,
                priority: 5,
            };
        }
    }
    return null;
}
/**
 * Analyze memory access
 */
function analyzeMemoryAccess(instr, registers) {
    const opcode = (instr >> 26) & 0x3f;
    const rs = (instr >> 21) & 0x1f;
    const rt = (instr >> 16) & 0x1f;
    const imm = instr & 0xffff;
    const signedImm = imm & 0x8000 ? imm | 0xffff0000 : imm;
    const isLoad = (opcode >= 0x20 && opcode <= 0x27) ||
        opcode === 0x37 ||
        opcode === 0x1e ||
        opcode === 0x1a ||
        opcode === 0x1b;
    const isStore = (opcode >= 0x28 && opcode <= 0x2f) ||
        opcode === 0x3f ||
        opcode === 0x1f ||
        opcode === 0x2c ||
        opcode === 0x2d;
    if (!isLoad && !isStore)
        return null;
    const baseReg = regName(rs);
    const dataReg = regName(rt);
    // Stack operations
    if (baseReg === "sp") {
        const operation = isLoad ? "restore" : "save";
        if (dataReg === "ra") {
            return {
                type: "memory",
                text: `${operation} return address`,
                priority: 7,
            };
        }
        else if (dataReg.startsWith("s")) {
            return { type: "memory", text: `${operation} ${dataReg}`, priority: 6 };
        }
        else if (dataReg === "fp") {
            return {
                type: "memory",
                text: `${operation} frame pointer`,
                priority: 7,
            };
        }
        return null;
    }
    // Global pointer access
    if (baseReg === "gp") {
        const baseValue = registers.get(baseReg);
        if (baseValue !== undefined) {
            const targetAddr = (baseValue + signedImm) >>> 0;
            return {
                type: "memory",
                text: `global @ 0x${(0, helpers_1.padHex)(targetAddr, 8)}`,
                priority: 6,
            };
        }
    }
    return null;
}
/**
 * Analyze pointer calculations
 */
function analyzePointerCalc(instr, registers) {
    const opcode = (instr >> 26) & 0x3f;
    const rs = (instr >> 21) & 0x1f;
    const imm = instr & 0xffff;
    const signedImm = imm & 0x8000 ? imm | 0xffff0000 : imm;
    if ((opcode === 0x09 || opcode === 0x08 || opcode === 0x19) &&
        regName(rs) !== "sp") {
        const baseValue = registers.get(regName(rs));
        if (baseValue !== undefined && baseValue >= 0x00400000) {
            const result = (baseValue + signedImm) >>> 0;
            if (result >= 0x00400000) {
                return {
                    type: "pointer",
                    text: `→ 0x${(0, helpers_1.padHex)(result, 8)}`,
                    priority: 5,
                };
            }
        }
    }
    return null;
}
/**
 * Detect stack frame size
 */
function getStackFrameSize(instr) {
    const opcode = (instr >> 26) & 0x3f;
    const rs = (instr >> 21) & 0x1f;
    const rt = (instr >> 16) & 0x1f;
    const imm = instr & 0xffff;
    const signedImm = imm & 0x8000 ? imm | 0xffff0000 : imm;
    if ((opcode === 0x09 || opcode === 0x19) &&
        rs === 29 &&
        rt === 29 &&
        signedImm < 0) {
        return Math.abs(signedImm);
    }
    return null;
}
/**
 * Identify function prologue pattern
 */
function isFunctionPrologue(instr) {
    const frameSize = getStackFrameSize(instr);
    return frameSize !== null && frameSize > 0;
}
/**
 * Identify function epilogue pattern
 */
function isFunctionEpilogue(instr, nextInstr) {
    const opcode = (instr >> 26) & 0x3f;
    const funct = instr & 0x3f;
    const rs = (instr >> 21) & 0x1f;
    // JR RA
    if (opcode === 0x00 && funct === 0x08 && rs === 31) {
        return true;
    }
    // ADDIU sp, sp, +X (deallocation) before jr ra
    if (nextInstr !== undefined) {
        const rt = (instr >> 16) & 0x1f;
        const imm = instr & 0xffff;
        const signedImm = imm & 0x8000 ? imm | 0xffff0000 : imm;
        if ((opcode === 0x09 || opcode === 0x19) &&
            rs === 29 &&
            rt === 29 &&
            signedImm > 0) {
            // Check if next is jr ra
            const nextOp = (nextInstr >> 26) & 0x3f;
            const nextFunct = nextInstr & 0x3f;
            const nextRs = (nextInstr >> 21) & 0x1f;
            if (nextOp === 0x00 && nextFunct === 0x08 && nextRs === 31) {
                return true;
            }
        }
    }
    return false;
}
/**
 * Update register tracking for pointer analysis
 */
function updateRegisterTracking(op, args, instr, regs) {
    const parseImm = (s) => {
        const cleaned = s.replace("$", "");
        return parseInt(cleaned, 16);
    };
    const getSignedImm = (val) => {
        return (val << 16) >> 16;
    };
    if (op === "lui") {
        const opcode = (instr >> 26) & 0x3f;
        const rt = (instr >> 16) & 0x1f;
        const imm = instr & 0xffff;
        const rtName = regName(rt);
        regs.set(rtName, (imm << 16) >>> 0);
    }
    else if ((op === "ori" || op === "addiu" || op === "addi" || op === "daddiu") &&
        args.length >= 3) {
        const opcode = (instr >> 26) & 0x3f;
        const rs = (instr >> 21) & 0x1f;
        const rt = (instr >> 16) & 0x1f;
        const imm = instr & 0xffff;
        const rtName = regName(rt);
        const rsName = regName(rs);
        const baseValue = regs.get(rsName);
        if (baseValue !== undefined) {
            const signedImm = getSignedImm(imm);
            const result = op === "ori" ? (baseValue | imm) >>> 0 : (baseValue + signedImm) >>> 0;
            regs.set(rtName, result);
        }
        else {
            regs.delete(rtName);
        }
    }
    else if ((op === "addu" || op === "add" || op === "daddu") &&
        args.length >= 3) {
        const rd = (instr >> 11) & 0x1f;
        const rs = (instr >> 21) & 0x1f;
        const rt = (instr >> 16) & 0x1f;
        const rdName = regName(rd);
        const rsName = regName(rs);
        const rtName = regName(rt);
        const a = regs.get(rsName);
        const b = regs.get(rtName);
        if (a !== undefined && b !== undefined) {
            regs.set(rdName, (a + b) >>> 0);
        }
        else {
            regs.delete(rdName);
        }
    }
    else if ((op === "subu" || op === "sub" || op === "dsubu") &&
        args.length >= 3) {
        const rd = (instr >> 11) & 0x1f;
        const rs = (instr >> 21) & 0x1f;
        const rt = (instr >> 16) & 0x1f;
        const rdName = regName(rd);
        const rsName = regName(rs);
        const rtName = regName(rt);
        const a = regs.get(rsName);
        const b = regs.get(rtName);
        if (a !== undefined && b !== undefined) {
            regs.set(rdName, (a - b) >>> 0);
        }
        else {
            regs.delete(rdName);
        }
    }
    else if (op === "sll" && args.length >= 3) {
        const rd = (instr >> 11) & 0x1f;
        const rt = (instr >> 16) & 0x1f;
        const sa = (instr >> 6) & 0x1f;
        const rdName = regName(rd);
        const rtName = regName(rt);
        const val = regs.get(rtName);
        if (val !== undefined) {
            regs.set(rdName, (val << sa) >>> 0);
        }
        else {
            regs.delete(rdName);
        }
    }
    else if (args.length > 0 &&
        !op.startsWith("b") &&
        op !== "j" &&
        op !== "jal" &&
        op !== "nop") {
        const destReg = args[0];
        if (destReg && !destReg.includes("(") && !destReg.includes("$")) {
            regs.delete(destReg);
        }
    }
}
/**
 * MAIN FUNCTION: Generate enhanced comment for instruction
 *
 * This is the main entry point that combines all analysis methods.
 * It analyzes an instruction and returns the highest-priority comment.
 *
 * @param addr - Memory address of instruction
 * @param instr - 32-bit instruction word
 * @param registers - Map of register names to values (for pointer analysis)
 * @param prevInstr - Previous instruction (for delay slot detection, etc.)
 * @param isFirstInstruction - True if this is the first instruction in a function
 * @returns Comment string, or empty string if no comment
 */
function generateEnhancedComment(addr, instr, registers, prevInstr, isFirstInstruction = false) {
    const comments = [];
    // Stack frame allocation (function prologue)
    if (isFirstInstruction) {
        const frameSize = getStackFrameSize(instr);
        if (frameSize) {
            return `allocate ${frameSize} byte stack frame`;
        }
    }
    // Highest priority: syscalls
    const syscall = detectSyscall(instr);
    if (syscall)
        return syscall.text;
    // Function calls
    const funcCall = analyzeFunctionCall(addr, instr);
    if (funcCall)
        return funcCall.text;
    // VU0 operations
    const vectorOp = detectVectorOp(instr);
    if (vectorOp)
        comments.push(vectorOp);
    // FPU operations
    const floatOp = detectFloatOp(instr);
    if (floatOp)
        comments.push(floatOp);
    // MIPS idioms
    const idiom = detectIdiom(instr, prevInstr);
    if (idiom)
        comments.push(idiom);
    // Shift optimizations
    const shiftOpt = detectShiftOpt(instr);
    if (shiftOpt)
        comments.push(shiftOpt);
    // Branch analysis
    const branch = analyzeBranch(addr, instr);
    if (branch)
        comments.push(branch);
    // Bitwise operations
    const bitwise = analyzeBitwiseOp(instr);
    if (bitwise)
        comments.push(bitwise);
    // Memory access
    const memory = analyzeMemoryAccess(instr, registers);
    if (memory)
        comments.push(memory);
    // Pointer calculations
    const pointer = analyzePointerCalc(instr, registers);
    if (pointer)
        comments.push(pointer);
    // Return highest priority comment
    if (comments.length === 0)
        return "";
    comments.sort((a, b) => b.priority - a.priority);
    return comments[0].text;
}
//# sourceMappingURL=mipsAnalyst.js.map