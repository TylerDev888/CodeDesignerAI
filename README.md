# CodeDesignerAI VSCode [![CI](https://github.com/TylerDev888/CodeDesignerAI/actions/workflows/ci.yml/badge.svg)](https://github.com/TylerDev888/CodeDesignerAI/actions/workflows/ci.yml)
![CodeDesigner screenshot](./Screenshot.png)

## Description
A MIPS64 (PS2 Emotion Engine) assembler / disassembler with extended pseudo-commands and directives for custom CDS scripts. Used to create custom patches for the playstation 2. Make sure to use github co-pilot with this vs code extension. 

## Projects and READMEs
- CLI & tooling
  - [CodeDesigner.ConsoleApp](CodeDesigner.ConsoleApp/ReadMe.md) — Console front-end / CLI
  - [CodeDesigner.Languages](CodeDesigner.Languages/README.md) — Parsers, models, `CDSFile`
  - [CodeDesigner.Library](CodeDesigner.Library/README.md) — Shared utilities and domain models
  - [CodeDesigner.OpenAI](CodeDesigner.OpenAI/README.md) — OpenAI integration helpers
- Web & editor
  - [website/cd-client](website/cd-client/README.md) — Angular UI client
  - [vscode/cds-assembler](vscode/cds-assembler/README.md) — VS Code extension for assembler tooling
  - [vscode/cds-language](vscode/cds-language/README.md) — VS Code language support for `.cds` files

If a link points to a missing README, open the target folder and create the `README.md` file there.

## Legend (quick reference)
- [D] Development setup — how to run locally (install, start, test)  
- [B] Build / Packaging — produce distributables or publish artifacts  
- [I] Integration — how projects connect (APIs, CLI, extension tasks)  
- [C] Contributing — guidelines for fixes and features

Each project README contains sections marked with the letters above when applicable.

## Recommended workflow
1. Open the project README for the area you will work on (links above).  
2. For UI work: run the web client in `website/cd-client` (`npm install` then `npm run start`).  
3. For editor extensions: open the `vscode/` folder in VS Code and use F5 to test.  
4. For CLI behavior: run `dotnet run --project CodeDesigner.ConsoleApp -- <verb> [options]`.

## Contacts & contribution
- Keep README updates in sync with code changes.  
- Add changelogs or release notes where appropriate.  
- Prefer small, focused PRs and include test or verification steps in the PR description.

