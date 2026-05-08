import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { DagNodeData } from './DagNodeComponent';
import type { CommandEntry, DagNode } from '@/lib/api';
import { useProviders } from '@/hooks/useProviders';

// Keep in sync with triggerRuleSchema.options in @archon/workflows/schemas/dag-node.ts
// (api.generated.d.ts is type-only and cannot export runtime values)
type TriggerRule = NonNullable<DagNode['trigger_rule']>;
const TRIGGER_RULES: readonly TriggerRule[] = [
  'all_success',
  'one_success',
  'none_failed_min_one_success',
  'all_done',
];

/** New DAG-mode inspector props (tabbed right panel). */
export interface NodeInspectorProps {
  node: DagNodeData;
  commands: CommandEntry[];
  onUpdate: (updates: Partial<DagNodeData>) => void;
  onDelete: () => void;
  onClose: () => void;
}

const inputClass =
  'w-full rounded-md border border-border bg-surface px-2 py-1.5 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent';

const selectClass =
  'w-full rounded-md border border-border bg-surface px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent';

const labelClass = 'text-[10px] text-text-tertiary uppercase tracking-wide';

const textareaClass =
  'w-full rounded-md border border-border bg-surface px-2 py-1.5 text-xs text-text-primary font-mono placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent resize-y';

function parseToolsList(value: string): string[] | undefined {
  if (!value.trim()) return undefined;
  return value
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="flex flex-col gap-1">
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}

function ProviderField({
  node,
  onUpdate,
  selectClass: cls,
}: {
  node: DagNodeData;
  onUpdate: (updates: Partial<DagNodeData>) => void;
  selectClass: string;
}): React.ReactElement {
  const { t } = useTranslation();
  const { providers } = useProviders();
  return (
    <Field label={t('workflowsBuilder.inspector.fieldProvider')}>
      <select
        value={node.provider ?? ''}
        onChange={(e): void => {
          onUpdate({ provider: e.target.value || undefined });
        }}
        className={cls}
      >
        <option value="">{t('workflowsBuilder.inspector.optionInherit')}</option>
        {providers.map(p => (
          <option key={p.id} value={p.id}>
            {p.displayName}
          </option>
        ))}
      </select>
    </Field>
  );
}

type ToolsMode = 'none' | 'allow' | 'deny';

const TOOLS_MODE_KEYS = {
  none: 'workflowsBuilder.inspector.modeDefault',
  allow: 'workflowsBuilder.inspector.modeAllow',
  deny: 'workflowsBuilder.inspector.modeDeny',
} as const;

function resolveToolsMode(node: DagNodeData): ToolsMode {
  if (node.allowed_tools !== undefined) return 'allow';
  if (node.denied_tools !== undefined) return 'deny';
  return 'none';
}

function DependencyTags({
  values,
  onChange,
}: {
  values: string[];
  onChange: (deps: string[] | undefined) => void;
}): React.ReactElement {
  const [adding, setAdding] = useState(false);
  const [addValue, setAddValue] = useState('');

  const handleAdd = (): void => {
    const trimmed = addValue.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
    }
    setAddValue('');
    setAdding(false);
  };

  const handleRemove = (dep: string): void => {
    const next = values.filter(v => v !== dep);
    onChange(next.length > 0 ? next : undefined);
  };

  return (
    <div className="flex flex-wrap gap-1 items-center">
      {values.map(dep => (
        <span
          key={dep}
          className="inline-flex items-center gap-1 rounded-md bg-surface-elevated px-1.5 py-0.5 text-[10px] font-mono text-text-secondary"
        >
          {dep}
          <button
            type="button"
            onClick={(): void => {
              handleRemove(dep);
            }}
            className="text-text-tertiary hover:text-error"
          >
            x
          </button>
        </span>
      ))}
      {adding ? (
        <input
          type="text"
          value={addValue}
          onChange={(e): void => {
            setAddValue(e.target.value);
          }}
          onKeyDown={(e): void => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAdd();
            }
            if (e.key === 'Escape') {
              setAdding(false);
              setAddValue('');
            }
          }}
          onBlur={handleAdd}
          autoFocus
          placeholder="node-id"
          className="w-20 rounded-md border border-border bg-surface px-1.5 py-0.5 text-[10px] font-mono text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
        />
      ) : (
        <button
          type="button"
          onClick={(): void => {
            setAdding(true);
          }}
          className="inline-flex items-center rounded-md border border-dashed border-border px-1.5 py-0.5 text-[10px] text-text-tertiary hover:text-text-secondary hover:border-accent"
        >
          +
        </button>
      )}
    </div>
  );
}

