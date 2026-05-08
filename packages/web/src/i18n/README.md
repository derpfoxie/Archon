# Web UI i18n conventions

This folder owns the React Web UI's internationalisation. The runtime is
[react-i18next](https://react.i18next.com/) wired up in `index.ts`. Resource
files live in `resources/<locale>.json`. `en.json` is the **source of truth**;
all other locales mirror its key shape.

## Supported locales

| Locale  | Status                                                               |
| ------- | -------------------------------------------------------------------- |
| `en`    | Source language. Every key starts here.                              |
| `zh-CN` | Manually translated.                                                 |
| `ja`    | Machine-generated baseline (see `ja.json` `_meta.disclaimer`).       |

Detection order: `localStorage[archon-lang]` → `navigator.language` → `en`. The
`<LanguageSwitcher>` in TopNav writes `archon-lang`.

## Key naming

```
{area}.{element}.{state}
```

- `nav.chat`, `settings.systemHealth`, `workflows.runCard.cancelTitle`
- `area` = the page or component family (`nav`, `settings`, `chat`, `workflows`,
  `dashboard`, `errors`, `language`)
- Reuse `common.*` for cross-cutting strings (see below) — never invent a fresh
  `Cancel` under your own namespace.

### Shared `common.*` keys

| Key                    | Use for                                                  |
| ---------------------- | -------------------------------------------------------- |
| `common.actions.*`     | Cancel / Save / Delete / Edit / Retry / Confirm / Add … |
| `common.status.*`      | running / completed / failed / cancelled / pending …    |
| `common.time.*`        | ms / s / m duration suffixes (used by `lib/format.ts`)  |
| `common.errors.*`      | failedTo, couldNotLoad, retrying, unknown                |
| `common.loading`       | "Loading..." spinner text                                |
| `common.empty`         | Generic empty-state                                      |

If you find yourself adding a key whose value duplicates a `common.*` value,
delete your key and use the shared one.

## Interpolation

- Use **named placeholders** only: `"{{count}} items"`, `"v{{version}} available"`.
- Never positional. Never embed HTML.
- Provide values at the call site: `t('nav.workflowsRunning', { count: n })`.

## Plurals (CLDR)

i18next maps to CLDR. English needs `_one` and `_other`:

```json
"workflowsRunning_one":   "{{count}} workflow running",
"workflowsRunning_other": "{{count}} workflows running"
```

Chinese and Japanese have a single plural form — write **only** `_other`. The
runtime selects it for any count.

## What NOT to translate

- API error codes / HTTP statuses — keep English (diagnostic).
- Workflow / command names from the API (`archon-fix-github-issue` etc.).
- File paths, env var names, JSON / YAML / shell snippets in placeholders.
- Console logs (`console.error`, `console.warn`) — server logs stay English.
- Lucide icon names / internal enum identifiers.

## Lib boundaries

Pure data libraries (`lib/format.ts`, `lib/workflow-metadata.ts`,
`lib/command-categories.ts`) **must not** import from `react-i18next`. They
return identifier keys (e.g. `'codeReview'`, `'github'`); the consuming
component does `t(\`workflows.categories.${cat}\`)`. This keeps the lib
testable without React context.

`lib/format.ts` accepts an optional `units: DurationUnits` argument so the
caller can pass localised `ms` / `s` / `m` strings via `t('common.time.X')`.

## Adding a new key

1. Add it to `resources/en.json` first.
2. Mirror the key in `zh-CN.json` (translate) and `ja.json` (machine-translate
   then refine — or leave English in pinch and CI will flag it).
3. Run `bun --filter @archon/web run check:i18n` — must pass.
4. Use it: `import { useTranslation } from 'react-i18next'; const { t } =
   useTranslation(); t('your.new.key')`.

`bun run validate` runs `check:i18n` automatically; CI fails on key drift.

## Adding a new locale

1. Create `resources/<locale>.json` with the same shape as `en.json`.
2. Add the locale code to `supportedLngs` in `index.ts`.
3. Add it to the `LANGUAGES` array in `components/layout/LanguageSwitcher.tsx`.
4. Add it to `TARGET_LOCALES` in `scripts/check-i18n-keys.ts`.
5. Run `bun run validate`.
