/**
 * PDF Generator for Budget Reports
 * Generates professional PDF reports with modern design and branding
 */

import jsPDF from 'jspdf';
import type { BudgetDetail, BudgetItemDetail } from '../../../infrastructure/api/api.client';

interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  email?: string;
  website?: string;
  logoUrl?: string;
}

const DEFAULT_COMPANY_INFO: CompanyInfo = {
  name: 'CANAS KITCHEN AND BATH',
  address: '491 Nashua St, Milford NH 03055',
  phone: '(857) 928-8407',
  email: 'info@canaskitchenbath.com',
  website: 'www.canaskitchenbath.com',
};

// Brand colors - Matching reference PDF design with soft blue-gray palette
const COLORS = {
  // Light blue-gray backgrounds for sections and headers
  headerBg: [210, 217, 235] as [number, number, number], // Light blue-gray (rgb(210, 217, 235))
  sectionBg: [217, 225, 242] as [number, number, number], // Lighter blue-gray
  alternateRow: [248, 250, 252] as [number, number, number], // Very light gray for alternating rows
  // Text colors
  dark: [0, 0, 0] as [number, number, number], // Black text
  gray: [128, 128, 128] as [number, number, number], // Gray text
  // Borders and lines
  border: [217, 217, 217] as [number, number, number], // Light gray borders
  white: [255, 255, 255] as [number, number, number],
};

/**
 * Groups budget items by section name
 */
function groupItemsBySection(items: BudgetItemDetail[]): Record<string, BudgetItemDetail[]> {
  const grouped: Record<string, BudgetItemDetail[]> = {};
  
  items.forEach((item) => {
    const section = item.section_name || 'Other';
    if (!grouped[section]) {
      grouped[section] = [];
    }
    grouped[section].push(item);
  });
  
  return grouped;
}

/**
 * Formats currency value
 */
function formatCurrency(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(num);
}

/**
 * Draws table cell borders matching reference PDF
 */
function drawTableBorders(
  doc: jsPDF,
  margin: number,
  yStart: number,
  yEnd: number,
  colWidths: any,
  contentWidth: number
): void {
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  
  // Horizontal lines
  doc.line(margin, yStart, margin + contentWidth, yStart);
  doc.line(margin, yEnd, margin + contentWidth, yEnd);
  
  // Vertical lines
  let xPos = margin;
  doc.line(xPos, yStart, xPos, yEnd); // Left border
  
  xPos += colWidths.description;
  doc.line(xPos, yStart, xPos, yEnd); // After description
  
  xPos += colWidths.unit;
  doc.line(xPos, yStart, xPos, yEnd); // After unit
  
  xPos += colWidths.quantity;
  doc.line(xPos, yStart, xPos, yEnd); // After quantity
  
  xPos += colWidths.unitPrice;
  doc.line(xPos, yStart, xPos, yEnd); // After unit price
  
  xPos += colWidths.subtotal;
  doc.line(xPos, yStart, xPos, yEnd); // Right border
}

/**
 * Draws a header matching reference PDF design - simple and clean
 */
function drawHeader(
  doc: jsPDF,
  companyInfo: CompanyInfo,
  budget: BudgetDetail,
  pageWidth: number,
  margin: number
): number {
  let yPosition = margin;

  // Company name - bold, left aligned
  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(companyInfo.name, margin, yPosition);

  // "WORK DETAIL" subtitle
  yPosition += 7;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('WORK DETAIL', margin, yPosition);

  // Company address and contact - left side
  yPosition += 7;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(companyInfo.address, margin, yPosition);
  
  yPosition += 5;
  doc.text(`Phone: ${companyInfo.phone}`, margin, yPosition);

  // Proposal info box - right aligned
  const rightX = pageWidth - margin;
  let rightY = margin;
  
  // Create a small table-like box for proposal info
  const boxWidth = 65;
  const boxX = rightX - boxWidth;
  
  // Header row with light blue background
  doc.setFillColor(...COLORS.headerBg);
  doc.rect(boxX, rightY - 4, boxWidth, 7, 'F');
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('PROPOSAL', boxX + 2, rightY);
  doc.text('DATE', boxX + 35, rightY);
  
  // Data row
  rightY += 6;
  doc.setFont('helvetica', 'normal');
  const proposalNumber = budget.id.substring(0, 8).toUpperCase();
  const proposalDate = new Date(budget.created_at).toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: '2-digit',
  });
  
  doc.text(proposalNumber, boxX + 2, rightY);
  doc.text(proposalDate, boxX + 35, rightY);

  yPosition += 8;

  // "WORK DETAIL" section header with light background
  doc.setFillColor(...COLORS.headerBg);
  doc.rect(margin - 5, yPosition - 3, pageWidth - (margin * 2) + 10, 8, 'F');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('WORK DETAIL', margin, yPosition + 2);

  yPosition += 10;

  // Budget title
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(budget.title.toUpperCase(), margin, yPosition);

  yPosition += 5;

  return yPosition;
}

