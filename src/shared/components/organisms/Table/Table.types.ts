import type { ReactNode } from 'react';

export interface TableColumn<T> {
  key: string;
  label: string;
  span?: number; // Grid column span (out of 12)
  align?: 'left' | 'right' | 'center';
  render?: (item: T, isSelected: boolean) => ReactNode;
  className?: string;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  getRowId: (item: T) => string;
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  selectedRows?: Set<string>;
  onSelectionChange?: (selectedIds: Set<string>) => void;
  selectable?: boolean;
  className?: string;
}