function GeneralTab({
  node,
  commands,
  onUpdate,
}: {
  node: DagNodeData;
  commands: CommandEntry[];
  onUpdate: (updates: Partial<DagNodeData>) => void;
}): React.ReactElement {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Node ID */}
      <Field label={t('workflowsBuilder.inspector.fieldNodeId')}>
        <input
          type="text"
          value={node.id}
          onChange={(e): void => {
            onUpdate({ id: e.target.value });
          }}
          className={cn(inputClass, 'font-mono')}
        />
        <p className="text-[9px] text-warning">
          {t('workflowsBuilder.inspector.warningRenamingId')}
        </p>
      </Field>

      {/* Type selector */}
      <Field label={t('workflowsBuilder.inspector.fieldType')}>
        <select
          value={node.nodeType}
          onChange={(e): void => {
            const newType = e.target.value as DagNodeData['nodeType'];
            const updates: Partial<DagNodeData> = { nodeType: newType };
            if (newType === 'command') {
              updates.promptText = undefined;
              updates.bashScript = undefined;
              updates.bashTimeout = undefined;
              updates.label = '';
            } else if (newType === 'prompt') {
              updates.bashScript = undefined;
              updates.bashTimeout = undefined;
              updates.label = 'Prompt';
            } else if (newType === 'bash') {
              updates.promptText = undefined;
              updates.label = 'Shell';
              updates.allowed_tools = undefined;
              updates.denied_tools = undefined;
              updates.output_format = undefined;
              updates.hooks = undefined;
              updates.mcp = undefined;
              updates.skills = undefined;
            }
            onUpdate(updates);
          }}
          className={selectClass}
        >
          <option value="command">{t('workflowsBuilder.inspector.typeCommand')}</option>
          <option value="prompt">{t('workflowsBuilder.inspector.typePrompt')}</option>
          <option value="bash">{t('workflowsBuilder.inspector.typeBash')}</option>
        </select>
      </Field>

      {/* Type-adaptive content */}
      {node.nodeType === 'command' && (
        <Field label={t('workflowsBuilder.inspector.fieldCommand')}>
          <select
            value={node.label}
            onChange={(e): void => {
              onUpdate({ label: e.target.value });
            }}
            className={selectClass}
          >
            <option value="">{t('workflowsBuilder.inspector.selectCommand')}</option>
            {commands.map(cmd => (
              <option key={cmd.name} value={cmd.name}>
                {cmd.name}
              </option>
            ))}
          </select>
        </Field>
      )}

      {node.nodeType === 'prompt' && (
        <Field label={t('workflowsBuilder.inspector.fieldPrompt')}>
          <textarea
            value={node.promptText ?? ''}
            onChange={(e): void => {
              onUpdate({ promptText: e.target.value });
            }}
            rows={5}
            placeholder={t('workflowsBuilder.inspector.promptPlaceholder')}
            className={cn(textareaClass, 'min-h-[120px]')}
          />
        </Field>
      )}

      {node.nodeType === 'bash' && (
        <>
          <Field label={t('workflowsBuilder.inspector.fieldShellScript')}>
            <textarea
              value={node.bashScript ?? ''}
              onChange={(e): void => {
                onUpdate({ bashScript: e.target.value });
              }}
              rows={5}
              placeholder="echo 'hello world'"
              className={cn(textareaClass, 'min-h-[120px]')}
            />
          </Field>
          <Field label={t('workflowsBuilder.inspector.fieldTimeoutMs')}>
            <input
              type="number"
              value={node.bashTimeout ?? ''}
              onChange={(e): void => {
                const v = e.target.value;
                onUpdate({ bashTimeout: v ? Number(v) : undefined });
              }}
              placeholder="120000"
              className={inputClass}
            />
          </Field>
        </>
      )}

      {/* Dependencies */}
      <Field label={t('workflowsBuilder.inspector.fieldDependencies')}>
        <DependencyTags
          values={node.depends_on ?? []}
          onChange={(deps): void => {
            onUpdate({ depends_on: deps });
          }}
        />
      </Field>

      {/* When condition */}
      <Field label={t('workflowsBuilder.inspector.fieldWhenCondition')}>
        <input
          type="text"
          value={node.when ?? ''}
          onChange={(e): void => {
            onUpdate({ when: e.target.value || undefined });
          }}
          placeholder="$nodeId.output.field == 'value'"
          className={cn(inputClass, 'font-mono')}
        />
      </Field>
    </div>
  );
}