/**
 * Generates a PDF report for a budget with professional design
 */
export async function generateBudgetPDF(
  budget: BudgetDetail,
  companyInfo: CompanyInfo = DEFAULT_COMPANY_INFO
): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  
  let yPosition = drawHeader(doc, companyInfo, budget, pageWidth, margin);

  // Main table
  const colWidths = {
    description: contentWidth * 0.48,
    unit: contentWidth * 0.12,
    quantity: contentWidth * 0.12,
    unitPrice: contentWidth * 0.14,
    subtotal: contentWidth * 0.14,
  };

  // Table header with light blue-gray background (matching reference)
  yPosition += 5;
  const tableStartY = yPosition - 5;
  doc.setFillColor(...COLORS.headerBg);
  doc.rect(margin, tableStartY, contentWidth, 8, 'F');
  
  // Draw table borders for header
  drawTableBorders(doc, margin, tableStartY, tableStartY + 8, colWidths, contentWidth);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.dark); // Black text on light background
  
  let xPos = margin + 2;
  doc.text('DESCRIPTION', xPos, yPosition);
  xPos += colWidths.description + 2;
  doc.text('UNIT', xPos, yPosition);
  xPos += colWidths.unit + 2;
  doc.text('Quantity', xPos, yPosition);
  xPos += colWidths.quantity + 2;
  doc.text('Unit price', xPos, yPosition);
  xPos += colWidths.unitPrice + 2;
  doc.text('Subtotal', xPos, yPosition);
  
  yPosition += 8;

  // Group items by section
  const groupedItems = groupItemsBySection(budget.budget_items);
  let sectionNumber = 1;

  // Sort sections (put "Other" at the end)
  const sortedSections = Object.keys(groupedItems).sort((a, b) => {
    if (a === 'Other') return 1;
    if (b === 'Other') return -1;
    return a.localeCompare(b);
  });

  for (const sectionName of sortedSections) {
    const items = groupedItems[sectionName];
    let sectionSubtotal = 0;

    // Section header
    if (sectionName !== 'Other') {
        // Calculate section subtotal
        items.forEach((item) => {
          sectionSubtotal += parseFloat(item.subtotal);
        });

        // Section header - simple row with number and section name
        const sectionRowStartY = yPosition;
        const sectionRowHeight = 6;
        
        // Section row background
        doc.setFillColor(...COLORS.sectionBg);
        doc.rect(margin, sectionRowStartY, contentWidth, sectionRowHeight, 'F');
        
        // Draw borders for section row
        drawTableBorders(doc, margin, sectionRowStartY, sectionRowStartY + sectionRowHeight, colWidths, contentWidth);
        
        yPosition += 4;
        
        // Section row with section total on the right
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        
        // Section number and name on the left
        doc.text(`${sectionNumber}`, margin + 2, yPosition);
        doc.text(sectionName.toUpperCase(), margin + 8, yPosition);
        
        // Section total on the right (in Subtotal column)
        xPos = margin + colWidths.description + colWidths.unit + colWidths.quantity + colWidths.unitPrice + 2;
        doc.text(formatCurrency(sectionSubtotal), xPos, yPosition);
        
        yPosition = sectionRowStartY + sectionRowHeight;

        // Section items
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        
        for (const item of items) {
          // Check if we need a new page
          if (yPosition > doc.internal.pageSize.getHeight() - 30) {
            doc.addPage();
            yPosition = drawHeader(doc, companyInfo, budget, pageWidth, margin);
          }

          const rowStartY = yPosition;
          const baseRowHeight = 5;
          
          // Calculate row height based on description lines
          const maxDescWidth = colWidths.description - 5;
          const descriptionLines = doc.splitTextToSize(item.description, maxDescWidth);
          const rowHeight = baseRowHeight + (descriptionLines.length > 1 ? (descriptionLines.length - 1) * 4 : 0);
          
          // Draw borders for this row
          drawTableBorders(doc, margin, rowStartY, rowStartY + rowHeight, colWidths, contentWidth);
          
          yPosition += 3;
          
          // Description
          xPos = margin + 2;
          doc.text(descriptionLines[0], xPos, yPosition);
          
          // Unit
          xPos = margin + colWidths.description + 2;
          doc.text(item.unit || '', xPos, yPosition);
          
          // Quantity
          xPos += colWidths.unit + 2;
          doc.text(item.quantity.toString(), xPos, yPosition);
          
          // Unit price
          xPos += colWidths.quantity + 2;
          doc.text(formatCurrency(item.unit_price), xPos, yPosition);
          
          // Subtotal
          xPos += colWidths.unitPrice + 2;
          doc.text(formatCurrency(item.subtotal), xPos, yPosition);
          
          yPosition += 4;
          
          // Add additional description lines if needed
          if (descriptionLines.length > 1) {
            for (let i = 1; i < descriptionLines.length; i++) {
              doc.text(descriptionLines[i], margin + 2, yPosition);
              yPosition += 4;
            }
          }
          
          yPosition = rowStartY + rowHeight;
        }

        sectionNumber++;
      } else {
        // Handle "Other" section items
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        
        for (const item of items) {
          if (yPosition > doc.internal.pageSize.getHeight() - 30) {
            doc.addPage();
            yPosition = margin;
          }

          xPos = margin;
          const maxDescWidth = colWidths.description - 10;
          const descriptionLines = doc.splitTextToSize(item.description, maxDescWidth);
          doc.text(descriptionLines[0], xPos, yPosition);
          
          xPos += colWidths.description;
          doc.text(item.unit || '—', xPos, yPosition);
          
          xPos += colWidths.unit;
          doc.text(item.quantity.toString(), xPos, yPosition);
          
          xPos += colWidths.quantity;
          doc.text(formatCurrency(item.unit_price), xPos, yPosition);
          
          xPos += colWidths.unitPrice;
          doc.text(formatCurrency(item.subtotal), xPos, yPosition);
          
          yPosition += 6;
          
          // Add additional description lines if needed
          if (descriptionLines.length > 1) {
            for (let i = 1; i < descriptionLines.length; i++) {
              doc.text(descriptionLines[i], margin, yPosition);
              yPosition += 5;
            }
          }
        }
      }
  }

  // Grand Total section - simple and clean like reference
  yPosition += 8;
  
  // Add some spacing before total
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;
  
  // Total label and amount on same row, bold
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.dark);
  doc.text('TOTAL', margin + 2, yPosition);
  
  xPos = margin + colWidths.description + colWidths.unit + colWidths.quantity + colWidths.unitPrice;
  doc.setFontSize(12);
  doc.text(formatCurrency(budget.total_amount), xPos, yPosition);
  
  yPosition += 15;

  // Footer section - minimal
  if (yPosition < doc.internal.pageSize.getHeight() - 40) {
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.3);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 6;
  
    // Thank you message
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.gray);
    doc.text('Thank you for choosing us for your project!', margin, yPosition);
    yPosition += 5;
    
    doc.setFontSize(8);
    doc.text('This proposal is valid for 30 days from the date above.', margin, yPosition);
  }

  // Page numbers at bottom
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.gray);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Save PDF
  const fileName = `Budget_${budget.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
