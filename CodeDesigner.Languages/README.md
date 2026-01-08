# CodeDesigner.Languages

Library containing language models, parsers, and utilities used by the ConsoleApp to parse and transform CodeDesigner language files (`.cds`) and other domain-specific artifacts.

## Purpose
- Parse `.cds` source files into syntax item models (e.g., `OperationSyntaxItem`, `IncludeSyntaxItem`, etc.)
- Provide `CDSFile` abstraction for reading, including, and producing debug output
- Provide `ConsoleLogger` and logging primitives used across the solution

## Key components
- `CDSFile` — read and compose source, resolve includes, expose `Read()` and `ToDebugOutput()` methods
- Syntax item types — typed representations of parsed lines (operations, hex blocks, memory blocks, etc.)
- `ConsoleLogger` — collects messages into `Messages` and writes to console

## Thread-safety & common pitfalls
- `ConsoleLogger.Messages` is a `List<string>` and not thread-safe. If you need to iterate messages while logging, iterate a snapshot: `var snapshot = logger.Messages.ToList()`.
- `CDSFile.ToDebugOutput()` appends included file `Read()` results to the calling `syntaxItems`. Be aware that recursive includes or circular includes may produce unexpected sets — validate include paths.

## Usage (programmatic)