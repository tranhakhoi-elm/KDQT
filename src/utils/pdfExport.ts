import { toJpeg } from "html-to-image";
import jsPDF from "jspdf";

export interface ExportPdfOptions {
  fileName?: string;
  onProgress?: (progress: number, message: string) => void;
}

export async function exportCatalogToPdf(
  elementIds: string[],
  options: ExportPdfOptions = {}
): Promise<void> {
  const { fileName = "Elmich_Cookware_Catalogue.pdf", onProgress } = options;

  if (elementIds.length === 0) {
    throw new Error("Không có trang nào để xuất PDF");
  }

  // A4 Landscape: 297mm x 210mm
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const pdfWidth = 297;
  const pdfHeight = 210;

  for (let i = 0; i < elementIds.length; i++) {
    const id = elementIds[i];
    const element = document.getElementById(id);

    if (!element) {
      console.warn(`Element with ID ${id} not found`);
      continue;
    }

    onProgress?.(
      Math.round(((i + 0.3) / elementIds.length) * 100),
      `Đang kết xuất trang ${i + 1}/${elementIds.length}...`
    );

    // Save previous styles
    const originalShadow = element.style.boxShadow;
    element.style.boxShadow = "none";

    try {
      // Use html-to-image with skipFonts: true and onImageErrorHandler to prevent SecurityError and rejection
      const imgData = await toJpeg(element, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: "#FAF7F2",
        skipFonts: true,
        fontEmbedCSS: "",
        cacheBust: false,
        onImageErrorHandler: () => {
          // Gracefully continue without throwing {"isTrusted": true}
          return null;
        },
        filter: (node) => {
          if (node instanceof HTMLElement && node.classList.contains("no-print")) {
            return false;
          }
          return true;
        },
      });

      element.style.boxShadow = originalShadow;

      if (i > 0) {
        pdf.addPage([pdfWidth, pdfHeight], "landscape");
      }

      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");
    } catch (renderError: any) {
      console.warn(`Render error on page ${i + 1}, trying with fallback options:`, renderError);
      element.style.boxShadow = originalShadow;

      // Retry with minimal options and error handler
      const fallbackImgData = await toJpeg(element, {
        quality: 0.9,
        pixelRatio: 1.5,
        backgroundColor: "#FAF7F2",
        skipFonts: true,
        fontEmbedCSS: "",
        onImageErrorHandler: () => null,
      });

      if (i > 0) {
        pdf.addPage([pdfWidth, pdfHeight], "landscape");
      }

      pdf.addImage(fallbackImgData, "JPEG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");
    }

    onProgress?.(
      Math.round(((i + 1) / elementIds.length) * 100),
      `Hoàn tất trang ${i + 1}/${elementIds.length}`
    );
  }

  pdf.save(fileName);
}
