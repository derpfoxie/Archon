#!/usr/bin/env bun
/**
 * Generates Chinese mirror workflows from the English defaults in
 * .archon/workflows/defaults/. For each `<name>.yaml`, writes a `<name>-zh.yaml`
 * with:
 *   - `name` suffixed with `-zh`
 *   - `description` replaced from scripts/zh-workflow-translations.yaml
 *   - Node-level `systemPrompt` appended/added so AI nodes (command/prompt/loop)
 *     respond in Simplified Chinese, while still using the original English
 *     command prompts from .archon/commands/defaults/
 *   - `approval.message` and `approval.on_reject.prompt` replaced from the
 *     translation table (required when present in source)
 *   - `loop.gate_message` replaced when translation is provided (warning only
 *     if missing, since it is optional UX text)
 *
 * The mirror files are AUTO-GENERATED — never hand-edit them. Update the
 * translation table and re-run.
 *
 * Wired into:
 *   - bun run generate:bundled  (chains zh-mirror -> bundled-defaults)
 *   - bun run check:bundled     (same chain in --check mode)
 *
 * Usage:
 *   bun run scripts/generate-zh-mirror-workflows.ts          # write
 *   bun run scripts/generate-zh-mirror-workflows.ts --check  # verify (exit 2 if stale)
 *
 * Exit codes:
 *   0  mirrors generated (or up-to-date in --check)
 *   1  unexpected error or missing required translations
 *   2  --check passed and mirrors would change
 */
import { readFile, readdir, writeFile } from 'fs/promises';
import { join, resolve } from 'path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

const REPO_ROOT = resolve(import.meta.dir, '..');
const WORKFLOWS_DIR = join(REPO_ROOT, '.archon/workflows/defaults');
const TRANSLATIONS_PATH = join(REPO_ROOT, 'scripts/zh-workflow-translations.yaml');

const CHECK_ONLY = process.argv.includes('--check');

const SUFFIX = '-zh';
const SYSTEM_PROMPT_NEW = 'Respond in Simplified Chinese (简体中文).';
const SYSTEM_PROMPT_APPEND = '\n\nAdditionally, respond in Simplified Chinese (简体中文).';

interface ApprovalTranslation {
  message?: string;
  on_reject_prompt?: string;
}

interface LoopTranslation {
  gate_message?: string;
}

interface WorkflowTranslation {
  description?: string;
  approvals?: Record<string, ApprovalTranslation>;
  loops?: Record<string, LoopTranslation>;
}

interface TranslationsFile {
  workflows?: Record<string, WorkflowTranslation>;
}

interface WorkflowNode {
  id: string;
  command?: string;
  prompt?: string;
  bash?: string;
  script?: string;
  loop?: { prompt?: string; gate_message?: string; [k: string]: unknown };
  approval?: {
    message: string;
    on_reject?: { prompt: string; [k: string]: unknown };
    [k: string]: unknown;
  };
  cancel?: string;
  systemPrompt?: string;
  [key: string]: unknown;
}

interface WorkflowYaml {
  name: string;
  description: string;
  nodes: WorkflowNode[];
  [key: string]: unknown;
}

function isAiNode(node: WorkflowNode): boolean {
  return node.command !== undefined || node.prompt !== undefined || node.loop !== undefined;
}

function injectSystemPrompt(node: WorkflowNode): void {
  if (typeof node.systemPrompt === 'string' && node.systemPrompt.length > 0) {
    node.systemPrompt = node.systemPrompt + SYSTEM_PROMPT_APPEND;
  } else {
    node.systemPrompt = SYSTEM_PROMPT_NEW;
  }
}

function transformNode(
  node: WorkflowNode,
  wfName: string,
  translation: WorkflowTranslation,
  errors: string[]
): void {
  if (isAiNode(node)) {
    injectSystemPrompt(node);
  }

  if (node.approval !== undefined) {
    const tr = translation.approvals?.[node.id];
    if (!tr?.message) {
      errors.push(
        `${wfName}: approval node "${node.id}" missing translation (workflows.${wfName}.approvals.${node.id}.message)`
      );
    } else {
      node.approval.message = tr.message;
      if (node.approval.on_reject !== undefined) {
        if (!tr.on_reject_prompt) {
          errors.push(
            `${wfName}: approval node "${node.id}" has on_reject but no translation (workflows.${wfName}.approvals.${node.id}.on_reject_prompt)`
          );
        } else {
          node.approval.on_reject.prompt = tr.on_reject_prompt;
        }
      }
    }
  }

  if (node.loop !== undefined && typeof node.loop.gate_message === 'string') {
    const tr = translation.loops?.[node.id]?.gate_message;
    if (tr) {
      node.loop.gate_message = tr;
    } else {
      console.warn(
        `  warning: ${wfName}: loop node "${node.id}" has gate_message but no translation; keeping English`
      );
    }
  }
}

