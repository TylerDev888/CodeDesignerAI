# CodeDesigner.ConsoleApp
	
Console front-end for the CodeDesigner toolset. Provides a command-line interface (CLI) that wires together language parsers, libraries, and external integrations.


## 1. Basic usage structure
```powershell
CodeDesigner <Verb> [Options]
```

## 2. Detailed Usage
```powershell

CodeDesigner MipsR9000 
	options: 
			 -a --Assemble
			 -h --OperationHex	 
			 -d --Disassemble
			 -o --Operation
			 
CodeDesigner Pcsx2
	options: 
			 -r --ReadOperation
			 -o --Operation
			 -w --WriteOperation
			 -a --Address
			 -s --StartProcess
			 -i --InstallAndConfig
			 -p --Pcsx2 version

CodeDesigner CDL
	options:
			 -c --Compile
			 -d --Decompile
			 -s --Source

CodeDesigner CheatEngine 
```
## Purpose
`CodeDesigner.ConsoleApp` is the executable entrypoint for:
- Compiling / decompiling `.cds` files (CDL verb)
- Running MIPS-related tooling (MipsR9500)
- Interacting with emulator tooling (Pcsx2)
- Cheat engine helpers and memory dumps

It orchestrates the other projects in the repository and is intended to be the primary developer-facing CLI.

## Prerequisites
- .NET 9 SDK
- (Optional) Access to any local resource files in `Resources\` (these are copied to output by the project)

## Build and run
From the repository root:
- Build: `dotnet build CodeDesigner.ConsoleApp`
- Run (debug): `dotnet run --project CodeDesigner.ConsoleApp -- <verb> [options]`

Example:
- `dotnet run --project CodeDesigner.ConsoleApp -- CDL -c -s Resources\test.cds`

## Usage (high-level)
The app uses `CommandLineParser` and exposes verbs. Typical pattern:
- `CodeDesigner <Verb> [Options]`

Primary verbs (examples from codebase):
- `MipsR9500` — MIPS assembly helpers
- `CodeDesignerLanguage` (CDL) — compile/decompile `.cds` files
- `Pcsx2` — emulator-related operations
- `CheatEngine` — cheat-engine helpers
- `MemoryDump` — dump/inspect memory artifacts

See the `Program.cs` and verb classes in `CodeDesigner.ConsoleApp\Verbs\` for command-line options and behavior.

## Logging & Debugging
- Uses `CodeDesigner.Languages.Logging.ConsoleLogger` for output collection and console writes.
- When enumerating logger message collections, avoid mutating the same list during enumeration. Copy the list (e.g., `var copy = logger.Messages.ToList()`) before iterating if logging operations modify the same collection.

## Resources
- Included sample files are in `Resources\` and are configured to copy to output.

## Contributing
- Follow repository coding style (C# 10/11 idioms allowed; target framework is `.NET 9`).
- Add unit tests to appropriate test projects (if present) and update README where necessary.

## License
Include your project license here (e.g., MIT). Replace this section with the chosen LICENSE file.
