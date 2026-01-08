# VS Code - `cds-assembler` Extension

VS Code extension that provides project scaffolding, tasks, or tooling for assembling `.cds` sources (CodeDesigner assembler helpers).

## Purpose
- Provide developer convenience commands, tasks, and workspace snippets to run the CodeDesigner assembler from inside VS Code.
- Enable build / run tasks that call the `CodeDesigner.ConsoleApp` or other CLI tools.

## Tech stack
- TypeScript (VS Code Extension API)
- Node.js (for packaging tools like `vsce` / `@vscode/vsce`)
- `package.json` declares extension contributions (commands, tasks, snippets)

## Prerequisites
- Node LTS (18+)
- `npm` or `yarn`
- VS Code
- `vsce` (optional, for packaging): `npm i -g vsce`

## Local development
1. Install dependencies:
   - `npm install`
2. Open folder in VS Code.
3. Launch extension host:
   - Press F5 to open a new Extension Development Host window.
4. Run and test commands via the Command Palette.

## Packaging & Publishing
- Package: `vsce package`
- Publish (requires publisher set in `package.json` and VS Code Marketplace token):
  - `vsce publish`

## Recommended contributions
- Add tasks for common flows (assemble, compile, run).
- Add snippets for `.cds` syntax if not covered by the language extension.
- Add tests for command handlers.

## Integration
- Use workspace settings to configure path to `dotnet` or to `CodeDesigner.ConsoleApp`.
- Provide a task that runs: `dotnet run --project ../CodeDesigner.ConsoleApp -- CDL -c -s ${file}`