function transformWorkflow(
  source: WorkflowYaml,
  translations: Record<string, WorkflowTranslation>,
  errors: string[]
): WorkflowYaml | null {
  const tr = translations[source.name];
  if (!tr) {
    errors.push(`${source.name}: missing translation entry (workflows.${source.name})`);
    return null;
  }
  if (!tr.description) {
    errors.push(
      `${source.name}: missing description translation (workflows.${source.name}.description)`
    );
    return null;
  }

  const next = structuredClone(source);
  next.name = `${source.name}${SUFFIX}`;
  next.description = tr.description;
  for (const node of next.nodes) {
    transformNode(node, source.name, tr, errors);
  }
  return next;
}

function header(sourceFilename: string): string {
  return [
    '# AUTO-GENERATED MIRROR — DO NOT EDIT BY HAND.',
    `# Source: ${sourceFilename}`,
    '# Translation table: scripts/zh-workflow-translations.yaml',
    '# Regenerate: bun run generate:zh-workflows',
    '',
  ].join('\n');
}

async function loadTranslations(): Promise<Record<string, WorkflowTranslation>> {
  try {
    const raw = await readFile(TRANSLATIONS_PATH, 'utf-8');
    const parsed = parseYaml(raw) as TranslationsFile;
    if (!parsed?.workflows) {
      console.error(`${TRANSLATIONS_PATH}: missing top-level "workflows" key`);
      return {};
    }
    return parsed.workflows;
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') {
      console.error(
        `Translation table not found at ${TRANSLATIONS_PATH}.\n` +
          'Create it with shape:\n\n' +
          'workflows:\n' +
          '  archon-assist:\n' +
          '    description: |\n' +
          '      <Chinese translation>\n'
      );
      return {};
    }
    throw e;
  }
}

async function main(): Promise<void> {
  const translations = await loadTranslations();

  const entries = await readdir(WORKFLOWS_DIR);
  const englishYamls = entries
    .filter(e => (e.endsWith('.yaml') || e.endsWith('.yml')) && !/-zh\.(yaml|yml)$/.test(e))
    .sort((a, b) => a.localeCompare(b));

  const errors: string[] = [];
  const generated = new Map<string, string>();

  for (const filename of englishYamls) {
    const sourcePath = join(WORKFLOWS_DIR, filename);
    const raw = (await readFile(sourcePath, 'utf-8')).replace(/\r\n/g, '\n');
    let source: WorkflowYaml;
    try {
      source = parseYaml(raw) as WorkflowYaml;
    } catch (e) {
      errors.push(`${filename}: yaml parse error: ${(e as Error).message}`);
      continue;
    }
    if (!source?.name) {
      errors.push(`${filename}: missing top-level "name"`);
      continue;
    }

    const transformed = transformWorkflow(source, translations, errors);
    if (!transformed) continue;

    const body = stringifyYaml(transformed, {
      lineWidth: 0,
      blockQuote: 'literal',
    });
    const mirrorFilename = filename.replace(/\.(yaml|yml)$/, `${SUFFIX}.$1`);
    generated.set(mirrorFilename, header(filename) + body);
  }

  if (errors.length > 0) {
    console.error('Translation errors:');
    for (const err of errors) console.error(`  - ${err}`);
    console.error(
      `\nFix them in ${TRANSLATIONS_PATH} (relative: scripts/zh-workflow-translations.yaml) and re-run.`
    );
    process.exit(1);
  }

  if (CHECK_ONLY) {
    let stale = false;

    const onDiskMirrors = entries.filter(e => /-zh\.(yaml|yml)$/.test(e));
    for (const filename of onDiskMirrors) {
      if (!generated.has(filename)) {
        console.error(`Stale mirror file: ${filename} (no matching English workflow)`);
        stale = true;
      }
    }

    for (const [filename, expected] of generated) {
      const path = join(WORKFLOWS_DIR, filename);
      let existing = '';
      try {
        existing = (await readFile(path, 'utf-8')).replace(/\r\n/g, '\n');
      } catch (e) {
        const err = e as NodeJS.ErrnoException;
        if (err.code === 'ENOENT') {
          console.error(`Missing mirror file: ${filename}`);
          stale = true;
          continue;
        }
        throw err;
      }
      if (existing !== expected) {
        console.error(`Out-of-date mirror file: ${filename}`);
        stale = true;
      }
    }

    if (stale) {
      console.error('\nRun: bun run generate:zh-workflows');
      process.exit(2);
    }
    console.log(`zh mirrors up to date (${generated.size} mirrors).`);
    return;
  }

  for (const [filename, content] of generated) {
    await writeFile(join(WORKFLOWS_DIR, filename), content, 'utf-8');
  }
  console.log(
    `Wrote ${generated.size} Chinese mirror workflows to ${WORKFLOWS_DIR}/<name>${SUFFIX}.yaml`
  );
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(msg);
  process.exit(1);
});
