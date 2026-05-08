import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';
import { DropdownMenu as DropdownMenuPrimitive } from 'radix-ui';
import { cn } from '@/lib/utils';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'zh-CN', label: '简体中文' },
  { code: 'ja', label: '日本語' },
] as const;

export function LanguageSwitcher(): React.ReactElement {
  const { i18n, t } = useTranslation();
  const current = i18n.resolvedLanguage ?? 'en';

  return (
    <DropdownMenuPrimitive.Root>
      <DropdownMenuPrimitive.Trigger
        aria-label={t('language.label')}
        className="inline-flex items-center justify-center rounded-md p-2 text-text-secondary hover:bg-surface-elevated hover:text-text-primary focus:outline-none focus:ring-1 focus:ring-ring"
      >
        <Globe className="h-4 w-4" />
      </DropdownMenuPrimitive.Trigger>
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          align="end"
          sideOffset={4}
          className="z-50 min-w-[10rem] overflow-hidden rounded-md border border-border bg-surface-elevated p-1 text-sm shadow-md"
        >
          {LANGUAGES.map(({ code, label }) => {
            const active = code === current;
            return (
              <DropdownMenuPrimitive.Item
                key={code}
                onSelect={(): void => {
                  void i18n.changeLanguage(code);
                }}
                className={cn(
                  'flex cursor-pointer items-center justify-between rounded-sm px-2 py-1.5 outline-none',
                  'focus:bg-surface text-text-primary',
                  active && 'font-medium'
                )}
              >
                <span>{label}</span>
                {active && <Check className="h-3.5 w-3.5 text-primary" />}
              </DropdownMenuPrimitive.Item>
            );
          })}
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
}
