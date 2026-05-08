import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { WorkflowExecution } from '@/components/workflows/WorkflowExecution';

export function WorkflowExecutionPage(): React.ReactElement {
  const { runId } = useParams<{ runId: string }>();
  const { t } = useTranslation();

  if (!runId) {
    return (
      <div className="flex items-center justify-center h-full text-text-secondary">
        <p>{t('workflowsPage.noRunId')}</p>
      </div>
    );
  }

  return <WorkflowExecution key={runId} runId={runId} />;
}
