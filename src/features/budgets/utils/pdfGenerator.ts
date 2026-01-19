/**
 * PDF Generator for Budget Reports
 * Generates PDF reports matching the COST BREAKDOWN format
 */

import jsPDF from 'jspdf';
import type { BudgetDetail, BudgetItemDetail } from '../../../infrastructure/api/api.client';

interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
}

const DEFAULT_COMPANY_INFO: CompanyInfo = {
  name: 'CANAS KITCHEN AND BATH',
  address: '491 Nashua St, Milford NH 03055',
  phone: '(857) 928-8407',
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
 * Generates a PDF report for a budget matching the COST BREAKDOWN format
 */
export async function generateBudgetPDF(
  budget: BudgetDetail,
  companyInfo: CompanyInfo = DEFAULT_COMPANY_INFO
): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let yPosition = margin;

  // Header - Company Info
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(companyInfo.name, margin, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('WORK DETAIL', margin, yPosition);
  yPosition += 6;

  doc.text(companyInfo.address, margin, yPosition);
  yPosition += 5;
  doc.text(`Phone: ${companyInfo.phone}`, margin, yPosition);
  yPosition += 8;

  // Proposal and Date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('WORK DETAIL', margin, yPosition);
  yPosition += 6;

  // Proposal table header
  const proposalX = margin;
  const proposalDateX = pageWidth - margin - 60;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('PROPOSAL', proposalX, yPosition);
  doc.text('DATE', proposalDateX, yPosition);
  yPosition += 5;

  // Proposal number and date (using budget ID and created date)
  doc.setFont('helvetica', 'normal');
  const proposalNumber = budget.id.substring(0, 8).toUpperCase();
  const proposalDate = new Date(budget.created_at).toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: '2-digit',
  });
  doc.text(proposalNumber, proposalX, yPosition);
  doc.text(proposalDate, proposalDateX, yPosition);
  yPosition += 8;

  // Project Title (from budget title)
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  const projectTitle = budget.title.toUpperCase();
  doc.text(projectTitle, margin, yPosition);
  yPosition += 8;

  // Main table
  const colWidths = {
    description: contentWidth * 0.48,
    unit: contentWidth * 0.12,
    quantity: contentWidth * 0.12,
    unitPrice: contentWidth * 0.14,
    subtotal: contentWidth * 0.14,
  };

  // Table header
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  let xPos = margin;
  doc.text('DESCRIPTION', xPos, yPosition);
  xPos += colWidths.description;
  doc.text('UNIT', xPos, yPosition);
  xPos += colWidths.unit;
  doc.text('Quantity', xPos, yPosition);
  xPos += colWidths.quantity;
  doc.text('Unit price', xPos, yPosition);
  xPos += colWidths.unitPrice;
  doc.text('Subtotal', xPos, yPosition);
  yPosition += 6;

  // Draw header line
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition - 2, pageWidth - margin, yPosition - 2);
  yPosition += 3;

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
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`${sectionNumber}`, margin, yPosition);
        doc.text(sectionName.toUpperCase(), margin + 8, yPosition);
        yPosition += 6;

        // Calculate section subtotal
        items.forEach((item) => {
          sectionSubtotal += parseFloat(item.subtotal);
        });

        // Section items
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        
        for (const item of items) {
          // Check if we need a new page
          if (yPosition > doc.internal.pageSize.getHeight() - 30) {
            doc.addPage();
            yPosition = margin;
          }

          xPos = margin + 10;
          // Split long descriptions into multiple lines
          const maxDescWidth = colWidths.description - 10;
          const descriptionLines = doc.splitTextToSize(item.description, maxDescWidth);
          const firstLine = descriptionLines[0];
          doc.text(firstLine, xPos, yPosition);
          
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
              doc.text(descriptionLines[i], margin + 10, yPosition);
              yPosition += 5;
            }
          }
        }

        // Section subtotal
        doc.setFont('helvetica', 'bold');
        xPos = margin + colWidths.description + colWidths.unit + colWidths.quantity + colWidths.unitPrice;
        doc.text(formatCurrency(sectionSubtotal), xPos, yPosition);
        yPosition += 8;
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

  // Total
  yPosition += 5;
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  xPos = margin + colWidths.description + colWidths.unit + colWidths.quantity + colWidths.unitPrice;
  doc.text('Thank you for your business!', margin, yPosition);
  yPosition += 5;
  doc.text('TOTAL', xPos - 20, yPosition);
  doc.text(formatCurrency(budget.total_amount), xPos, yPosition);

  // Save PDF
  const fileName = `Budget_${budget.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