function ExecutionTab({
  node,
  onUpdate,
}: {
  node: DagNodeData;
  onUpdate: (updates: Partial<DagNodeData>) => void;
}): React.ReactElement {
  const { t } = useTranslation();
  const isBash = node.nodeType === 'bash';

  return (
    <div className="flex flex-col gap-3 p-3">
      {!isBash && (
        <>
          <ProviderField node={node} onUpdate={onUpdate} selectClass={selectClass} />

          <Field label={t('workflowsBuilder.inspector.fieldModel')}>
            <input
              type="text"
              value={node.model ?? ''}
              onChange={(e): void => {
                onUpdate({ model: e.target.value || undefined });
              }}
              placeholder={t('workflowsBuilder.inspector.optionInherit')}
              className={inputClass}
            />
          </Field>

          <Field label={t('workflowsBuilder.inspector.fieldContext')}>
            <select
              value={node.context ?? ''}
              onChange={(e): void => {
                onUpdate({ context: (e.target.value || undefined) as 'fresh' | undefined });
              }}
              className={selectClass}
            >
              <option value="">{t('workflowsBuilder.inspector.optionInherit')}</option>
              <option value="fresh">{t('workflowsBuilder.inspector.optionFresh')}</option>
            </select>
          </Field>
        </>
      )}

      <Field label={t('workflowsBuilder.inspector.fieldTriggerRule')}>
        <select
          value={node.trigger_rule ?? ''}
          onChange={(e): void => {
            onUpdate({
              trigger_rule: (e.target.value || undefined) as TriggerRule | undefined,
            });
          }}
          className={selectClass}
        >
          <option value="">{t('workflowsBuilder.inspector.optionDefaultTriggerRule')}</option>
          {TRIGGER_RULES.map(rule => (
            <option key={rule} value={rule}>
              {rule}
            </option>
          ))}
        </select>
      </Field>

      <Field label={t('workflowsBuilder.inspector.fieldIdleTimeout')}>
        <input
          type="number"
          value={node.idle_timeout ?? ''}
          onChange={(e): void => {
            const v = e.target.value;
            onUpdate({ idle_timeout: v ? Number(v) : undefined });
          }}
          placeholder="300000"
          className={inputClass}
        />
      </Field>

      {/* Retry config */}
      <div className="border-t border-border pt-3 mt-1">
        <p className={cn(labelClass, 'mb-2')}>{t('workflowsBuilder.inspector.retryConfig')}</p>

        <div className="flex flex-col gap-2">
          <Field label={t('workflowsBuilder.inspector.fieldMaxAttempts')}>
            <input
              type="number"
              min={1}
              max={5}
              value={node.retry?.max_attempts ?? ''}
              onChange={(e): void => {
                const v = e.target.value;
                if (!v) {
                  onUpdate({ retry: undefined });
                } else {
                  onUpdate({
                    retry: {
                      max_attempts: Number(v),
                      delay_ms: node.retry?.delay_ms,
                      on_error: node.retry?.on_error,
                    },
                  });
                }
              }}
              placeholder="2"
              className={inputClass}
            />
          </Field>

          <Field label={t('workflowsBuilder.inspector.fieldDelay')}>
            <input
              type="number"
              min={1000}
              max={60000}
              value={node.retry?.delay_ms ?? ''}
              onChange={(e): void => {
                const v = e.target.value;
                if (node.retry) {
                  onUpdate({
                    retry: {
                      ...node.retry,
                      delay_ms: v ? Number(v) : undefined,
                    },
                  });
                }
              }}
              placeholder="3000"
              disabled={!node.retry}
              className={cn(inputClass, !node.retry && 'opacity-50')}
            />
          </Field>

          <Field label={t('workflowsBuilder.inspector.fieldOnError')}>
            <select
              value={node.retry?.on_error ?? ''}
              onChange={(e): void => {
                if (node.retry) {
                  onUpdate({
                    retry: {
                      ...node.retry,
                      on_error: (e.target.value || undefined) as 'transient' | 'all' | undefined,
                    },
                  });
                }
              }}
              disabled={!node.retry}
              className={cn(selectClass, !node.retry && 'opacity-50')}
            >
              <option value="">{t('workflowsBuilder.inspector.optionDefaultOnError')}</option>
              <option value="transient">transient</option>
              <option value="all">all</option>
            </select>
          </Field>
        </div>
      </div>
    </div>
  );
}

