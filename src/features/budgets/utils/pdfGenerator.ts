/**
 * PDF Generator for Budget Reports
 * Generates professional PDF reports with modern design and branding
 */

import type { BudgetDetail } from '../../../infrastructure/api/api.client';
import type jsPDF from 'jspdf';
import logoUrl from '../../../assets/logo.webp';
import { registerFigtreeFont } from './pdfFonts';

const FONT = 'Figtree';

interface CompanyInfo {
  name: string;
  address?: string;
  phone?: string;
  website?: string;
}

const DEFAULT_COMPANY_INFO: CompanyInfo = {
  name: "CANA'S KITCHEN & BATH",
  address: '419 Nashua Street, Milford, NH 03055',
  phone: '603.554.8223',
  website: 'www.canasconstruction.com',
};

/**
 * Loads the company logo as a base64 data URL for embedding in PDF.
 */
async function loadLogoBase64(): Promise<string | null> {
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = logoUrl;
    });
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}

// Brand colors - Matching reference PDF design with soft blue-gray palette
const COLORS = {
  // Light blue-gray backgrounds for sections and headers
  headerBg: [210, 217, 235] as [number, number, number], // Light blue-gray (rgb(210, 217, 235))
  sectionBg: [217, 225, 242] as [number, number, number], // Lighter blue-gray
  alternateRow: [248, 250, 252] as [number, number, number], // Very light gray for alternating rows
  // Text colors
  dark: [0, 0, 0] as [number, number, number], // Black text
  navy: [27, 40, 80] as [number, number, number], // Dark navy blue (matches logo/header lines)
  gray: [128, 128, 128] as [number, number, number], // Gray text
  subtitle: [100, 110, 130] as [number, number, number], // Muted blue-gray for subtitles
  // Borders and lines
  border: [217, 217, 217] as [number, number, number], // Light gray borders
  white: [255, 255, 255] as [number, number, number],
};

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
 * Draws the branded header matching the reference rendering PDF design.
 * Layout: Logo centered on top → two thick navy lines spanning full width →
 * company name between lines → subtitle below second line.
 */
function drawHeader(
  doc: jsPDF,
  companyInfo: CompanyInfo,
  budget: BudgetDetail,
  pageWidth: number,
  margin: number,
  logoBase64: string | null,
  isFirstPage = false,
): number {
  const centerX = pageWidth / 2;
  const lineLeft = 5;
  const lineRight = pageWidth - 5;
  let yPosition = 8;

  // --- Logo centered at top, tight to page edge ---
  const logoSize = 18;
  if (logoBase64) {
    doc.addImage(logoBase64, 'PNG', centerX - logoSize / 2, yPosition, logoSize, logoSize);
    yPosition += logoSize - 2;
  }

  // --- First thick navy horizontal line ---
  doc.setDrawColor(...COLORS.navy);
  doc.setLineWidth(1);
  doc.line(lineLeft, yPosition, lineRight, yPosition);

  yPosition += 4.5;

  // --- Company name between the two lines ---
  doc.setTextColor(...COLORS.navy);
  doc.setFontSize(12);
  doc.setFont(FONT, 'bold');
  doc.text(companyInfo.name, centerX, yPosition, { align: 'center' });

  yPosition += 2;

  // --- Second thick navy horizontal line ---
  doc.setDrawColor(...COLORS.navy);
  doc.setLineWidth(1);
  doc.line(lineLeft, yPosition, lineRight, yPosition);

  yPosition += 4.5;

  // --- Project subtitle below second line ---
  const subtitle = budget.project_address || budget.project_name || '';
  if (subtitle) {
    doc.setFontSize(9);
    doc.setFont(FONT, 'normal');
    doc.setTextColor(...COLORS.navy);
    doc.text(subtitle, centerX, yPosition, { align: 'center' });
    yPosition += 5;
  }

  yPosition += 8;

  // Client info + Proposal box - only on first page, aligned on same row
  if (isFirstPage) {
    // --- Client info on the left (no label) ---
    const leftX = margin;
    let leftY = yPosition;
    doc.setFontSize(9);
    doc.setFont(FONT, 'normal');
    doc.setTextColor(...COLORS.dark);
    if (budget.client_name) {
      doc.setFont(FONT, 'bold');
      doc.text(budget.client_name, leftX, leftY);
      doc.setFont(FONT, 'normal');
      leftY += 4;
    }
    if (budget.project_address) {
      doc.text(budget.project_address, leftX, leftY);
      leftY += 4;
    }
    if (budget.client_phone) {
      doc.text(budget.client_phone, leftX, leftY);
      leftY += 4;
    }
    if (budget.client_email) {
      doc.text(budget.client_email, leftX, leftY);
    }

    // --- Proposal + Date box on the right, aligned with client info ---
    const rightX = pageWidth - margin;
    const boxWidth = 65;
    const boxX = rightX - boxWidth;
    let rightY = yPosition - 2;

    doc.setFillColor(...COLORS.headerBg);
    doc.rect(boxX, rightY - 4, boxWidth, 7, 'F');

    doc.setFontSize(8);
    doc.setFont(FONT, 'bold');
    doc.setTextColor(...COLORS.dark);
    doc.text('PROPOSAL', boxX + 2, rightY);
    doc.text('DATE', boxX + 35, rightY);

    rightY += 6;
    doc.setFont(FONT, 'normal');
    const proposalNumber = budget.id.substring(0, 8).toUpperCase();
    const proposalDate = new Date(budget.created_at).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: '2-digit',
    });

    doc.text(proposalNumber, boxX + 2, rightY);
    doc.text(proposalDate, boxX + 35, rightY);

    yPosition += 20;
  }

  return yPosition;
}

