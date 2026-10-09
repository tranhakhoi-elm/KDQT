import jsPDF from "jspdf";
import { CatalogPage } from "../types";

export interface VectorPdfOptions {
  fileName?: string;
  onProgress?: (progress: number, message: string) => void;
}

// Convert image URL to high-resolution 300 DPI Data URL with central object-fit: cover crop
async function prepare300DpiImage(
  url: string,
  targetWidthMm: number,
  targetHeightMm: number
): Promise<string> {
  return new Promise((resolve) => {
    // 300 DPI calculation: 1 inch = 25.4 mm => pixels = (mm / 25.4) * 300
    const outWidthPx = Math.round((targetWidthMm / 25.4) * 300);
    const outHeightPx = Math.round((targetHeightMm / 25.4) * 300);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = outWidthPx;
        canvas.height = outHeightPx;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";

          const naturalW = img.naturalWidth || outWidthPx;
          const naturalH = img.naturalHeight || outHeightPx;

          const targetAspect = targetWidthMm / targetHeightMm;
          const imgAspect = naturalW / naturalH;

          let sx = 0;
          let sy = 0;
          let sw = naturalW;
          let sh = naturalH;

          // Exact object-fit: cover central crop calculation (prevents stretching/distortion)
          if (imgAspect > targetAspect) {
            // Source image is wider than target frame: crop left & right
            sw = Math.round(naturalH * targetAspect);
            sx = Math.round((naturalW - sw) / 2);
          } else {
            // Source image is taller than target frame: crop top & bottom
            sh = Math.round(naturalW / targetAspect);
            sy = Math.round((naturalH - sh) / 2);
          }

          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outWidthPx, outHeightPx);
          resolve(canvas.toDataURL("image/jpeg", 0.95));
          return;
        }
      } catch (e) {
        console.warn("Canvas crop fallback:", e);
      }
      resolve(url);
    };

    img.onerror = () => {
      // Fallback to placeholder if image fails to load
      const canvas = document.createElement("canvas");
      canvas.width = outWidthPx;
      canvas.height = outHeightPx;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#EAE5DC";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.9));
        return;
      }
      resolve(url);
    };

    img.src = url;
  });
}

// Cache for TrueType fonts matching the exact fonts on the web UI:
// Title: Playfair Display
// Body/Headers: Plus Jakarta Sans
let cachedPlayfair: string | null = null;
let cachedJakartaRegular: string | null = null;
let cachedJakartaBold: string | null = null;

