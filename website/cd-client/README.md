# CodeDesigner UI (cd-client)

Angular-based web client for CodeDesigner. Provides the modern UI used by the solution (dashboards, templates, and demo pages).

## Purpose
- Visual frontend for the CodeDesigner toolset (preview, templates, boards, file manager, etc.).
- Demo pages under `src/app/pages` (e.g., `template/extra`).
- Serves as the primary web UI for users and testers.

## Tech stack
- Angular (CLI v18)
- TypeScript
- Bootstrap 5 + custom theme assets in `src/assets`

## Prerequisites
- Node LTS (recommended 18+)
- npm or yarn
- Angular CLI (local or global)

## Setup (local dev)
1. Open a terminal in `website/cd-client`.
2. Install deps:
   - `npm install` (or `yarn`)
3. Run dev server:
   - `npm run start` or `ng serve`
4. Open `http://localhost:4200/`

## Build / Production
- `npm run build` (defaults to development)
- `npm run build -- --configuration production` (production)
- Output: `dist/`

## Testing
- Unit tests: `npm run test` (Karma/Jasmine if present)
- E2E tests: configure your preferred runner (Cypress/Protractor) if needed

## Integration notes
- API base URL should be configured in `src/environments/environment*.ts`.
- Keep DTOs aligned with backend `.NET` projects. Consider using OpenAPI to generate TypeScript clients.

## Contributing
- Follow Angular style guide and the repository lint/format rules.
- Add documentation for new pages/components in `docs/` if necessary.

## Useful commands
- `npm run lint`
- `npm run format`
- `npm run build`
- `npm run start`