const TOOL_PRESETS = [
  { key: 'workflowsBuilder.inspector.presetNoTools', allowed: [] as string[] },
  { key: 'workflowsBuilder.inspector.presetReadOnly', allowed: ['Read', 'Glob', 'Grep'] },
  {
    key: 'workflowsBuilder.inspector.presetEditOnly',
    allowed: ['Read', 'Write', 'Edit', 'Glob', 'Grep'],
  },
] as const;

function ToolsTab({
  node,
  onUpdate,
}: {
  node: DagNodeData;
  onUpdate: (updates: Partial<DagNodeData>) => void;
}): React.ReactElement {
  const { t } = useTranslation();
  const currentMode = resolveToolsMode(node);

  const handleModeChange = (mode: ToolsMode): void => {
    if (mode === 'none') {
      onUpdate({ allowed_tools: undefined, denied_tools: undefined });
    } else if (mode === 'allow') {
      onUpdate({ allowed_tools: node.allowed_tools ?? [], denied_tools: undefined });
    } else {
      onUpdate({ allowed_tools: undefined, denied_tools: node.denied_tools ?? [] });
    }
  };

  return (
    <div className="flex flex-col gap-3 p-3">
      <Field label={t('workflowsBuilder.inspector.fieldMode')}>
        <div className="flex gap-1">
          {(['none', 'allow', 'deny'] as const).map(mode => (
            <button
              key={mode}
              type="button"
              onClick={(): void => {
                handleModeChange(mode);
              }}
              className={cn(
                'flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors',
                currentMode === mode
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-surface-elevated text-text-secondary hover:text-text-primary'
              )}
            >
              {t(TOOLS_MODE_KEYS[mode])}
            </button>
          ))}
        </div>
      </Field>

      <Field label={t('workflowsBuilder.inspector.fieldPresets')}>
        <div className="flex flex-wrap gap-1">
          {TOOL_PRESETS.map(preset => (
            <button
              key={preset.key}
              type="button"
              onClick={(): void => {
                onUpdate({ allowed_tools: [...preset.allowed], denied_tools: undefined });
              }}
              className="rounded-full border border-border px-2 py-0.5 text-[10px] text-text-secondary hover:text-text-primary hover:border-accent transition-colors"
            >
              {t(preset.key)}
            </button>
          ))}
        </div>
      </Field>

      <Field label={t('workflowsBuilder.inspector.fieldAllowedTools')}>
        <input
          type="text"
          value={node.allowed_tools?.join(', ') ?? ''}
          onChange={(e): void => {
            onUpdate({ allowed_tools: parseToolsList(e.target.value) });
          }}
          placeholder="tool1, tool2..."
          className={inputClass}
        />
      </Field>

      <Field label={t('workflowsBuilder.inspector.fieldDeniedTools')}>
        <input
          type="text"
          value={node.denied_tools?.join(', ') ?? ''}
          onChange={(e): void => {
            onUpdate({ denied_tools: parseToolsList(e.target.value) });
          }}
          placeholder="tool1, tool2..."
          className={inputClass}
        />
      </Field>
    </div>
  );
}

function JsonTextareaField({
  label,
  value,
  placeholder,
  rows,
  onCommit,
}: {
  label: string;
  value: Record<string, unknown> | undefined;
  placeholder: string;
  rows: number;
  onCommit: (parsed: Record<string, unknown> | undefined) => void;
}): React.ReactElement {
  const [text, setText] = useState(value ? JSON.stringify(value, null, 2) : '');
  const [error, setError] = useState<string | null>(null);

  const handleChange = useCallback(
    (raw: string): void => {
      setText(raw);
      if (!raw.trim()) {
        setError(null);
        onCommit(undefined);
        return;
      }
      try {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        setError(null);
        onCommit(parsed);
      } catch (e) {
        if (e instanceof SyntaxError) {
          setError(e.message);
        } else {
          throw e;
        }
      }
    },
    [onCommit]
  );

  return (
    <Field label={label}>
      <textarea
        value={text}
        onChange={(e): void => {
          handleChange(e.target.value);
        }}
        rows={rows}
        placeholder={placeholder}
        className={cn(textareaClass, 'min-h-[100px]')}
      />
      {error && <p className="text-[10px] text-error">{error}</p>}
    </Field>
  );
}

