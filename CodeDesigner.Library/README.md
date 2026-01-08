# CodeDesigner.Library

Shared utilities, models, and helper components used by the other projects in the CodeDesigner solution.

## Purpose
- Provide shared DTOs, helper functions, and common domain types.
- Central place for cross-cutting concerns that are not tied to parsing or CLI.

## Typical contents
- Domain models used by both `ConsoleApp` and `Languages`
- Utility functions (IO helpers, path resolvers, extensions)
- Shared constants and enums

## Build
- Requires .NET 9.
- Build with: `dotnet build CodeDesigner.Library`

## Usage
- Add a project reference to `CodeDesigner.Library` from projects that need shared types: