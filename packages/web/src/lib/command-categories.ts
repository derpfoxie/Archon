import type { CommandEntry } from '@/lib/api';

export interface CommandCategory {
  /**
   * Stable identifier key. UI renders via `t('commands.categories.<name>')`.
   * Keep in sync with `commands.categories.*` in i18n resource files.
   */
  name: string;
  commands: CommandEntry[];
}

/** Prefix-to-category mapping. Checked after stripping the `archon-` prefix. */
const CATEGORY_PREFIXES: readonly { category: string; prefixes: string[] }[] = [
  {
    category: 'investigation',
    prefixes: ['investigate', 'web-research'],
  },
  {
    category: 'planning',
    prefixes: ['create-plan', 'confirm-plan', 'plan-setup', 'ralph-prd'],
  },
  {
    category: 'implementation',
    prefixes: ['implement', 'fix-issue', 'implement-tasks', 'implement-issue'],
  },
  {
    category: 'codeReview',
    prefixes: [
      'code-review',
      'error-handling',
      'test-coverage',
      'comment-quality',
      'docs-impact',
      'pr-review-scope',
    ],
  },
  {
    category: 'prLifecycle',
    prefixes: ['create-pr', 'finalize-pr', 'post-review', 'sync-pr'],
  },
  {
    category: 'reviewSynthesis',
    prefixes: ['synthesize-review', 'implement-review', 'auto-fix', 'self-fix'],
  },
  {
    category: 'validation',
    prefixes: ['validate'],
  },
];

function stripArchonPrefix(name: string): string {
  return name.startsWith('archon-') ? name.slice('archon-'.length) : name;
}

function findCategory(name: string): string {
  const stripped = stripArchonPrefix(name);
  for (const { category, prefixes } of CATEGORY_PREFIXES) {
    for (const prefix of prefixes) {
      if (stripped === prefix || stripped.startsWith(prefix + '-')) {
        return category;
      }
    }
  }
  return 'utilities';
}

/**
 * Group commands into named categories.
 * Project commands go first, then named categories in definition order.
 */
export function categorizeCommands(commands: CommandEntry[]): CommandCategory[] {
  const projectCommands = commands.filter(c => c.source === 'project');
  const globalCommands = commands.filter(c => c.source === 'global');
  const bundledCommands = commands.filter(c => c.source === 'bundled');

  // Group bundled commands by category
  const categoryMap = new Map<string, CommandEntry[]>();
  for (const cmd of bundledCommands) {
    const category = findCategory(cmd.name);
    const list = categoryMap.get(category);
    if (list) {
      list.push(cmd);
    } else {
      categoryMap.set(category, [cmd]);
    }
  }

  const result: CommandCategory[] = [];

  if (projectCommands.length > 0) {
    result.push({ name: 'project', commands: projectCommands });
  }

  if (globalCommands.length > 0) {
    result.push({ name: 'global', commands: globalCommands });
  }

  const orderedNames = CATEGORY_PREFIXES.map(c => c.category);
  for (const name of orderedNames) {
    const cmds = categoryMap.get(name);
    if (cmds && cmds.length > 0) {
      result.push({ name, commands: cmds });
    }
  }

  const utilities = categoryMap.get('utilities');
  if (utilities && utilities.length > 0) {
    result.push({ name: 'utilities', commands: utilities });
  }

  return result;
}