function AdvancedTab({
  node,
  onUpdate,
}: {
  node: DagNodeData;
  onUpdate: (updates: Partial<DagNodeData>) => void;
}): React.ReactElement {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-3 p-3">
      <JsonTextareaField
        label={t('workflowsBuilder.inspector.fieldOutputFormat')}
        value={node.output_format}
        placeholder='{"type": "object", "properties": {...}}'
        rows={5}
        onCommit={(v): void => {
          onUpdate({ output_format: v });
        }}
      />

      <Field label={t('workflowsBuilder.inspector.fieldSkills')}>
        <input
          type="text"
          value={node.skills?.join(', ') ?? ''}
          onChange={(e): void => {
            onUpdate({ skills: parseToolsList(e.target.value) });
          }}
          placeholder="skill1, skill2..."
          className={inputClass}
        />
      </Field>

      <Field label={t('workflowsBuilder.inspector.fieldMcpPath')}>
        <input
          type="text"
          value={node.mcp ?? ''}
          onChange={(e): void => {
            onUpdate({ mcp: e.target.value || undefined });
          }}
          placeholder=".archon/mcp/github.json"
          className={cn(inputClass, 'font-mono')}
        />
        <p className="text-[9px] text-text-tertiary">{t('workflowsBuilder.inspector.mcpHelp')}</p>
      </Field>

      <JsonTextareaField
        label={t('workflowsBuilder.inspector.fieldHooks')}
        value={node.hooks as Record<string, unknown> | undefined}
        placeholder='{"PreToolUse": [{"matcher": "Bash", "response": {...}}]}'
        rows={5}
        onCommit={(v): void => {
          onUpdate({ hooks: v });
        }}
      />
    </div>
  );
}

function DagInspector({
  node,
  commands,
  onUpdate,
  onDelete,
  onClose,
}: NodeInspectorProps): React.ReactElement {
  const { t } = useTranslation();
  const isBash = node.nodeType === 'bash';

  return (
    <div key={node.id} className="flex flex-col h-full border-l border-border bg-surface">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
        <span className="flex-1 truncate text-xs font-semibold text-text-primary">
          {node.label || node.id}
        </span>
        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
          className="h-6 shrink-0 px-2 text-[10px]"
          aria-label={t('workflowsBuilder.inspector.deleteNode')}
        >
          {t('workflowsBuilder.inspector.delete')}
        </Button>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 px-1 text-sm leading-none text-text-tertiary hover:text-text-primary"
          title={t('workflowsBuilder.inspector.closeInspector')}
        >
          x
        </button>
      </div>

      {/* Tabbed content */}
      <Tabs defaultValue="general" className="flex-1 flex flex-col gap-0">
        <TabsList variant="line" className="px-2 pt-1 w-full justify-start">
          <TabsTrigger value="general" className="text-xs">
            {t('workflowsBuilder.inspector.tabGeneral')}
          </TabsTrigger>
          <TabsTrigger value="execution" className="text-xs">
            {t('workflowsBuilder.inspector.tabExecution')}
          </TabsTrigger>
          {!isBash && (
            <TabsTrigger value="tools" className="text-xs">
              {t('workflowsBuilder.inspector.tabTools')}
            </TabsTrigger>
          )}
          {!isBash && (
            <TabsTrigger value="advanced" className="text-xs">
              {t('workflowsBuilder.inspector.tabAdvanced')}
            </TabsTrigger>
          )}
        </TabsList>

        <ScrollArea className="flex-1">
          <TabsContent value="general">
            <GeneralTab node={node} commands={commands} onUpdate={onUpdate} />
          </TabsContent>

          <TabsContent value="execution">
            <ExecutionTab node={node} onUpdate={onUpdate} />
          </TabsContent>

          {!isBash && (
            <TabsContent value="tools">
              <ToolsTab node={node} onUpdate={onUpdate} />
            </TabsContent>
          )}

          {!isBash && (
            <TabsContent value="advanced">
              <AdvancedTab key={node.id} node={node} onUpdate={onUpdate} />
            </TabsContent>
          )}
        </ScrollArea>
      </Tabs>
    </div>
  );
}

export function NodeInspector(props: NodeInspectorProps): React.ReactElement {
  return (
    <DagInspector
      node={props.node}
      commands={props.commands}
      onUpdate={props.onUpdate}
      onDelete={props.onDelete}
      onClose={props.onClose}
    />
  );
}
