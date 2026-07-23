import { useCallback } from "react";

export function useExportPdf() {
  const exportPdf = useCallback(async (elementId: string, filename: string) => {
    const { default: html2canvas } = await import("html2canvas-pro");
    const { default: jsPDF } = await import("jspdf");

    const el = document.getElementById(elementId);
    if (!el) return;

    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#1c1c1e",
    });

    const imgData = canvas.toDataURL("image/png");
    const imgW = canvas.width;
    const imgH = canvas.height;

    const pdfW = 210;
    const pdfH = (imgH * pdfW) / imgW;

    const pdf = new jsPDF("p", "mm", [pdfW, pdfH]);
    pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);
    pdf.save(filename);
  }, []);

  return exportPdf;
}
