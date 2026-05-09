import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { listWorkflows } from '@/lib/api';
import { useProject } from '@/contexts/ProjectContext';
import { useProviders } from '@/hooks/useProviders';

export type ViewMode = 'hidden' | 'split' | 'full';

export interface BuilderToolbarProps {
  workflowName: string;
  workflowDescription: string;
  provider: string | undefined;
  model: string | undefined;
  hasUnsavedChanges: boolean;
  validationErrors: string[];
  viewMode: ViewMode;
  onNameChange: (name: string) => void;
  onDescriptionChange: (desc: string) => void;
  onProviderChange: (p: string | undefined) => void;
  onModelChange: (m: string | undefined) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onValidate: () => void;
  onSave: () => void;
  onRun: () => void;
  onLoadWorkflow: (name: string) => void;
}

const VIEW_MODE_KEYS = [
  { value: 'hidden', key: 'workflowsBuilder.toolbar.viewVisual' },
  { value: 'split', key: 'workflowsBuilder.toolbar.viewSplit' },
  { value: 'full', key: 'workflowsBuilder.toolbar.viewYaml' },
] as const;

export function BuilderToolbar({
  workflowName,
  workflowDescription,
  provider,
  model,
  hasUnsavedChanges,
  validationErrors,
  viewMode,
  onNameChange,
  onDescriptionChange,
  onProviderChange,
  onModelChange,
  onViewModeChange,
  onValidate,
  onSave,
  onRun,
  onLoadWorkflow,
}: BuilderToolbarProps): React.ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { codebases, selectedProjectId } = useProject();
  const cwd = selectedProjectId
    ? codebases?.find(cb => cb.id === selectedProjectId)?.default_cwd
    : undefined;

  const { providers } = useProviders();
  const [showDescription, setShowDescription] = useState(false);

  const { data: workflows, isError: workflowsError } = useQuery({
    queryKey: ['workflows', cwd],
    queryFn: () => listWorkflows(cwd),
  });

  return (
    <>
      <div className="flex items-center h-12 px-3 border-b border-border gap-2">
        {/* Left group: Load + Breadcrumb + Mode badge */}
        <div className="flex items-center gap-2 min-w-0">
          {/* Load existing workflow */}
          <select
            value=""
            onChange={(e): void => {
              if (e.target.value) onLoadWorkflow(e.target.value);
            }}
            className="rounded-md border border-border bg-surface px-1.5 py-1 text-xs text-text-secondary focus:outline-none focus:ring-1 focus:ring-accent min-w-[72px] max-w-[140px] shrink-0"
            title={
              workflowsError
                ? t('workflowsBuilder.toolbar.loadFailedTitle')
                : t('workflowsBuilder.toolbar.loadWorkflowTitle')
            }
          >
            <option value="">
              {workflowsError
                ? t('workflowsBuilder.toolbar.loadFailedOption')
                : t('workflowsBuilder.toolbar.loadOption')}
            </option>
            {(workflows ?? []).map(entry => (
              <option key={entry.workflow.name} value={entry.workflow.name}>
                {entry.workflow.name}
              </option>
            ))}
          </select>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1 min-w-0">
            <button
              type="button"
              onClick={(): void => {
                navigate('/workflows');
              }}
              className="text-xs text-text-tertiary hover:text-text-secondary shrink-0"
            >
              {t('workflowsBuilder.toolbar.breadcrumb')}
            </button>
            <span className="text-xs text-text-tertiary shrink-0">/</span>
            <input
              type="text"
              value={workflowName}
              onChange={(e): void => {
                onNameChange(e.target.value);
              }}
              placeholder={t('workflowsBuilder.toolbar.namePlaceholder')}
              className="min-w-[80px] max-w-[160px] rounded-md border border-transparent hover:border-border focus:border-border bg-transparent px-1.5 py-0.5 text-xs font-medium text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
            />
            {hasUnsavedChanges && (
              <span
                className="w-1.5 h-1.5 rounded-full bg-warning shrink-0"
                title={t('workflowsBuilder.toolbar.unsavedChanges')}
              />
            )}
          </div>

          {/* Description (click to expand) */}
          {showDescription ? (
            <input
              type="text"
              value={workflowDescription}
              onChange={(e): void => {
                onDescriptionChange(e.target.value);
              }}
              onBlur={(): void => {
                setShowDescription(false);
              }}
              autoFocus
              placeholder={t('workflowsBuilder.toolbar.descriptionPlaceholder')}
              className="w-48 rounded-md border border-border bg-surface px-2 py-0.5 text-xs text-text-secondary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
            />
          ) : (
            <button
              type="button"
              onClick={(): void => {
                setShowDescription(true);
              }}
              className="text-[10px] text-text-tertiary hover:text-text-secondary truncate max-w-[120px] shrink-0"
              title={workflowDescription || t('workflowsBuilder.toolbar.addDescription')}
            >
              {workflowDescription || t('workflowsBuilder.toolbar.addDescriptionShort')}
            </button>
          )}

          {/* Mode badge */}
          <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider shrink-0 bg-node-command/20 text-node-command">
            DAG
          </span>
        </div>

        {/* Center group: Provider + Model */}
        <div className="flex items-center gap-1.5 mx-auto">
          <select
            value={provider ?? ''}
            onChange={(e): void => {
              onProviderChange(e.target.value || undefined);
            }}
            className="rounded-md border border-border bg-surface px-1.5 py-1 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="">{t('workflowsBuilder.toolbar.providerPlaceholder')}</option>
            {providers.map(p => (
              <option key={p.id} value={p.id}>
                {p.displayName}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={model ?? ''}
            onChange={(e): void => {
              onModelChange(e.target.value || undefined);
            }}
            placeholder={t('workflowsBuilder.toolbar.modelPlaceholder')}
            className="w-20 rounded-md border border-border bg-surface px-1.5 py-1 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        {/* Right group: View toggle + Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* View toggle */}
          <div className="flex rounded-md border border-border overflow-hidden">
            {VIEW_MODE_KEYS.map(({ value, key }) => (
              <button
                key={value}
                type="button"
                onClick={(): void => {
                  onViewModeChange(value);
                }}
                className={cn(
                  'px-2 py-1 text-[10px] font-medium transition-colors',
                  viewMode === value
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                )}
              >
                {t(key)}
              </button>
            ))}
          </div>

          {/* Validation errors badge */}
          {validationErrors.length > 0 && (
            <span className="rounded-full bg-error/20 text-error px-1.5 py-0.5 text-[10px] font-medium">
              {validationErrors.length}
            </span>
          )}

          <Button variant="outline" size="xs" onClick={onValidate}>
            {t('workflowsBuilder.toolbar.validate')}
          </Button>

          <Button variant="secondary" size="xs" onClick={onSave} disabled={!workflowName.trim()}>
            {t('workflowsBuilder.toolbar.save')}
          </Button>

          <Button
            size="xs"
            onClick={onRun}
            disabled={!workflowName.trim() || hasUnsavedChanges}
            title={hasUnsavedChanges ? t('workflowsBuilder.toolbar.saveBeforeRun') : undefined}
            className="bg-node-command hover:bg-node-command/90 text-white"
          >
            {t('workflowsBuilder.toolbar.run')}
          </Button>
        </div>
      </div>

      {workflowsError && (
        <div className="px-4 py-1.5 text-xs text-error bg-surface-inset border-b border-border">
          {t('workflowsBuilder.toolbar.loadListFailed')}
        </div>
      )}
    </>
  );
}
