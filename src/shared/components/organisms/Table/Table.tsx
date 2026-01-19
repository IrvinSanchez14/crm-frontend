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
  onSelectionChange: _onSelectionChange,
  selectable: _selectable = false,
  className,
}: TableProps<T>) {
  // Selection functionality (for future use)
  // const allSelected = data.length > 0 && selectedRows.size === data.length;
  // const someSelected = selectedRows.size > 0 && selectedRows.size < data.length;

  // const toggleSelectAll = useCallback(() => {
  //   if (!onSelectionChange) return;
  //   
  //   if (allSelected) {
  //     onSelectionChange(new Set());
  //   } else {
  //     onSelectionChange(new Set(data.map((item) => getRowId(item))));
  //   }
  // }, [allSelected, data, getRowId, onSelectionChange]);

  // const toggleRowSelection = useCallback(
  //   (rowId: string, event?: React.MouseEvent) => {
  //     if (!onSelectionChange) return;
  //     if (event) {
  //       event.stopPropagation();
  //     }

  //     const newSelection = new Set(selectedRows);
  //     if (newSelection.has(rowId)) {
  //       newSelection.delete(rowId);
  //     } else {
  //       newSelection.add(rowId);
  //     }
  //     onSelectionChange(newSelection);
  //   },
  //   [selectedRows, onSelectionChange]
  // );

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
    <div className={cn('bg-[color:var(--background)] w-full rounded-lg border border-gray-200 dark:border-[color:var(--border)]', className)}>
      <div className="divide-y divide-gray-200 dark:divide-[color:var(--border)]">
        {/* Table Header */}
        <div className="px-4 py-3 bg-gray-50 dark:bg-[color:var(--muted)]/40 border-b-2 border-gray-200 dark:border-[color:var(--border)]">
          <div className="flex-1 grid grid-cols-12 gap-4 px-2">
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
                  size="sm"
                  className="font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider text-xs"
                >
                  {column.label.split(' ').map((word, index) => 
                    index === 0 ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : word.toLowerCase()
                  ).join(' ')}
                </Text>
              </div>
            ))}
          </div>
        </div>

        {/* Table Rows */}
        {data.map((item, index) => {
          const rowId = getRowId(item);
          const isSelected = selectedRows.has(rowId);
          const isEvenRow = index % 2 === 0;
          return (
            <div
              key={rowId}
              className={cn(
                'flex items-center px-4 py-3 transition-all duration-150',
                isEvenRow && 'bg-white/50 dark:bg-[color:var(--background)]/50',
                !isEvenRow && 'bg-gray-50/30 dark:bg-[color:var(--muted)]/20',
                'hover:bg-blue-50 dark:hover:bg-[color:var(--primary)]/15',
                onRowClick && 'cursor-pointer',
                isSelected && 'bg-blue-100 dark:bg-[color:var(--primary)]/25'
              )}
              onClick={() => {
                if (onRowClick) {
                  handleRowClick(item);
                }
              }}
            >
              <div className="flex-1 grid grid-cols-12 gap-4 px-2 min-w-0">
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
                          'truncate transition-colors',
                          isSelected ? 'font-semibold text-gray-900 dark:text-gray-100' : 'font-normal text-gray-700 dark:text-gray-300'
                        )}
                      >
                        {(item as Record<string, unknown>)[column.key] as string}
                      </Text>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

