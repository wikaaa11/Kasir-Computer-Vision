
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateReportPDF = (title: string, columns: string[], data: any[][], fileName: string) => {
  const doc = new jsPDF();
  
  // Add Title
  doc.setFontSize(18);
  doc.setTextColor(249, 115, 22); // #f97316 - Orange
  doc.text(title, 14, 20);
  
  // Add Subtitle / Date
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // Text Slate 500
  doc.text(`Generated on: ${new Date().toLocaleString('id-ID')}`, 14, 30);
  
  // Add Table
  autoTable(doc, {
    startY: 35,
    head: [columns],
    body: data,
    theme: 'grid',
    headStyles: { fillColor: [249, 115, 22], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    margin: { top: 35 },
  });
  
  // Save PDF
  doc.save(`${fileName}.pdf`);
};
