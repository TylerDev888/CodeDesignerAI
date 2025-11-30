using CodeDesigner.Languages.CDS.Helpers;
using CodeDesigner.Languages.CDS.SyntaxItems;
using CodeDesigner.Languages.Logging;
using CodeDesigner.Languages.MipsR5900;
using CodeDesigner.Languages.MipsR5900.BaseTypes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection.Emit;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace CodeDesigner.Languages.CDS
{
    public class SyntaxParser
    {
        private ILogger _logger;

        private static readonly Regex IncludeRegex = new Regex(@"^include\s+\""(.*?)\""$", RegexOptions.IgnoreCase);
        private static readonly Regex OperationRegex = new Regex(@"^(?<cmd>[A-Za-z_][A-Za-z0-9_]*)\s*(?:(?<args>[^:]+?)\s*)?(?::(?<label>[A-Za-z_][A-Za-z0-9_]*))?$", RegexOptions.IgnoreCase);
        private static readonly Regex AddressRegex = new Regex(@"^address\s+\$([0-9a-fA-F]+)$", RegexOptions.IgnoreCase);
        private static readonly Regex HexcodeRegex = new Regex(@"^hexcode\s+\$([0-9a-fA-F]+)$", RegexOptions.IgnoreCase);
        private static readonly Regex SetRegRegex = new Regex(@"^setreg\s+(?<reg>[a-zA-Z0-9_]+)\s*,\s*\$(?<value>[0-9a-fA-F]+)$", RegexOptions.IgnoreCase);
        private static readonly Regex DefineLabelRegex = new Regex(@"^(?<label>[a-zA-Z_][a-zA-Z0-9_]*):\s*(.*)?", RegexOptions.IgnoreCase);
        private static readonly Regex StringRegex = new Regex(@"^string\s+\""(.*?)\""$", RegexOptions.IgnoreCase);
        private static readonly Regex MemoryRegex = new Regex(@"mem\[(0x[0-9A-Fa-f]+)\]\s+(\w+)\s*(=\s*(0x[0-9A-Fa-f]+|\d+))?\s*(\+=|\-=|\*=|/=)?\s*(0x[0-9A-Fa-f]+|\d+)?", RegexOptions.IgnoreCase);

        public SyntaxParser(ILogger logger)
        {
            _logger = logger;
        }

        private static Disassembler _disassembler = new();

        private string[] PrepareSourceCode(string sourceCode)
        {
            sourceCode = sourceCode.ToLower();
            return sourceCode.Split('\n');
        }

        private bool IsIncludeSyntax(string line)
        {
            if (!line.StartsWith("include")) return false;

            var match = IncludeRegex.Match(line);

            return match.Success;
        }

        private bool IsOperationSyntax(string line)
        {
            var match = OperationRegex.Match(line);

            return match.Success;
        }

        private bool IsAddressSyntax(string line)
        {
            if (!line.StartsWith("address")) return false;

            var match = AddressRegex.Match(line);

            return match.Success;
        }

        private bool IsHexcodeSyntax(string line)
        {
            if (!line.StartsWith("hexcode")) return false;

            var match = HexcodeRegex.Match(line);

            return match.Success;
        }

        private bool IsSetRegSyntax(string line)
        {
            if (!line.StartsWith("setreg")) return false;

            var match = SetRegRegex.Match(line);

            return match.Success;
        }

        private bool IsDefineLabelSyntax(string line)
        {
            if (!line.EndsWith(":")) return false;

            var match = DefineLabelRegex.Match(line);

            return match.Success;
        }

        private bool IsStringSyntax(string line)
        {
            if (!line.StartsWith("string")) return false;

            var match = StringRegex.Match(line);

            return match.Success;
        }

        private bool IsMemorySyntax(string line)
        {
            if (!line.StartsWith("mem")) return false;

            var match = MemoryRegex.Match(line);

            return match.Success;
        }

        private bool IsBranchOperation(string instruction)
        {
            return LanguageDefinition.BranchInstructions.Exists(x => x.TextDisplay == instruction.ToUpper());
        }

        private bool IsJumpOperation(string instrution)
        {
            return LanguageDefinition.JumpInstructions.Exists(x => x.TextDisplay == instrution.ToUpper());
        }

        private bool TryGetLabelAddress(Dictionary<string, uint> labelAddressMap, string labelText, out uint labelAddress)
        {
            return labelAddressMap.TryGetValue(labelText, out labelAddress);
        }

        public List<SyntaxItem> Parse(string sourceCode, string basePath = "")
        {
            List<SyntaxItem> syntaxItems = new();
            Dictionary<string, uint> labelAddressMap = BuildLabelMap(sourceCode);

            var lines = PrepareSourceCode(sourceCode);
            int lineNumber = 1;
            uint currentAddress = 0;

            bool inMultiLineComment = false;
            StringBuilder multiLineBuffer = new();
            int multiLineStart = 0;

            foreach (var line in lines)
            {
                string trimmed = line.Trim();

                if (string.IsNullOrWhiteSpace(trimmed)) { lineNumber++; continue; }
                if (TryParseInclude(trimmed, basePath, lineNumber, ref syntaxItems, ref currentAddress)) { lineNumber++; continue; }
                if (TryParseMultilineCommentStartOrContinue(trimmed, lineNumber, ref inMultiLineComment, ref multiLineStart, multiLineBuffer, syntaxItems)) { lineNumber++; continue; }
                if (inMultiLineComment) { multiLineBuffer.AppendLine(trimmed); lineNumber++; continue; }
                if (TryParseSingleLineComment(trimmed, lineNumber, syntaxItems)) { lineNumber++; continue; }
                if (TryParseAddress(trimmed, ref currentAddress, lineNumber, syntaxItems)) { lineNumber++; continue; }
                if (TryParseHexcode(trimmed, ref currentAddress, lineNumber, syntaxItems)) { lineNumber++; continue; }
                if (TryParseMem(trimmed, ref currentAddress, lineNumber, syntaxItems)) { lineNumber++; continue; }
                if (TryParseSetReg(trimmed, ref currentAddress, lineNumber, syntaxItems)) { lineNumber++; continue; }
                if (TryParseLabel(trimmed, ref currentAddress, lineNumber, syntaxItems)) { lineNumber++; continue; }
                if (TryParseString(trimmed, ref currentAddress, lineNumber, syntaxItems)) { lineNumber++; continue; }

                TryParseOperation(trimmed, lineNumber, labelAddressMap, ref currentAddress, syntaxItems);

                lineNumber++;
            }

            return syntaxItems;
        }
        private Dictionary<string, uint> BuildLabelMap(string sourceCode)
        {
            Dictionary<string, uint> labelMap = new();;
            bool inMultiLineComment = false;

            var lines = PrepareSourceCode(sourceCode);
            int lineNumber = 1;
            uint currentAddress = 0;

            // Iterate over each line in the source code
            foreach (var line in lines)
            {
                string trimmed = line.Trim();

                // Skip empty lines
                if (string.IsNullOrWhiteSpace(trimmed))
                {
                    lineNumber++;
                    continue;
                }

                // Handle multi-line comments
                if (inMultiLineComment)
                {
                    if (trimmed.Contains("*/"))
                    {
                        inMultiLineComment = false;
                    }
                    lineNumber++;
                    continue;
                }

                // Check for the start of a multi-line comment
                if (trimmed.Contains("/*"))
                {
                    inMultiLineComment = true;
                    lineNumber++;
                    continue;
                }

                // Skip single-line comments
                if (trimmed.StartsWith("//"))
                {
                    lineNumber++;
                    continue;
                }

                if (IsAddressSyntax(trimmed))
                {
                    var parts = trimmed.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                    if (parts.Length > 1 && parts[1].StartsWith("$"))
                    {
                        currentAddress = Convert.ToUInt32(parts[1].Trim('$'), 16); // Convert hex to uint
                    }

                    lineNumber++;
                    continue;
                }

                if (IsDefineLabelSyntax(trimmed))
                {
                    var labelMatch = DefineLabelRegex.Match(trimmed);
                    string label = labelMatch.Groups["label"].Value.ToLower();
                    if (!labelMap.ContainsKey(label))
                    {
                        labelMap[label] = currentAddress;
                        _logger.Debug($"[First Pass] Found label '{label}' at address 0x{currentAddress:X8}");
                    }
                }

                // Check if the line contains a hexcode
                else if (IsHexcodeSyntax(trimmed))
                {
                    currentAddress += 4; // Each hexcode takes 4 bytes
                }
                else if (IsMemorySyntax(trimmed))
                {
                    currentAddress += 4; // Each hexcode takes 4 bytes
                }
                // Check if the line contains a setreg (register setting)
                else if (IsSetRegSyntax(trimmed))
                {
                    currentAddress += 8; // Each setreg takes 8 bytes
                }
                // Handle string data (e.g., "string")
                else if (IsStringSyntax(trimmed))
                {
                    // If it's a string declaration, add its length + 1 for the closing quote
                    var stringMatch = StringRegex.Match(trimmed);
                    string strValue = stringMatch.Groups[1].Value;
                    currentAddress += (uint)(strValue.Length + 1); // String length + 1 for quotes 
                }
                // Check if the line contains an operation (e.g., add, sub, etc.)
                else if (IsOperationSyntax(trimmed))
                {
                    currentAddress += 4; // Commands typically take 4 bytes
                }
                // Handle other cases as needed
                else
                {
                    // If we encounter an unrecognized line, we can log or handle it
                    _logger.Warning($"Unrecognized line: {trimmed}");
                }

                lineNumber++;
            }

            return labelMap;
        }
        private bool TryParseInclude(string line, string basePath, int lineNumber, ref List<SyntaxItem> syntaxItems, ref uint currentAddress)
        {
            if (!IsIncludeSyntax(line)) { return false; }
            
            var match = IncludeRegex.Match(line);
            string includePath = match.Groups[1].Value;
            string fullPath = Path.Combine(basePath, includePath);

            if (File.Exists(fullPath))
            {
                syntaxItems.Add(new IncludeSyntaxItem
                {
                    LineNumber = lineNumber,
                    LineText = line,
                    FilePath = fullPath
                });
            }
            else
            {
                _logger.Error($"Included file not found: {fullPath}");
            }

            return true;
        }

        private void TryParseOperation(string line, int lineNumber, Dictionary<string, uint> labelAddressMap, ref uint currentAddress, List<SyntaxItem> syntaxItems)
        {
            if (!IsOperationSyntax(line)) { return; };

            // Match operations with or without labels
            var match = OperationRegex.Match(line);

            // Extract the label, operation, and arguments
            string label = match.Groups["label"].Value;
            string instruction = match.Groups["cmd"].Value;
            string? args = match.Groups["args"]?.Value?.Trim();

            // If no label operand, resolve the operation normally
            if (string.IsNullOrEmpty(label))
            {
                string operationHex = _disassembler.Disassemble(line);

                syntaxItems.Add(new OperationSyntaxItem
                {
                    LineNumber = lineNumber,
                    LineText = line,
                    Address = currentAddress,
                    AddressHex = new HexString($"{currentAddress:X8}"),
                    Instruction = LanguageDefinition.Instructions.Find(x => x.TextDisplay == instruction.ToUpper()),
                    Hex = new HexString(operationHex),
                });

                currentAddress += 4;  // Operations typically consume 4 bytes
                return;
            }

            if (TryGetLabelAddress(labelAddressMap, label, out uint labelAddress))
            {
                if (IsBranchOperation(instruction))
                {
                    uint offset = (uint)((labelAddress - (currentAddress + 4)) / 4); // Calculate offset
                    string offsetHex = $"{offset:x8}";

                    string resolvedInstruction = line.Replace($":{label}", $"${offsetHex.Substring(4, 4)}");
                    string operationHex = _disassembler.Disassemble(resolvedInstruction);

                    _logger.Debug($"[Resolved Branch @ Line:{lineNumber}] {currentAddress:X8} {operationHex}");

                    syntaxItems.Add(new OperationBranchSyntaxItem
                    {
                        LineNumber = lineNumber,
                        LineText = line,
                        Address = currentAddress,
                        AddressHex = new HexString($"{currentAddress:X8}"),
                        HasLabel = true,
                        Label = label,
                        LabelAddress = labelAddress,
                        Offset = offset,
                        Instruction = LanguageDefinition.Instructions.Find(x => x.TextDisplay == instruction.ToUpper()),
                        Hex = new HexString(operationHex)
                    });
                }
                // Resolve jump instructions
                else if (IsJumpOperation(instruction))
                {
                    string target = $"$0{labelAddress:X8}".Substring(1, 7); // Format label address for jump
                    string resolvedInstruction = $"{instruction} ${target}";
                    string operationHex = _disassembler.Disassemble(resolvedInstruction);

                    _logger.Debug($"[Resolved Jump   @ Line:{lineNumber}] {currentAddress:X8} {operationHex}");

                    syntaxItems.Add(new OperationJumpSyntaxItem
                    {
                        LineNumber = lineNumber,
                        LineText = line,
                        Address = currentAddress,
                        AddressHex = new HexString($"{currentAddress:X8}"),
                        HasLabel = true,
                        Label = label,
                        LabelAddress = labelAddress,
                        Instruction = LanguageDefinition.Instructions.Find(x => x.TextDisplay == instruction.ToUpper()),
                        Hex = new HexString(operationHex),
                        TargetAddress = target,
                    });
                }
                else
                {
                    _logger.Error($"Unknown label '{label}' at line {lineNumber}");
                }
            }
            else
            {
                _logger.Error($"Unknown label '{label}' at line {lineNumber}");
                return;  // If label is unknown, don't continue processing
            }
        }
        private bool TryParseAddress(string line, ref uint currentAddress, int lineNumber, List<SyntaxItem> syntaxItems)
        {
            if (!IsAddressSyntax(line)) { return false; }

            var match = AddressRegex.Match(line);
            string addressHex = match.Groups[1].Value.ToUpper();
            currentAddress = Convert.ToUInt32(addressHex, 16);

            syntaxItems.Add(new AddressSyntaxItem
            {
                LineNumber = lineNumber,
                LineText = line,
                Address = currentAddress,
                AddressHex = new HexString(addressHex)
            });

            return true;
        }
        private bool TryParseHexcode(string line, ref uint currentAddress, int lineNumber, List<SyntaxItem> syntaxItems)
        {
            if (!IsHexcodeSyntax(line)) { return false; }

            var match = HexcodeRegex.Match(line);
            string hexValue = match.Groups[1].Value;

            syntaxItems.Add(new HexCodeSyntaxItem
            {
                LineNumber = lineNumber,
                LineText = line,
                Address = currentAddress,
                AddressHex = new HexString($"{currentAddress:X8}"),
                Value = new HexString(hexValue)
            });

            currentAddress += 4;
            return true;
        }
        private bool TryParseSetReg(string line, ref uint currentAddress, int lineNumber, List<SyntaxItem> syntaxItems)
        {

            if(!IsSetRegSyntax(line)) { return false; }

            var match = AddressRegex.Match(line);
            string register = match.Groups["reg"].Value;
            string valueHex = match.Groups["value"].Value;

            string[] parts = line.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            var reg = parts[1];
            string hex = parts[2].Trim('$');

            string asm = @$"lui {reg} ${hex.Substring(0, 4)}";
            var operationHex = _disassembler.Disassemble(asm);

            string asm2 = $@"addiu {reg}, {reg}, ${hex.Substring(4, 4)}";
            string operationHex2 = _disassembler.Disassemble(asm2);

            // Create a SyntaxItem for the setreg instruction
            syntaxItems.Add(new SetRegSyntaxItem
            {
                LineNumber = lineNumber,
                LineText = line,
                Address = currentAddress,
                AddressHex = new HexString($"{currentAddress:X8}"),
                Operations = new List<OperationSyntaxItem>()
                {
                    new OperationSyntaxItem()
                    {
                        LineNumber = lineNumber,
                        LineText = line,
                        Address = currentAddress,
                        AddressHex = new HexString($"{currentAddress:X8}"),
                        Hex = new HexString(operationHex),
                        Instruction = LanguageDefinition.Instructions.Find(x => x.TextDisplay == "LUI"),
                    },
                    new OperationSyntaxItem()
                    {
                        LineNumber = lineNumber,
                        LineText = line,
                        Address = currentAddress,
                        AddressHex = new HexString($"{currentAddress + 4:X8}"),
                        Hex = new HexString(operationHex2),
                        Instruction = LanguageDefinition.Instructions.Find(x => x.TextDisplay == "ADDIU"),
                    }
                }
            });

            currentAddress += 8;
            return true;
        }
        private bool TryParseLabel(string line, ref uint currentAddress, int lineNumber, List<SyntaxItem> syntaxItems)
        {
            if (!IsDefineLabelSyntax(line)) {  return false; }

            var match = DefineLabelRegex.Match(line);

            string label = match.Groups["label"].Value;

            syntaxItems.Add(new LabelSyntaxItem
            {
                LineNumber = lineNumber,
                LineText = line,
                Address = currentAddress,
                AddressHex = new HexString($"{currentAddress:X8}"),
                Text = label
            });

            return true;
        }
        private bool TryParseString(string line, ref uint currentAddress, int lineNumber, List<SyntaxItem> syntaxItems)
        {
            if (!IsStringSyntax(line)) { return false; }

            var match = StringRegex.Match(line);
            string text = match.Groups[1].Value;
            byte[] bytes = Encoding.ASCII.GetBytes(text + "\0");

            // Pad to 4-byte alignment
            int paddedLength = (bytes.Length + 3) / 4 * 4;
            Array.Resize(ref bytes, paddedLength);

            var syntaxItem = new StringSyntaxItem
            {
                LineNumber = lineNumber,
                LineText = line,
                Address = currentAddress,
                AddressHex = new HexString($"{currentAddress:X8}"),
                Text = text
            };

            // Process 4 bytes at a time
            for (int i = 0; i < bytes.Length; i += 4)
            {
                uint word =
                    ((uint)bytes[i + 0] << 0) |
                    ((uint)bytes[i + 1] << 8) |
                    ((uint)bytes[i + 2] << 16) |
                    ((uint)bytes[i + 3] << 24);

                // Add the SyntaxItem for the string
                syntaxItem.HexCodeSyntaxItems.Add(new HexCodeSyntaxItem()
                {
                    LineNumber = lineNumber,
                    LineText = line,
                    Address = currentAddress,
                    AddressHex = new HexString($"{currentAddress:X8}"),
                    Value = new HexString($"{word:X8}")
                });

                if (!syntaxItems.Exists(x => x.LineNumber == syntaxItem.LineNumber))
                {
                    syntaxItems.Add(syntaxItem);
                }

                currentAddress += (uint)bytes.Length;
            }

            // Update the address (length of the string + 1 for the quotes)
            currentAddress += (uint)(text.Length + 1); // Typically, strings are null-terminated in certain formats

            return true;
        }

        private bool TryParseMultilineCommentStartOrContinue(string line, int lineNumber, ref bool inMultiLineComment, ref int multiLineStart, StringBuilder multiLineBuffer, List<SyntaxItem> syntaxItems)
        {
            if (inMultiLineComment)
            {
                // If we are inside a multi-line comment, keep appending until we find the end comment tag
                multiLineBuffer.AppendLine(line);
                if (line.Contains("*/"))
                {
                    inMultiLineComment = false;
                    syntaxItems.Add(new MultiLineComment
                    {
                        LineNumber = multiLineStart,
                        LineText = multiLineBuffer.ToString(),
                        Value = multiLineBuffer.ToString()
                    });
                    multiLineBuffer.Clear();  // Clear the buffer after adding the comment
                }
                return true;
            }
            else if (line.StartsWith("/*"))
            {
                // Starting a multi-line comment
                inMultiLineComment = true;
                multiLineStart = lineNumber;
                multiLineBuffer.AppendLine(line);

                if (line.Contains("*/"))
                {
                    // If the start and end are on the same line, add it right away
                    inMultiLineComment = false;
                    syntaxItems.Add(new MultiLineComment
                    {
                        LineNumber = multiLineStart,
                        LineText = multiLineBuffer.ToString(),
                        Value = multiLineBuffer.ToString()
                    });
                    multiLineBuffer.Clear();
                }
                return true;
            }

            return false;
        }
        private bool TryParseSingleLineComment(string line, int lineNumber, List<SyntaxItem> syntaxItems)
        {
            if (!line.StartsWith("//")) return false;

            syntaxItems.Add(new SingleLineComment
            {
                LineNumber = lineNumber,
                LineText = line,
                Value = line.Replace("//", "").Trim()
            });
            return true;
        }
        private bool TryParseMem(string line, ref uint currentAddress, int lineNumber, List<SyntaxItem> syntaxItems)
        {
            if (IsMemorySyntax(line))
            {
                var match = MemoryRegex.Match(line);

                string offset = match.Groups[1].Value;  // Memory address, e.g., "0x100"
                string regName = match.Groups[2].Value;     // Register name, e.g., "t0"
                string assignmentOperand = match.Groups[4].Value;  // Operand for assignment, e.g., "0x01"
                string operation = match.Groups[5].Value;    // Operation (+, -, *, /)
                string operationOperand = match.Groups[6].Value;  // Operand for operation (optional)

                if (!string.IsNullOrEmpty(assignmentOperand))
                {
                    // It's an assignment
                    var MemorySyntaxItem = new MemorySyntaxItem()
                    {
                        LineNumber = lineNumber,
                        LineText = line,
                        Offset = offset,
                        Register = regName,
                        OperationOperand = operationOperand,
                        AssignmentOperand = assignmentOperand,
                        Operation = "=",
                        Address = currentAddress,
                        AddressHex = new HexString($"{currentAddress:X8}")
                    };

                    ProcessMemorySyntaxItem(MemorySyntaxItem);
                    syntaxItems.Add(MemorySyntaxItem);
                }
                else if (!string.IsNullOrEmpty(operation) && !string.IsNullOrEmpty(operationOperand))
                {
                    // It's an operation (e.g., +=, -=)
                    var MemorySyntaxItem = new MemorySyntaxItem()
                    {
                        LineNumber = lineNumber,
                        LineText = line,
                        Offset = offset,
                        Register = regName,
                        OperationOperand = operationOperand,
                        AssignmentOperand = assignmentOperand,
                        Operation = operation,
                        Address = currentAddress,
                        AddressHex = new HexString($"{currentAddress:X8}")
                    };

                    ProcessMemorySyntaxItem(MemorySyntaxItem);
                    syntaxItems.Add(MemorySyntaxItem);
                }

                return true;
            }

            return false;
        }
        public void ProcessMemorySyntaxItem(MemorySyntaxItem syntaxItem)
        {
            string offset = syntaxItem.Offset;
            string regName = syntaxItem.Register;
            string operation = syntaxItem.Operation;
            string operand = !string.IsNullOrEmpty(syntaxItem.AssignmentOperand) ? syntaxItem.AssignmentOperand : syntaxItem.OperationOperand;

            // Ensure valid register name
            if (string.IsNullOrWhiteSpace(regName) || !ValidationHelper.IsValidRegisterName(regName))
            {
                throw new ArgumentException($"Invalid register name: {regName}");
            }

            // Parse operand
            uint operandValue = ParseOperand(operand);

            // Ensure valid operation
            if (string.IsNullOrEmpty(operation) || !ValidationHelper.IsValidOperation(operation))
            {
                throw new ArgumentException($"Invalid operation: {operation}");
            }

            // Ensure memory address is in valid format (0x prefix)
            if (string.IsNullOrEmpty(offset) || !offset.StartsWith("0x"))
            {
                throw new ArgumentException($"Invalid offset: {offset}");
            }

            // Clean and pad memory address
            string paddedMemAddress = offset.Substring(2).PadLeft(4, '0'); // Remove 0x and pad to 4 digits

            var mipsCode = string.Empty;

            if (operation != "=")
            {
                // Load value from memory into register
                mipsCode = $"lw t9, ${paddedMemAddress}({regName})\n";
            }

            // Perform the operation (+=, -=, etc.)
            mipsCode += operation switch
            {
                "=" => $"addiu t9, zero, ${operandValue:X4}\n",
                "+=" => $"addi t9, t9, ${operandValue:X4}\n",  // t0 += operandValue
                "-=" => $"subi t9, t9, ${operandValue:X4}\n",  // t0 -= operandValue
                "*=" => $"mul t9, t9, ${operandValue:X4}\n",   // t0 *= operandValue
                "/=" => $"div t9, t9, ${operandValue:X4}\n",   // t0 /= operandValue
                _ => throw new ArgumentException($"Unsupported operation: {operation}")
            };

            // Store the result back into memory
            mipsCode += $"sw t9, ${paddedMemAddress}({regName})";

            foreach (var item in mipsCode.Split("\n"))
            {
                var hex = _disassembler.Disassemble(item);

                syntaxItem.Operations.Add(new OperationSyntaxItem()
                {
                    LineNumber = syntaxItem.LineNumber,
                    LineText = syntaxItem.LineText,
                    Address = syntaxItem.Address,
                    AddressHex = syntaxItem.AddressHex,
                    Hex = new HexString($"{hex:X8}"),
                    Instruction = LanguageDefinition.Instructions.Find(x => x.TextDisplay == item.Split(" ")[0].ToUpper()),
                });
            }
        }

        // Helper method to parse operand (either hexadecimal or decimal)
        private uint ParseOperand(string operand)
        {
            uint operandValue = 0;

            if (operand.Contains("0x"))
            {
                // Convert hex to decimal
                operandValue = Convert.ToUInt32(operand.Substring(2), 16);
            }
            else
            {
                // Parse as decimal
                if (!uint.TryParse(operand, out operandValue))
                {
                    throw new ArgumentException($"Invalid operand: {operand}");
                }
            }

            return operandValue;
        }
    }
}
