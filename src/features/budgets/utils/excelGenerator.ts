/**
 * Excel Generator for Budget Reports
 * Generates .xlsx files with category/item breakdown
 */

import type { BudgetDetail } from '../../../infrastructure/api/api.client';

/**
 * Generates an Excel report for a budget
 */
export async function generateBudgetExcel(budget: BudgetDetail): Promise<void> {
  const XLSX = await import('xlsx');

  const rows: (string | number)[][] = [];

  // Header row
  rows.push(['Category', 'Item', 'Unit', 'Qty', 'Unit Price', 'Subtotal']);

  const sortedCategories = [...budget.budget_categories].sort(
    (a, b) => a.order_index - b.order_index,
  );

  for (const category of sortedCategories) {
    // Category header row
    const catTotal = parseFloat(category.subtotal) || 0;
    rows.push([category.name, '', '', '', '', catTotal]);

    // Items
    for (const item of category.budget_items) {
      rows.push([
        '',
        item.description,
        item.unit || '',
        parseFloat(item.quantity) || 0,
        parseFloat(item.unit_price) || 0,
        parseFloat(item.subtotal) || 0,
      ]);
    }
  }

  // Empty row + Grand total
  rows.push([]);
  rows.push(['', '', '', '', 'TOTAL', parseFloat(budget.total_amount) || 0]);

  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  // Column widths
  worksheet['!cols'] = [
    { wch: 25 }, // Category
    { wch: 35 }, // Item
    { wch: 10 }, // Unit
    { wch: 8 },  // Qty
    { wch: 12 }, // Unit Price
    { wch: 14 }, // Subtotal
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Budget');

  const fileName = `Budget_${budget.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}
