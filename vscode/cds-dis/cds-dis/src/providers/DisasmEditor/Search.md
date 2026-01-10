# MIPS Disassembler Search Modes - Complete Guide

## Overview
The disassembler includes 4 distinct search modes, each optimized for different use cases when analyzing PlayStation 2 MIPS binary files.

---

## 1. TEXT SEARCH (Aa Button)

### Purpose
Case-insensitive text search across all disassembled instruction fields.

### Use Cases
- Finding specific instructions (e.g., "addiu", "jal")
- Locating register usage (e.g., "sp", "ra", "v0")
- Searching comments and labels
- Quick general-purpose searching

### Search Scope
Searches in these fields:
- **Address**: Memory addresses (e.g., "00001234")
- **Bytes**: Hex representation (e.g., "27 BD FF F0")
- **Label**: Assembly labels (e.g., "main:")
- **Opcode**: Instruction mnemonic (e.g., "addiu")
- **Arguments**: Operands (e.g., "sp, sp, $FFF0")
- **Comments**: Analysis comments (e.g., "; ptr to function")

### Examples
```
Query: "addiu"
Finds: All add immediate unsigned instructions

Query: "sp"
Finds: All stack pointer references in any field

Query: "jal"
Finds: All function call instructions

Query: "ptr"
Finds: All pointer references in comments
```

### Algorithm
1. Convert query to lowercase
2. Convert each field to lowercase
3. Find all substring matches
4. Record position and length for highlighting
5. Case-insensitive comparison throughout

### Performance
⚠️ **SLOW** - Must disassemble every instruction in the file

---

## 2. BYTE PATTERN SEARCH (0x Button)

### Purpose
Search for exact hexadecimal byte sequences in the raw binary file.

### Use Cases
- Finding specific instruction encodings
- Locating opcode patterns
- Searching for data structures
- Finding exact byte sequences

### Input Format
Accepts flexible formats:
```
Space-separated:    12 34 AB CD
With 0x prefix:     0x12 0x34 0xAB 0xCD
Comma-separated:    12,34,AB,CD
Mixed:              0x12 34, AB CD
```

### Examples
```
Query: "27 BD FF F0"
Finds: addiu sp, sp, -16 (common stack allocation)

Query: "3C 01 80 00"
Finds: lui at, $8000 (load upper immediate)

Query: "0C"
Finds: All JAL instructions (opcode 0x03 = 0000 11xx)

Query: "00 00 00 00"
Finds: NOP instructions or null data
```

### Algorithm
1. Parse hex string into byte array
2. Validate each byte (must be 0x00-0xFF)
3. Scan entire file buffer sequentially
4. Compare byte-by-byte with pattern
5. Record matches at instruction boundaries
6. Skip overlapping matches

### Performance
⚡ **FAST** - Direct binary search, no disassembly required

### Validation
- Each byte must be 1-2 hexadecimal digits
- Invalid characters show error: "Invalid byte pattern"
- Empty pattern returns no results

---

## 3. STRING SEARCH ("ab" Button)

### Purpose
Search for ASCII/UTF-8 text strings embedded in the binary file.

### Use Cases
- Finding function names in debug symbols
- Locating string literals
- Finding copyright notices
- Searching for embedded text data

### Characteristics
- **Case-sensitive** (unlike text mode)
- Searches raw binary data
- No null-terminator required
- UTF-8 encoding support

### Examples
```
Query: "main"
Finds: String "main" in binary (function name, debug symbol)

Query: "Copyright"
Finds: Copyright strings in ROM data

Query: "Error"
Finds: Error message strings

Query: "Sony"
Finds: Developer/publisher strings
```

### Algorithm
1. Convert query string to UTF-8 bytes
2. Scan entire file buffer
3. Compare byte sequences
4. Record matches at instruction boundaries
5. Match is exact (no partial matches)

### Performance
⚡ **FAST** - Direct binary search like byte mode

### Encoding Details
```
Query: "A"
Bytes: [0x41]

Query: "Hello"
Bytes: [0x48, 0x65, 0x6C, 0x6C, 0x6F]

Query: "日本"
Bytes: [0xE6, 0x97, 0xA5, 0xE6, 0x9C, 0xAC] (UTF-8)
```

---

## 4. REGEX SEARCH (.* Button)

### Purpose
Advanced pattern matching using regular expressions.

### Use Cases
- Complex pattern searches
- Finding instruction sequences
- Matching patterns in arguments
- Advanced filtering

### Regex Flags
- **g**: Global (find all matches)
- **i**: Case-insensitive

### Examples

#### Basic Patterns
```
Query: "lw.*sp"
Finds: Load word instructions using stack pointer
Match: "lw a0, $0010(sp)"

Query: "^addiu"
Finds: Lines starting with addiu
Match: "addiu sp, sp, -16"

Query: "(jal|jalr)"
Finds: All function calls (JAL or JALR)
Match: "jal $00001234"
Match: "jalr ra"
```

