import type { Page, Route } from '@playwright/test';

export const LOCALES = ['en', 'zh-CN', 'ja'] as const;
export type Locale = (typeof LOCALES)[number];

interface MockResponses {
  health?: unknown;
  codebases?: unknown;
  conversations?: unknown;
  workflows?: unknown;
  workflowRuns?: unknown;
  dashboardRuns?: unknown;
  updateCheck?: unknown;
  commands?: unknown;
  providers?: unknown;
}

const DEFAULT_HEALTH = {
  status: 'ok',
  adapter: 'web',
  database: 'sqlite',
  concurrency: { active: 1, maxConcurrent: 4, queued: 0, workflows: 0 },
  version: '0.3.10',
  commit: 'visual-test',
};

const DEFAULT_CODEBASES = [
  {
    id: 'cb-1',
    name: 'archon',
    repository_url: 'https://github.com/zack/archon',
    default_cwd: '/home/zack/Projects/Archon',
    commands: {},
    created_at: '2026-05-01T00:00:00Z',
  },
];

const DEFAULT_DASHBOARD_RUNS = {
  runs: [],
  counts: { all: 0, running: 0, paused: 0, completed: 0, failed: 0, cancelled: 0, pending: 0 },
  pagination: { total: 0, limit: 50, offset: 0, hasMore: false },
};

const DEFAULT_WORKFLOWS = [
  {
    workflow: {
      name: 'archon-assist',
      description: 'Answer questions about the codebase',
      provider: 'claude',
      nodes: [{ id: 'answer', prompt: 'Answer the question.' }],
    },
    filename: 'archon-assist.yaml',
    source: 'bundled' as const,
  },
];

const DEFAULT_PROVIDERS = {
  providers: [
    { id: 'claude', displayName: 'Claude', capabilities: [], builtIn: true },
    { id: 'codex', displayName: 'Codex', capabilities: [], builtIn: true },
  ],
};

const DEFAULT_UPDATE_CHECK = {
  updateAvailable: false,
  currentVersion: '0.3.10',
  latestVersion: '0.3.10',
  releaseUrl: null,
};

export async function mockApi(page: Page, overrides: MockResponses = {}): Promise<void> {
  const responses = {
    health: overrides.health ?? DEFAULT_HEALTH,
    codebases: overrides.codebases ?? DEFAULT_CODEBASES,
    conversations: overrides.conversations ?? [],
    workflows: overrides.workflows ?? DEFAULT_WORKFLOWS,
    workflowRuns: overrides.workflowRuns ?? [],
    dashboardRuns: overrides.dashboardRuns ?? DEFAULT_DASHBOARD_RUNS,
    updateCheck: overrides.updateCheck ?? DEFAULT_UPDATE_CHECK,
    commands: overrides.commands ?? { commands: [] },
    providers: overrides.providers ?? DEFAULT_PROVIDERS,
  };

  await page.route('**/api/**', (route: Route) => {
    const url = route.request().url();
    const json = (body: unknown): Promise<void> =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

    if (url.includes('/api/health')) return json(responses.health);
    if (url.includes('/api/update-check')) return json(responses.updateCheck);
    if (url.includes('/api/codebases/') && url.includes('/environments')) return json([]);
    if (url.includes('/api/codebases')) return json(responses.codebases);
    if (url.includes('/api/conversations')) return json(responses.conversations);
    if (url.includes('/api/workflows/runs') || url.includes('/api/dashboard'))
      return json(responses.dashboardRuns);
    if (url.includes('/api/workflows')) return json({ workflows: responses.workflows });
    if (url.includes('/api/commands')) return json(responses.commands);
    if (url.includes('/api/providers')) return json(responses.providers);
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
}

export async function setLocale(page: Page, locale: Locale): Promise<void> {
  await page.addInitScript((lang: string) => {
    window.localStorage.setItem('archon-lang', lang);
  }, locale);
}