async function loadUnicodeFonts(pdf: jsPDF): Promise<{ sans: string; serif: string }> {
  try {
    // 1. Playfair Display SemiBold for collection titles
    if (!cachedPlayfair) {
      const res = await fetch(
        "https://fonts.gstatic.com/s/playfairdisplay/v40/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKebukDQ.ttf"
      );
      if (res.ok) {
        const buf = await res.arrayBuffer();
        cachedPlayfair = arrayBufferToBase64(buf);
      }
    }

    // 2. Plus Jakarta Sans Regular for descriptions & subtitle
    if (!cachedJakartaRegular) {
      const res = await fetch(
        "https://fonts.gstatic.com/s/plusjakartasans/v12/LDIbaomQNQcsA88c7O9yZ4KMCoOg4IA6-91aHEjcWuA_qU7NSg.ttf"
      );
      if (res.ok) {
        const buf = await res.arrayBuffer();
        cachedJakartaRegular = arrayBufferToBase64(buf);
      }
    }

    // 3. Plus Jakarta Sans Bold for item codes & titles
    if (!cachedJakartaBold) {
      const res = await fetch(
        "https://fonts.gstatic.com/s/plusjakartasans/v12/LDIbaomQNQcsA88c7O9yZ4KMCoOg4IA6-91aHEjcWuA_TknNSg.ttf"
      );
      if (res.ok) {
        const buf = await res.arrayBuffer();
        cachedJakartaBold = arrayBufferToBase64(buf);
      }
    }

    if (cachedPlayfair && cachedJakartaRegular && cachedJakartaBold) {
      pdf.addFileToVFS("PlayfairDisplay.ttf", cachedPlayfair);
      pdf.addFont("PlayfairDisplay.ttf", "PlayfairDisplay", "bold");

      pdf.addFileToVFS("PlusJakartaSans-Regular.ttf", cachedJakartaRegular);
      pdf.addFont("PlusJakartaSans-Regular.ttf", "PlusJakartaSans", "normal");

      pdf.addFileToVFS("PlusJakartaSans-Bold.ttf", cachedJakartaBold);
      pdf.addFont("PlusJakartaSans-Bold.ttf", "PlusJakartaSans", "bold");

      return { sans: "PlusJakartaSans", serif: "PlayfairDisplay" };
    }
  } catch (err) {
    console.warn("Could not load Google TTF fonts, falling back to standard fonts:", err);
  }
  return { sans: "helvetica", serif: "times" };
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function exportCatalogToVectorPdf(
  pages: CatalogPage[],
  options: VectorPdfOptions = {}
): Promise<void> {
  const { fileName = "Elmich_Cookware_Catalogue_Vector.pdf", onProgress } = options;

  if (pages.length === 0) {
    throw new Error("Không có trang nào để xuất PDF");
  }

  // A4 Landscape: 297mm width × 210mm height
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  onProgress?.(10, "Đang khởi tạo phông chữ vector và cấu trúc trang...");
  const fonts = await loadUnicodeFonts(pdf);
  const fontFamily = fonts.sans;
  const titleFontFamily = fonts.serif;

  for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
    const page = pages[pageIdx];
    const progressBase = Math.round((pageIdx / pages.length) * 100);

    onProgress?.(
      progressBase + 10,
      `Đang dựng trang vector ${pageIdx + 1}/${pages.length}...`
    );

    if (pageIdx > 0) {
      pdf.addPage([297, 210], "landscape");
    }

    // 1. PURE VECTOR BACKGROUND (#FAF7F2 warm ivory stone)
    pdf.setFillColor(250, 247, 242);
    pdf.rect(0, 0, 297, 210, "F");

    // Margins
    const marginX = 16;
    const contentWidth = 265; // 297 - 16*2 = 265mm
    const rightMarginX = marginX + contentWidth; // 281mm

    // 2. VECTOR HEADER SECTION
    // Series Subtitle (e.g. WOOD-HANDLE GRANITE SERIES — NEUTRAL PALETTE)
    pdf.setFont(fontFamily, "bold");
    pdf.setFontSize(7.5);
    pdf.setTextColor(140, 125, 109); // #8C7D6D
    pdf.text((page.seriesSubtitle || "").toUpperCase(), marginX, 18);

    // Collection Title (e.g. Ivory Stone Collection) - Editable vector text object
    pdf.setFont(titleFontFamily, "bold");
    pdf.setFontSize(22);
    pdf.setTextColor(31, 28, 27); // #1F1C1B
    pdf.text(page.collectionTitle || "Collection Title", marginX, 27.5);

    // Elmich Logo (Top Right: Exact brand Red Circle with black dynamic orbital swoosh arc + wordmark)
    const logoX = rightMarginX - 25;
    const logoY = 16.5;
    pdf.setFillColor(227, 30, 36); // Elmich Red #E31E24
    pdf.circle(logoX, logoY, 4.2, "F");

    // Dynamic sweeping black swoosh arc
    pdf.setDrawColor(29, 29, 27); // #1D1D1B
    pdf.setLineWidth(0.7);
    pdf.line(logoX - 5.2, logoY + 3.4, logoX + 4.6, logoY - 2.8);

    // Elmich brand text in exact brand black
    pdf.setFont(fontFamily, "bold");
    pdf.setFontSize(13);
    pdf.setTextColor(29, 29, 27); // #1D1D1B
    pdf.text("elmich", logoX + 6.2, logoY + 1.2);

    // Header Right Description (Technical summary)
    pdf.setFont(fontFamily, "normal");
    pdf.setFontSize(7.2);
    pdf.setTextColor(110, 102, 93); // #6E665D

    const descLines = pdf.splitTextToSize(page.headerDescription || "", 78);
    pdf.text(descLines, rightMarginX, 22.5, { align: "right" });

    // Hairline Divider Line (Vector Stroke)
    pdf.setDrawColor(232, 226, 216); // #E8E2D8
    pdf.setLineWidth(0.25);
    pdf.line(marginX, 32.5, rightMarginX, 32.5);

    // 3. PRODUCT ITEMS (3 OR 4 COLUMNS)
    const count = page.layout;
    const activeItems = page.items.slice(0, count);

    const colGap = count === 3 ? 12.5 : 7;
    const colWidth = (contentWidth - (count - 1) * colGap) / count;
    const imgHeight = count === 3 ? 98 : 82;
    const imgStartY = count === 3 ? 37 : 38;

    for (let colIdx = 0; colIdx < activeItems.length; colIdx++) {
      const item = activeItems[colIdx];
      const itemX = marginX + colIdx * (colWidth + colGap);

      onProgress?.(
        progressBase + 15 + Math.round((colIdx / count) * 35),
        `Đang xử lý ảnh 300 DPI sản phẩm ${colIdx + 1}/${count} (Trang ${pageIdx + 1})...`
      );

      // Embedded 300 DPI High-Res Image
      const highResBase64 = await prepare300DpiImage(
        item.image,
        colWidth,
        imgHeight
      );

      pdf.addImage(
        highResBase64,
        "JPEG",
        itemX,
        imgStartY,
        colWidth,
        imgHeight,
        `img_${pageIdx}_${colIdx}`,
        "FAST"
      );

      // Spot color dot / swatch if enabled (Vector circle)
      if (item.showSpotDot) {
        const dotColor = item.spotDotColor || "#ffffff";
        const rgb = hexToRgb(dotColor);
        pdf.setFillColor(rgb.r, rgb.g, rgb.b);
        pdf.setDrawColor(0, 0, 0);
        pdf.setLineWidth(0.15);
        pdf.circle(itemX + 3.5, imgStartY + 3.5, 1.8, "FD");
      }

      // Text Section under Image (PURE VECTOR TEXT)
      const textStartY = imgStartY + imgHeight + 4.5;

      // Item Code (e.g. IV-01 • FW26 CORE SET)
      pdf.setFont(fontFamily, "bold");
      pdf.setFontSize(6.2);
      pdf.setTextColor(140, 125, 109); // #8C7D6D
      pdf.text((item.code || "").toUpperCase(), itemX, textStartY);

      // Item Title (e.g. Ivory Speckle, Full Set + Griddle)
      pdf.setFont(fontFamily, "bold");
      pdf.setFontSize(count === 3 ? 9.5 : 8.5);
      pdf.setTextColor(30, 27, 25); // #1E1B19
      const titleLines = pdf.splitTextToSize(item.title || "", colWidth);
      pdf.text(titleLines, itemX, textStartY + 4.2);

      // Item Description
      const descOffset = textStartY + 4.2 + (titleLines.length * 3.8);
      pdf.setFont(fontFamily, "normal");
      pdf.setFontSize(6.8);
      pdf.setTextColor(99, 91, 83); // #635B53
      const itemDescLines = pdf.splitTextToSize(item.description || "", colWidth);
      pdf.text(itemDescLines, itemX, descOffset);
    }

    // 4. VECTOR FOOTER SECTION (STRICT BRAND PRESERVATION)
    const footerLineY = 196.5;
    pdf.setDrawColor(232, 226, 216);
    pdf.setLineWidth(0.25);
    pdf.line(marginX, footerLineY, rightMarginX, footerLineY);

    const footerTextY = 202;
    pdf.setFont(fontFamily, "bold");
    pdf.setFontSize(6.2);
    pdf.setTextColor(139, 127, 114); // #8B7F72

    // Left fixed credential
    pdf.text(
      (page.footerLeft || "ELMICH JSC • A LEADING COOKWARE MANUFACTURER IN VIETNAM").toUpperCase(),
      marginX,
      footerTextY
    );

    // Center collection name
    pdf.text(
      (page.footerCenter || page.collectionTitle || "").toUpperCase(),
      148.5,
      footerTextY,
      { align: "center" }
    );

    // Right page number
    pdf.text(
      page.footerPageNumber || String(pageIdx + 2).padStart(2, "0"),
      rightMarginX,
      footerTextY,
      { align: "right" }
    );
  }

  onProgress?.(100, "Hoàn tất tạo file PDF Vector chuẩn in ấn!");
  pdf.save(fileName);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace("#", "");
  if (clean.length === 3) {
    clean = clean.split("").map((c) => c + c).join("");
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return { r: 255, g: 255, b: 255 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}
