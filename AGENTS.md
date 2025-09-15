# Repository Guidelines

## Project Structure & Module Organization
- `src/` application code: `components/` (UI, PascalCase), `views/` (pages), `stores/` (Pinia), `services/` (API clients), `utils/`, `constants/`, `composables/` (useX), `router/`, `styles/`, `assets/`.
- `public/` static assets (served at root); `index.html` is the Vite entry.
- `docs/` and `api文档/` contain product and API documentation.
- Tooling and ops: `vite.config.js`, `tailwind.config.js`, `postcss.config.js`, `docker-compose.yml`, `nginx/`, `deploy*.sh`.

## Build, Test, and Development Commands
- `npm install` install dependencies (prefer npm for lockfile consistency).
- `npm run dev` start Vite dev server with API proxy.
- `npm run build` production build; `npm run build-prod` forces production mode.
- `npm run preview` serve the built app locally.
- `npm run lint` ESLint (Vue + JS); `npm run format` Prettier (with Tailwind class sorting).
- `npm run serve-prod` runs `proxy-server` if present (optional).

## Coding Style & Naming Conventions
- Formatting via Prettier; linting via ESLint (`plugin:vue/vue3-essential`, `eslint:recommended`). Run lint/format before commits.
- Indentation 2 spaces; avoid unused variables; prefer small, pure utilities.
- Components: PascalCase filenames and names (e.g., `MainLayout.vue`).
- Composables: camelCase and `useX` pattern (e.g., `useMessageQueue.js`).
- Stores: Pinia `useXStore` in `src/stores/`. Constants live in `src/constants/` with UPPER_SNAKE_CASE exports.

## Testing Guidelines
- No automated test runner is configured yet. Validate changes via `npm run dev` with clear console and stable network calls.
- If adding tests, use Vitest + Vue Test Utils; place files under `src/**/__tests__/` or `*.spec.js` (e.g., `MainLayout.spec.js`). Keep tests fast and focused.

## Commit & Pull Request Guidelines
- Follow Conventional Commits: `feat`, `fix`, `refactor`, `docs`, `chore`, `build`, `test` with optional scope (e.g., `feat(ui): ...`). Use imperative, present tense.
- PRs must include: concise description, linked issues (e.g., `#123`), screenshots/GIFs for UI changes, and notes on breaking changes/migrations.
- Ensure `npm run lint` and `npm run format` pass; describe manual test steps.

## Security & Configuration Tips
- Configure endpoints via `.env.local`: `VITE_API_TARGET`, `VITE_BACKEND_API_TARGET`, `VITE_PRICE_API_TARGET`. Do not commit secrets.
- Large uploads are enabled in `vite.config.js`; align backend timeouts accordingly.
- Do not commit `node_modules/` or generated artifacts; prefer `.env.local` for machine-specific settings.