/**
 * Builds the full PDF document (shared logic for download and preview)
 */
async function buildBudgetDoc(
  budget: BudgetDetail,
  companyInfo: CompanyInfo,
): Promise<jsPDF> {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF();

  // Register custom font and load logo
  const [logoBase64] = await Promise.all([
    loadLogoBase64(),
    registerFigtreeFont(doc),
  ]);

  doc.setFont(FONT, 'normal');

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);

  let yPosition = drawHeader(doc, companyInfo, budget, pageWidth, margin, logoBase64, true);

  // Main table
  const colWidths = {
    description: contentWidth * 0.48,
    unit: contentWidth * 0.12,
    quantity: contentWidth * 0.12,
    unitPrice: contentWidth * 0.14,
    subtotal: contentWidth * 0.14,
  };

  // Project title in red before the table
  if (budget.project_name) {
    doc.setFontSize(12);
    doc.setFont(FONT, 'bold');
    doc.setTextColor(200, 30, 30);
    doc.text(budget.project_name.toUpperCase(), margin, yPosition + 2);
    doc.setTextColor(...COLORS.dark);
    yPosition += 10;
  }

  // Table header with light blue-gray background (matching reference)
  yPosition += 5;
  const tableStartY = yPosition - 5;
  doc.setFillColor(...COLORS.headerBg);
  doc.rect(margin, tableStartY, contentWidth, 8, 'F');

  // Draw table borders for header
  drawTableBorders(doc, margin, tableStartY, tableStartY + 8, colWidths, contentWidth);

  doc.setFontSize(9);
  doc.setFont(FONT, 'bold');
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

  // Iterate budget categories sorted by order_index
  const sortedCategories = [...budget.budget_categories].sort((a, b) => a.order_index - b.order_index);
  let sectionNumber = 1;

  for (const category of sortedCategories) {
    const items = category.budget_items;
    const sectionSubtotal = parseFloat(category.subtotal);

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
    doc.setFont(FONT, 'bold');

    // Section number and name on the left
    doc.text(`${sectionNumber}`, margin + 2, yPosition);
    doc.text(category.name.toUpperCase(), margin + 8, yPosition);

    // Section total on the right (aligned with item subtotals)
    xPos = margin + colWidths.description + colWidths.unit + colWidths.quantity + colWidths.unitPrice + 8;
    doc.text(formatCurrency(sectionSubtotal), xPos, yPosition);

    yPosition = sectionRowStartY + sectionRowHeight;

    // Section items
    doc.setFontSize(8);
    doc.setFont(FONT, 'normal');

    for (const item of items) {
      // Check if we need a new page
      if (yPosition > doc.internal.pageSize.getHeight() - 30) {
        doc.addPage();
        yPosition = drawHeader(doc, companyInfo, budget, pageWidth, margin, logoBase64);
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
  doc.setFont(FONT, 'bold');
  doc.setTextColor(...COLORS.dark);
  doc.text('TOTAL', margin + 2, yPosition);

  xPos = margin + colWidths.description + colWidths.unit + colWidths.quantity + colWidths.unitPrice + 8;
  doc.setFontSize(12);
  doc.text(formatCurrency(budget.total_amount), xPos, yPosition);

  yPosition += 15;

  // Thank you / validity note
  if (yPosition < doc.internal.pageSize.getHeight() - 40) {
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.3);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 6;

    doc.setFontSize(9);
    doc.setFont(FONT, 'normal');
    doc.setTextColor(...COLORS.gray);
    doc.text('Thank you for choosing us for your project!', margin, yPosition);
    yPosition += 5;

    doc.setFontSize(8);
    doc.text('This proposal is valid for 30 days from the date above.', margin, yPosition);
  }

  // Footer on every page: company address – phone – website (matching reference PDF)
  const pageCount = doc.getNumberOfPages();
  const pageHeight = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont(FONT, 'normal');
    doc.setTextColor(...COLORS.subtitle);

    // Company footer line (centered, en-dash separated)
    const footerParts = [
      companyInfo.address,
      companyInfo.phone,
      companyInfo.website,
    ].filter(Boolean);
    if (footerParts.length > 0) {
      doc.text(
        footerParts.join(' \u2013 '),
        pageWidth / 2,
        pageHeight - 12,
        { align: 'center' }
      );
    }
  }

  return doc;
}

function getBudgetFileName(budget: BudgetDetail): string {
  const client = (budget.client_name || 'Client').replace(/\s+/g, '_');
  const project = (budget.project_name || 'Project').replace(/\s+/g, '_');
  const date = new Date().toISOString().split('T')[0];
  return `${client}_${project}_${date}`;
}

/**
 * Generates a PDF report for a budget with professional design (triggers download)
 */
export async function generateBudgetPDF(
  budget: BudgetDetail,
  companyInfo: CompanyInfo = DEFAULT_COMPANY_INFO
): Promise<void> {
  const doc = await buildBudgetDoc(budget, companyInfo);
  doc.save(`${getBudgetFileName(budget)}.pdf`);
}

/**
 * Generates a PDF blob URL for preview (does not trigger download).
 * Caller is responsible for revoking the URL via URL.revokeObjectURL().
 */
export async function generateBudgetPDFPreview(
  budget: BudgetDetail,
  companyInfo: CompanyInfo = DEFAULT_COMPANY_INFO
): Promise<{ url: string; fileName: string }> {
  const doc = await buildBudgetDoc(budget, companyInfo);
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  return { url, fileName: `${getBudgetFileName(budget)}.pdf` };
}
