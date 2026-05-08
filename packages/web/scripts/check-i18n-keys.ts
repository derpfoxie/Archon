#!/usr/bin/env bun
/**
 * Verify that every supported locale stays in sync with `en.json`.
 *
 * `en.json` is the source of truth. The script enforces:
 *
 *   1. **Key coverage** — every non-plural key in en must exist in each target.
 *      Plural keys (`<stem>_<form>`) follow CLDR: required in a target only
 *      if that locale's plural rules include `<form>` (zh-CN and ja only have
 *      `other`). A key in a target that doesn't exist in en is also a failure.
 *
 *   2. **Interpolation parity** — for each shared string key, the set of
 *      `{{name}}` placeholders must match between en and the target.
 *      Catches typos like `{{cnt}}` instead of `{{count}}` that runtime
 *      fallback would silently mask.
 *
 *   3. **No empty values** — any locale shipping `""` for a leaf key fails.
 *      Forces translators to either provide a value or remove the key.
 *
 * `_meta.*` keys at the top level are ignored (per-file disclaimers).
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
const INTERP_RE = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;

type Json = string | number | boolean | null | { [k: string]: Json } | Json[];

interface FlatEntry {
  /** Dot-separated key path, e.g. `nav.workflowsRunning_other`. */
  key: string;
  /** Leaf value (string in practice; non-strings are rare and treated as opaque). */
  value: string;
}

function loadResource(locale: string): Record<string, Json> {
  const path = join(RESOURCE_DIR, `${locale}.json`);
  return JSON.parse(readFileSync(path, 'utf-8')) as Record<string, Json>;
}

/** Flatten resource into key→value entries, skipping top-level `_meta`. */
function flattenEntries(obj: Json, prefix = ''): FlatEntry[] {
  const out: FlatEntry[] = [];
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    if (prefix) {
      out.push({ key: prefix, value: typeof obj === 'string' ? obj : JSON.stringify(obj) });
    }
    return out;
  }
  for (const [k, v] of Object.entries(obj)) {
    if (prefix === '' && k === '_meta') continue;
    const next = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      out.push(...flattenEntries(v, next));
    } else {
      out.push({ key: next, value: typeof v === 'string' ? v : JSON.stringify(v) });
    }
  }
  return out;
}

/** Extract `{{name}}` placeholders into a sorted, deduped name list. */
function extractInterps(value: string): string[] {
  const names = new Set<string>();
  for (const m of value.matchAll(INTERP_RE)) {
    names.add(m[1]);
  }
  return [...names].sort();
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

const sourceEntries = flattenEntries(loadResource(SOURCE_LOCALE));
const sourceMap = new Map<string, string>(sourceEntries.map(e => [e.key, e.value]));
const sourceKeys = new Set(sourceMap.keys());
let failed = false;

for (const locale of TARGET_LOCALES) {
  const expectedKeys = applyPluralFilter(sourceKeys, locale);
  const actualEntries = flattenEntries(loadResource(locale));
  const actualMap = new Map<string, string>(actualEntries.map(e => [e.key, e.value]));
  const actualKeys = new Set(actualMap.keys());

  const missing = setDiff(expectedKeys, actualKeys);
  const extra = setDiff(actualKeys, applyPluralFilter(sourceKeys, SOURCE_LOCALE));

  // Interpolation parity: for keys present in both, compare placeholder names
  const interpMismatches: { key: string; en: string[]; target: string[] }[] = [];
  // Empty-value violations: leaf strings that are "" in this locale
  const empties: string[] = [];

  for (const [key, value] of actualMap) {
    if (value === '') empties.push(key);
    const enValue = sourceMap.get(key);
    if (enValue == null) continue; // covered by `extra` above
    const enInterps = extractInterps(enValue);
    const tgtInterps = extractInterps(value);
    if (enInterps.length !== tgtInterps.length || enInterps.some((n, i) => n !== tgtInterps[i])) {
      interpMismatches.push({ key, en: enInterps, target: tgtInterps });
    }
  }

  const localeFailed =
    missing.length > 0 || extra.length > 0 || interpMismatches.length > 0 || empties.length > 0;

  if (!localeFailed) {
    console.log(`✓ ${locale}: ${String(actualKeys.size)} keys, in sync with ${SOURCE_LOCALE}`);
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
  if (interpMismatches.length > 0) {
    console.error(
      `✗ ${locale}: ${String(interpMismatches.length)} keys have mismatched interpolation placeholders:`
    );
    for (const m of interpMismatches) {
      const enList = m.en.length === 0 ? '(none)' : m.en.map(n => `{{${n}}}`).join(', ');
      const tgtList = m.target.length === 0 ? '(none)' : m.target.map(n => `{{${n}}}`).join(', ');
      console.error(`    ! ${m.key}`);
      console.error(`        en  : ${enList}`);
      console.error(`        ${locale}: ${tgtList}`);
    }
  }
  if (empties.length > 0) {
    console.error(`✗ ${locale}: ${String(empties.length)} keys have empty string values:`);
    for (const k of empties) console.error(`    ⌀ ${k}`);
  }
}

if (failed) {
  console.error('\ni18n key check failed.');
  process.exit(1);
}
console.log(`\nAll target locales (${TARGET_LOCALES.join(', ')}) match ${SOURCE_LOCALE}.`);
