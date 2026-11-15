# Crow's Baby Tracker

React and TypeScript frontend, built with Vite. Original design: [Figma](https://www.figma.com/design/04WJdQ35WNHv82lSP3CIWX/Baby-Care-Data-Logger).

Use Node.js 22.12+ and install dependencies with `npm ci` in this directory.

```sh
npm run dev         # Development server
npm run typecheck   # Strict TypeScript checks, including test files
npm run lint        # ESLint and React hook dependency checks
npm test            # Component and calculation regression tests
npm run build       # Type check, then create the production bundle
npm run check       # Schema drift check, lint, tests, and production build
```

## API and form types

`src/types/api.generated.ts` is generated directly from the backend Pydantic create,
update, response, and analytics schemas. `src/types/api.ts` re-exports the public
names used by the UI. Do not edit generated types manually.

```sh
npm run types:generate  # Regenerate after changing backend schemas or enums
npm run types:check     # Fail if committed types differ from the backend
```

These commands require the backend Python dependencies. The launcher uses the
repository's `.venv`, or `PYTHON` if set, falling back to `python`. It imports the
schemas without starting the API or querying the database.

Request fields with defaults can be omitted. Nullable fields also accept `null`;
response fields are present, with `null` for missing values. UUIDs and datetimes
are strings; growth measurement dates are `YYYY-MM-DD`. Numeric draft inputs
remain strings in `src/types/forms.ts` until converted for submission. Enum
values come from the generated contracts. Numeric bounds, date validity, and
cross-field validation remain enforced by Pydantic at runtime.

The layout renders the route tree once. Mobile and desktop navigation surround
the same page; resizing preserves its state. Layout CSS lives in
`src/styles/app-layout.css` because the existing utility stylesheet is precompiled.
