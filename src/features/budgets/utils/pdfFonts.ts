/**
 * Registers the Figtree font family with a jsPDF instance.
 * Fetches the TTF files, converts to base64, and adds to jsPDF VFS.
 */

import type jsPDF from 'jspdf';
import figtreeRegularUrl from '../../../assets/fonts/Figtree-Regular.ttf';
import figtreeBoldUrl from '../../../assets/fonts/Figtree-Bold.ttf';

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function registerFigtreeFont(doc: jsPDF): Promise<void> {
  const [regularBuf, boldBuf] = await Promise.all([
    fetch(figtreeRegularUrl).then((r) => r.arrayBuffer()),
    fetch(figtreeBoldUrl).then((r) => r.arrayBuffer()),
  ]);

  const regularB64 = arrayBufferToBase64(regularBuf);
  const boldB64 = arrayBufferToBase64(boldBuf);

  doc.addFileToVFS('Figtree-Regular.ttf', regularB64);
  doc.addFont('Figtree-Regular.ttf', 'Figtree', 'normal');

  doc.addFileToVFS('Figtree-Bold.ttf', boldB64);
  doc.addFont('Figtree-Bold.ttf', 'Figtree', 'bold');
}
