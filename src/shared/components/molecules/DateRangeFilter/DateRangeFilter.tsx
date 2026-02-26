import { useTranslation } from 'react-i18next';

export interface DateRangeFilterProps {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  disabled?: boolean;
}

export function DateRangeFilter({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  disabled = false,
}: DateRangeFilterProps) {
  const { t } = useTranslation('common');

  return (
    <>
      <div className="flex-1">
        <label className="block text-sm font-medium mb-2 text-[color:var(--foreground)]">
          {t('form.dateFrom')}
        </label>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)]"
        />
      </div>
      <div className="flex-1">
        <label className="block text-sm font-medium mb-2 text-[color:var(--foreground)]">
          {t('form.dateTo')}
        </label>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)]"
        />
      </div>
    </>
  );
}
