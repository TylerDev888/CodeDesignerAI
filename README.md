# CodeDesigner - Project README Index

This root README links the project-level READMEs and provides a small legend to help navigate the repository.

## Projects and READMEs
- `CodeDesigner.ConsoleApp` — CLI front-end
  - See: `CodeDesigner.ConsoleApp/ReadMe.md`
- `CodeDesigner.Languages` — Parsers, models, and `CDSFile`
  - See: `CodeDesigner.Languages/README.md`
- `CodeDesigner.Library` — Shared utilities and models
  - See: `CodeDesigner.Library/README.md`
- `CodeDesigner.OpenAI` — OpenAI integration helpers
  - See: `CodeDesigner.OpenAI/README.md`
- Web & editor projects:
  - `website/cd-client` — Angular UI client (see `website/cd-client/README.md`)
  - `vscode/cds-assembler` — VS Code extension for assembler tooling (see `vscode/cds-assembler/README.md`)
  - `vscode/cds-language` — VS Code language support for `.cds` files (see `vscode/cds-language/README.md`)

## Legend (quick reference)
- [D] Development setup — steps to run locally (install, start, test)
- [B] Build / Packaging — how to produce distributable artifacts
- [I] Integration — how each project connects to others (APIs, CLI commands)
- [C] Contributing — guidelines for adding features or fixes

Use the first letter to identify sections in each project README:
- A README section prefixed with [D] contains developer setup instructions.
- Sections with [B] explain build and packaging steps.
- [I] lists how to integrate with other projects in the repo.
- [C] gives contribution guidance.

## Recommended workflow
1. Read the project README you will work on.
2. For UI work: run `website/cd-client` dev server with `npm run start`.
3. For extension/language work: open the `vscode/` folder in VS Code and use F5 to test.
4. For CLI behavior: run `dotnet run --project CodeDesigner.ConsoleApp -- <verb> [options]`

## Contributing
- Keep README updates in sync with code changes.
- Add changelogs or release notes for public consumption as features stabilize.

