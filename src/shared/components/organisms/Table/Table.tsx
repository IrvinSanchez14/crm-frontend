import { useCallback } from 'react';
import { cn } from '../../../../core/utils/cn';
import { Text } from '../../atoms/Text';
import type { TableProps } from './Table.types';

export function Table<T>({
  columns,
  data,
  getRowId,
  loading = false,
  error = null,
  emptyMessage = 'No items found',
  onRowClick,
  selectedRows = new Set(),
  onSelectionChange,
  selectable = true,
  className,
}: TableProps<T>) {
  const allSelected = data.length > 0 && selectedRows.size === data.length;
  const someSelected = selectedRows.size > 0 && selectedRows.size < data.length;

  const toggleSelectAll = useCallback(() => {
    if (!onSelectionChange) return;
    
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(data.map((item) => getRowId(item))));
    }
  }, [allSelected, data, getRowId, onSelectionChange]);

  const toggleRowSelection = useCallback(
    (rowId: string, event?: React.MouseEvent) => {
      if (!onSelectionChange) return;
      if (event) {
        event.stopPropagation();
      }

      const newSelection = new Set(selectedRows);
      if (newSelection.has(rowId)) {
        newSelection.delete(rowId);
      } else {
        newSelection.add(rowId);
      }
      onSelectionChange(newSelection);
    },
    [selectedRows, onSelectionChange]
  );

  const handleRowClick = useCallback(
    (item: T) => {
      if (onRowClick) {
        onRowClick(item);
      }
    },
    [onRowClick]
  );

  // Helper to get col-span class
  const getColSpanClass = (span: number) => {
    const spanMap: Record<number, string> = {
      1: 'col-span-1',
      2: 'col-span-2',
      3: 'col-span-3',
      4: 'col-span-4',
      5: 'col-span-5',
      6: 'col-span-6',
      7: 'col-span-7',
      8: 'col-span-8',
      9: 'col-span-9',
      10: 'col-span-10',
      11: 'col-span-11',
      12: 'col-span-12',
    };
    return spanMap[span] || 'col-span-1';
  };

  // Calculate total span to ensure it equals 12
  const adjustedColumns = columns.map((col) => ({
    ...col,
    span: col.span || Math.floor(12 / columns.length),
  }));

  if (loading) {
    return (
      <div className={cn('bg-[color:var(--background)] w-full', className)}>
        <div className="p-12 text-center">
          <Text variant="muted" size="sm">
            Loading...
          </Text>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('bg-[color:var(--background)] w-full', className)}>
        <div className="p-12 text-center">
          <Text variant="destructive" size="sm">
            {error}
          </Text>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={cn('bg-[color:var(--background)] w-full', className)}>
        <div className="p-12 text-center">
          <Text variant="muted" size="sm">
            {emptyMessage}
          </Text>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-[color:var(--background)] w-full', className)}>
      <div className="divide-y divide-gray-200 dark:divide-[color:var(--border)]">
        {/* Gmail-style Header */}
        <div className="h-10 flex items-center px-2 border-t border-b border-gray-200 dark:border-[color:var(--border)] bg-gray-50/50 dark:bg-[color:var(--background)]">
          <div className="flex items-center flex-1 min-w-0">
            {selectable && (
              <div className="w-10 flex items-center justify-center flex-shrink-0">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = someSelected;
                  }}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-[color:var(--border)] text-[color:var(--primary)] focus:ring-2 focus:ring-[color:var(--primary)] focus:ring-offset-0 cursor-pointer"
                  aria-label="Select all"
                />
              </div>
            )}
            <div className="flex-1 grid grid-cols-12 gap-2 pr-4">
              {adjustedColumns.map((column) => (
                <div
                  key={column.key}
                  className={cn(
                    getColSpanClass(column.span),
                    column.align === 'right' && 'text-right',
                    column.align === 'center' && 'text-center',
                    column.className
                  )}
                >
                  <Text
                    size="xs"
                    className="font-bold text-gray-700 dark:text-gray-300 tracking-wide"
                  >
                    {column.label.split(' ').map((word, index) => 
                      index === 0 ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : word.toLowerCase()
                    ).join(' ')}
                  </Text>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gmail-style Rows */}
        {data.map((item) => {
          const rowId = getRowId(item);
          const isSelected = selectedRows.has(rowId);
          return (
            <div
              key={rowId}
              className={cn(
                'h-12 flex items-center px-2',
                'hover:bg-gray-100 dark:hover:bg-[color:var(--muted)]/30',
                'transition-colors duration-100',
                (onRowClick || selectable) && 'cursor-pointer',
                isSelected && 'bg-blue-50 dark:bg-[color:var(--primary)]/10'
              )}
              onClick={() => {
                if (selectable && onSelectionChange) {
                  toggleRowSelection(rowId);
                }
                if (onRowClick) {
                  handleRowClick(item);
                }
              }}
            >
              <div className="flex items-center flex-1 min-w-0">
                {selectable && (
                  <div className="w-10 flex items-center justify-center flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleRowSelection(rowId)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 rounded border-[color:var(--border)] text-[color:var(--primary)] focus:ring-2 focus:ring-[color:var(--primary)] focus:ring-offset-0 cursor-pointer"
                      aria-label={`Select row ${rowId}`}
                    />
                  </div>
                )}
                <div className="flex-1 grid grid-cols-12 gap-2 pr-4 min-w-0">
                  {adjustedColumns.map((column) => (
                    <div
                      key={column.key}
                      className={cn(
                        getColSpanClass(column.span),
                        'min-w-0',
                        column.align === 'right' && 'text-right',
                        column.align === 'center' && 'text-center',
                        column.className
                      )}
                    >
                      {column.render ? (
                        column.render(item, isSelected)
                      ) : (
                        <Text
                          size="sm"
                          className={cn(
                            'truncate',
                            isSelected ? 'font-semibold dark:text-gray-100' : 'font-normal dark:text-gray-200',
                            '[color:color-mix(in_oklab,var(--color-black)_100%,transparent)]'
                          )}
                        >
                          {(item as Record<string, unknown>)[column.key] as string}
                        </Text>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

