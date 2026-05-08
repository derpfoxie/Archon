#!/usr/bin/env bun
/**
 * Verify that every supported locale defines the same i18n keys as `en.json`.
 *
 * `en.json` is the source of truth. Any other locale that:
 *   - misses a non-plural key present in en  → fail
 *   - has a key not present in en            → fail
 *
 * Plural forms follow CLDR: a `<stem>_<form>` key in en is required in a target
 * locale only if that locale's plural rules include `<form>`. zh-CN and ja only
 * have `other`, so their `_one` / `_two` / `_few` / `_many` may be omitted.
 *
 * `_meta.*` keys at the top level are ignored (used for per-file disclaimers).
 *
 * Usage: `bun run packages/web/scripts/check-i18n-keys.ts`
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const RESOURCE_DIR = join(import.meta.dir, '..', 'src', 'i18n', 'resources');
const SOURCE_LOCALE = 'en';
const TARGET_LOCALES = ['zh-CN', 'ja'];

/** CLDR plural forms required for each locale. */
const PLURAL_FORMS: Record<string, ReadonlySet<string>> = {
  en: new Set(['one', 'other']),
  'zh-CN': new Set(['other']),
  ja: new Set(['other']),
};

const PLURAL_SUFFIX_RE = /_(zero|one|two|few|many|other)$/;

type Json = string | number | boolean | null | { [k: string]: Json } | Json[];

function loadResource(locale: string): Record<string, Json> {
  const path = join(RESOURCE_DIR, `${locale}.json`);
  return JSON.parse(readFileSync(path, 'utf-8')) as Record<string, Json>;
}

function flattenKeys(obj: Json, prefix = ''): Set<string> {
  const out = new Set<string>();
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    if (prefix) out.add(prefix);
    return out;
  }
  for (const [k, v] of Object.entries(obj)) {
    if (prefix === '' && k === '_meta') continue;
    const next = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      for (const child of flattenKeys(v, next)) out.add(child);
    } else {
      out.add(next);
    }
  }
  return out;
}

/** Drop keys whose plural suffix is not in the locale's required forms. */
function applyPluralFilter(keys: Set<string>, locale: string): Set<string> {
  const required = PLURAL_FORMS[locale] ?? new Set(['other']);
  const out = new Set<string>();
  for (const k of keys) {
    const m = PLURAL_SUFFIX_RE.exec(k);
    if (m && !required.has(m[1])) continue;
    out.add(k);
  }
  return out;
}

function setDiff(a: Set<string>, b: Set<string>): string[] {
  const out: string[] = [];
  for (const k of a) if (!b.has(k)) out.push(k);
  return out.sort();
}

const sourceKeysRaw = flattenKeys(loadResource(SOURCE_LOCALE));
let failed = false;

for (const locale of TARGET_LOCALES) {
  const expected = applyPluralFilter(sourceKeysRaw, locale);
  const actual = flattenKeys(loadResource(locale));
  const missing = setDiff(expected, actual);
  const extra = setDiff(actual, applyPluralFilter(sourceKeysRaw, SOURCE_LOCALE));

  if (missing.length === 0 && extra.length === 0) {
    console.log(`✓ ${locale}: ${String(actual.size)} keys, in sync with ${SOURCE_LOCALE}`);
    continue;
  }

  failed = true;
  if (missing.length > 0) {
    console.error(
      `✗ ${locale}: missing ${String(missing.length)} keys present in ${SOURCE_LOCALE}:`
    );
    for (const k of missing) console.error(`    - ${k}`);
  }
  if (extra.length > 0) {
    console.error(`✗ ${locale}: has ${String(extra.length)} keys not present in ${SOURCE_LOCALE}:`);
    for (const k of extra) console.error(`    + ${k}`);
  }
}

if (failed) {
  console.error('\ni18n key check failed.');
  process.exit(1);
}
console.log(`\nAll target locales (${TARGET_LOCALES.join(', ')}) match ${SOURCE_LOCALE}.`);