#### Advanced Patterns
```
Query: "\$[0-9A-F]{8}"
Finds: All 32-bit hex addresses
Match: "$00001234"
Match: "$80000000"

Query: "sp,\s*sp,\s*-"
Finds: Stack allocations (sp = sp - X)
Match: "addiu sp, sp, -16"
Match: "addiu sp,sp,-32"

Query: "lw\s+\w+,\s*\$[0-9A-F]+\(sp\)"
Finds: Load from stack with hex offset
Match: "lw a0, $0010(sp)"
```

#### Metacharacters
- `.` = Any character
- `*` = Zero or more
- `+` = One or more
- `?` = Zero or one
- `^` = Start of line
- `$` = End of line
- `\s` = Whitespace
- `\w` = Word character
- `\d` = Digit
- `[abc]` = Character class
- `(a|b)` = Alternation

### Algorithm
1. Compile regex with 'gi' flags
2. Create fresh instance per field
3. Execute regex.exec() in loop
4. Record all matches
5. Handle zero-length matches
6. Catch and ignore invalid regex

### Performance
⚠️ **SLOW** - Must disassemble every instruction + regex overhead

### Error Handling
Invalid regex syntax fails silently (returns no matches)

---

## Search Architecture

### Backend Processing (TypeScript)
1. Receives search request from frontend
2. Determines search strategy based on mode:
   - **Byte/String**: Direct buffer search
   - **Text/Regex**: Disassemble-then-search
3. Scans entire file (not just visible page)
4. Returns array of match objects:
   ```typescript
   {
     instructionIndex: number,  // 0-based instruction index
     address: number,           // Memory address
     field: string,             // 'addr'|'bytes'|'op'|'args'|etc
     start: number,             // Character position
     length: number             // Match length
   }
   ```

### Frontend Display (HTML/JS)
1. Receives match array
2. Stores in state
3. Jumps to first match
4. Highlights matches in visible rows:
   - **All matches**: Orange background
   - **Current match**: Brighter orange
5. Updates counter: "X of Y"

### Navigation
- **Enter / F3**: Next match
- **Shift+Enter / Shift+F3**: Previous match
- **↑/↓ Buttons**: Manual navigation
- **Wrapping**: After last → first, before first → last

---

## Performance Comparison

| Mode   | Speed | Disassembly Required | Use Case |
|--------|-------|---------------------|----------|
| Text   | Slow  | Yes (all instructions) | Quick searches |
| Bytes  | Fast  | No (binary scan) | Exact patterns |
| String | Fast  | No (binary scan) | Text in data |
| Regex  | Slow  | Yes + regex overhead | Complex patterns |

### Optimization Tips
1. Use **byte mode** for finding specific opcodes
2. Use **string mode** for finding embedded text
3. Use **text mode** for quick register/instruction searches
4. Use **regex mode** only when pattern matching is needed

---

## Visual Feedback

### Highlighting Colors
```css
.search-match {
  background: #613214;  /* Row background - all matches */
}

.search-current {
  background: #4e3c1e;  /* Row background - current match */
}

.search-match-highlight {
  background: #f9826c;  /* Text highlight - all matches */
  color: #000;
}

.search-current-highlight {
  background: #ea5c00;  /* Text highlight - current match */
  color: #fff;
}
```

### UI Elements
- **Search input**: Border turns red for invalid byte patterns
- **Clear button (×)**: Appears when text is entered
- **Counter**: Shows "X of Y" or "No results"
- **Navigation buttons**: Disabled when no results

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+F / Cmd+F | Open search panel |
| Enter | Search / Next match |
| Shift+Enter | Previous match |
| F3 | Next match |
| Shift+F3 | Previous match |
| Escape | Close search panel |

---

## Implementation Notes

### Memory Efficiency
- Entire file is loaded in backend (Node.js)
- Only match positions stored in frontend
- Page-based rendering unchanged
- Matches highlighted only when visible

### Match Persistence
- Matches remain highlighted when scrolling
- Current match updates when navigating
- Clearing search removes all highlights
- Changing modes triggers new search

### Edge Cases Handled
1. Invalid regex → silent fail, no matches
2. Invalid byte pattern → error message
3. Zero-length regex matches → prevented
4. Overlapping byte matches → skipped
5. No matches → "No results" message
6. Empty query → clears search

---

## Common Search Patterns

### Finding Function Prologues
```regex
Text: "addiu sp, sp, -"
Finds: Functions that allocate stack frames
```

### Finding Function Calls
```regex
Regex: "^jal "
Finds: All JAL (jump and link) instructions
```

### Finding Immediate Values
```regex
Regex: "\$[0-9A-F]{4}"
Finds: All 16-bit immediate values
```

### Finding Memory Loads
```regex
Text: "lw"
Finds: All load word instructions
```

### Finding Stack Operations
```regex
Text: "(sp)"
Finds: All stack-relative memory operations
```