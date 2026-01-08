# VS Code - `cds-language` Extension

Language support extension for the CodeDesigner `.cds` files: syntax highlighting, language grammar, and language server integration.

## Purpose
- Provide syntax highlighting, basic IntelliSense, and diagnostics for `.cds` files.
- Optionally host a Language Server (LSP) for stronger analysis (hover, go-to, diagnostics).

## Tech stack
- TextMate grammar (for highlighting) and/or Monarch tokenizer
- TypeScript for extension and optional language server
- `vscode-languageclient` / `vscode-languageserver` for LSP implementation

## Prerequisites
- Node LTS (18+)
- `npm` or `yarn`
- VS Code

## Local development
1. Install deps:
   - `npm install`
2. Launch extension host (F5) to test highlighting and language features.
3. Place sample `.cds` files in the test workspace and iterate on grammar and server behavior.

## Language Server (optional)
- Implement a separate Node/.NET language server that exposes:
  - Diagnostics (parsing errors)
  - Hover & completion for labels/ops
  - Go-to-definition for labels
- Use `vscode-languageclient` in the extension to attach to the server.

## Packaging & Publishing
- `vsce package`
- `vsce publish` (requires publisher & token)

## Recommended contributions
- Improve grammar to cover `setreg`, `hexcode`, `include`, labels, and `call` syntax.
- Add tests for tokenization and LSP responses.
- Provide sample snippets and a recommended formatter (or integration with `prettier` if suitable).

## Integration
- When using the extension with the workspace, point CLI tasks to the console app so "Fix in Console" workflows are smooth.
- Include recommended workspace extensions in `.vscode/extensions.json` to suggest `cds-language` and `cds-assembler`.
