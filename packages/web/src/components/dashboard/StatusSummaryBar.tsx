import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import type { DashboardCounts, CodebaseResponse, HealthResponse } from '@/lib/api';
import { cn } from '@/lib/utils';

type DateRange = 'today' | '7d' | '30d' | 'all';

interface StatusSummaryBarProps {
  counts: DashboardCounts;
  activeFilter: string | null;
  onFilterChange: (status: string | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  projectFilter: string | null;
  onProjectFilterChange: (codebaseId: string | null) => void;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  codebases: CodebaseResponse[] | undefined;
  health: HealthResponse | undefined;
}

const STATUS_CHIPS = ['running', 'paused', 'completed', 'failed', 'cancelled', 'pending'] as const;

const DATE_RANGE_KEYS = [
  { value: 'today', key: 'dashboard.rangeToday' },
  { value: '7d', key: 'dashboard.rangeLast7Days' },
  { value: '30d', key: 'dashboard.rangeLast30Days' },
  { value: 'all', key: 'dashboard.rangeAllTime' },
] as const;

export function StatusSummaryBar({
  counts,
  activeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  projectFilter,
  onProjectFilterChange,
  dateRange,
  onDateRangeChange,
  codebases,
  health,
}: StatusSummaryBarProps): React.ReactElement {
  const { t } = useTranslation();
  return (
    <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
      {/* Row 1: Status chips */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={(): void => {
            onFilterChange(null);
          }}
          className={cn(
            'whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors',
            activeFilter === null
              ? 'bg-primary/10 text-primary border border-primary'
              : 'bg-surface-elevated text-text-secondary border border-border hover:border-text-tertiary'
          )}
        >
          {t('dashboard.filterAll', { count: counts.all })}
        </button>
        {STATUS_CHIPS.map(status => {
          const count = counts[status];
          const isActive = activeFilter === status;
          return (
            <button
              key={status}
              onClick={(): void => {
                onFilterChange(isActive ? null : status);
              }}
              className={cn(
                'whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary border border-primary'
                  : 'bg-surface-elevated text-text-secondary border border-border hover:border-text-tertiary',
                status === 'running' && count > 0 && !isActive && 'animate-pulse'
              )}
            >
              {t('dashboard.filterStatus', { status: t(`common.status.${status}`), count })}
            </button>
          );
        })}
      </div>

      {/* Row 2: Project dropdown, date range, search, capacity */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={projectFilter ?? ''}
          onChange={(e): void => {
            onProjectFilterChange(e.target.value || null);
          }}
          className="max-w-[12rem] rounded-md border border-border bg-surface-elevated px-2 py-1.5 text-xs text-text-primary focus:border-primary focus:outline-none"
        >
          <option value="">{t('dashboard.allProjects')}</option>
          {codebases?.map(cb => (
            <option key={cb.id} value={cb.id}>
              {cb.name}
            </option>
          ))}
        </select>

        <select
          value={dateRange}
          onChange={(e): void => {
            onDateRangeChange(e.target.value as DateRange);
          }}
          className="max-w-[12rem] rounded-md border border-border bg-surface-elevated px-2 py-1.5 text-xs text-text-primary focus:border-primary focus:outline-none"
        >
          {DATE_RANGE_KEYS.map(opt => (
            <option key={opt.value} value={opt.value}>
              {t(opt.key)}
            </option>
          ))}
        </select>

        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e): void => {
              onSearchChange(e.target.value);
            }}
            placeholder={t('workflowsPage.searchPlaceholder')}
            className="w-full rounded-md border border-border bg-surface-elevated py-1.5 pl-7 pr-2 text-xs text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none"
          />
        </div>

        {health && (
          <span className="whitespace-nowrap text-xs text-text-tertiary shrink-0">
            {t('dashboard.capacity', {
              active: health.concurrency.active,
              max: health.concurrency.maxConcurrent,
            })}
          </span>
        )}
      </div>
    </div>
  );
}
