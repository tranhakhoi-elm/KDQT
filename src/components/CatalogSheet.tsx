import React from "react";
import { CatalogPage, ProductItem } from "../types";
import { ElmichLogo } from "./ElmichLogo";
import { EditableText } from "./EditableText";
import { CatalogPageItem } from "./CatalogPageItem";

interface CatalogSheetProps {
  page: CatalogPage;
  pageIndex: number;
  language: "en" | "vi";
  onUpdatePage: (updated: Partial<CatalogPage>) => void;
  onRequestImageChange: (itemIndex: number) => void;
  onRequestCropAdjust: (itemIndex: number) => void;
}

export const CatalogSheet: React.FC<CatalogSheetProps> = ({
  page,
  pageIndex,
  language,
  onUpdatePage,
  onRequestImageChange,
  onRequestCropAdjust,
}) => {
  const handleUpdateItem = (itemIndex: number, updated: Partial<ProductItem>) => {
    const newItems = [...page.items];
    newItems[itemIndex] = { ...newItems[itemIndex], ...updated };
    onUpdatePage({ items: newItems });
  };

  // Determine items to display based on layout:
  // If layout is 3, show 3 items. If layout is 4, show 4 items.
  const displayItems = page.items.slice(0, page.layout);

  return (
    <div
      id={`catalog-page-${page.id}`}
      className="print-page w-full max-w-[1100px] aspect-[1.414/1] bg-[#FAF7F2] text-[#231F20] shadow-xl mx-auto flex flex-col justify-between p-8 md:p-12 border border-[#EDE7DD] relative select-text"
      style={{
        boxSizing: "border-box",
        minHeight: "680px",
      }}
    >
      {/* ===== HEADER SECTION ===== */}
      <header className="w-full">
        <div className="flex items-start justify-between gap-6 pb-5">
          {/* Left Title block */}
          <div className="flex-1 space-y-1.5 max-w-[62%]">
            {/* Series Subtitle (e.g. WOOD-HANDLE GRANITE SERIES — NEUTRAL PALETTE) */}
            <div className="text-[11px] font-semibold tracking-[0.24em] text-[#8C7D6D] uppercase leading-none">
              <EditableText
                value={page.seriesSubtitle}
                onChange={(val) => onUpdatePage({ seriesSubtitle: val })}
                placeholder="DÒNG SẢN PHẨM — BỘ SƯU TẬP"
              />
            </div>

            {/* Collection Title (e.g. Ivory Stone Collection) */}
            <h1
              className="text-2xl md:text-[32px] font-serif-heading font-semibold text-[#1F1C1B] tracking-tight leading-tight"
              style={{
                fontFamily: "'Playfair Display', 'Cormorant Garamond', Georgia, serif",
              }}
            >
              <EditableText
                value={page.collectionTitle}
                onChange={(val) => {
                  onUpdatePage({
                    collectionTitle: val,
                    footerCenter: val.toUpperCase(),
                  });
                }}
                placeholder="Tên Bộ Sưu Tập"
              />
            </h1>
          </div>

          {/* Right Logo Reserved Slot & Description block */}
          <div className="flex flex-col items-end text-right max-w-[38%] space-y-2">
            {/* Reserved slot for Elmich Logo: exact dimensions and spacing preserved */}
            <div className="w-[140px] h-[34px] flex items-center justify-end select-none">
              <span className="no-print text-[9px] font-mono text-stone-400 border border-dashed border-stone-300 rounded px-2 py-0.5 tracking-wider">
                [ Vị trí Logo Elmich ]
              </span>
            </div>

            {/* Top right description summary */}
            <p className="text-[11px] text-[#6E665D] leading-relaxed max-w-sm font-normal line-clamp-2 print:line-clamp-2" title="Mô tả bộ sưu tập (Tối đa 2 dòng)">
              <EditableText
                value={page.headerDescription}
                onChange={(val) => onUpdatePage({ headerDescription: val })}
                placeholder="Mô tả kỹ thuật và chất liệu hoàn thiện (tối đa 2 dòng)..."
                multiline
              />
            </p>
          </div>
        </div>

        {/* Fine horizontal divider line */}
        <div className="w-full h-px bg-[#E8E2D8] mb-6" />
      </header>

      {/* ===== MAIN PRODUCT GRID (3 OR 4 COLUMNS) ===== */}
      <main className="flex-1 w-full my-auto py-2">
        <div
          className={`grid gap-4 md:gap-5 w-full items-start ${
            page.layout === 3
              ? "grid-cols-3 max-w-[96%] mx-auto"
              : "grid-cols-4"
          }`}
        >
          {displayItems.map((item, idx) => (
            <CatalogPageItem
              key={item.id || idx}
              item={item}
              index={idx}
              layout={page.layout}
              collectionTitle={page.collectionTitle}
              seriesSubtitle={page.seriesSubtitle}
              language={language}
              onUpdateItem={(updated) => handleUpdateItem(idx, updated)}
              onRequestImageChange={() => onRequestImageChange(idx)}
              onRequestCropAdjust={() => onRequestCropAdjust(idx)}
            />
          ))}
        </div>
      </main>

      {/* ===== FOOTER SECTION (STRICT BRAND PRESERVATION) ===== */}
      <footer className="w-full pt-6 mt-4 border-t border-[#E8E2D8]/80 text-[#8B7F72]">
        <div className="flex items-center justify-between text-[9.5px] font-semibold tracking-[0.22em] uppercase leading-none">
          {/* Left fixed brand credential */}
          <div className="text-left">
            <EditableText
              value={page.footerLeft}
              onChange={(val) => onUpdatePage({ footerLeft: val })}
              placeholder="ELMICH JSC • A LEADING COOKWARE MANUFACTURER IN VIETNAM"
            />
          </div>

          {/* Center collection name */}
          <div className="text-center px-4">
            <EditableText
              value={page.footerCenter}
              onChange={(val) => onUpdatePage({ footerCenter: val })}
              placeholder="COLLECTION TITLE"
            />
          </div>

          {/* Right page number (e.g. 0 2) */}
          <div className="text-right tabular-nums tracking-[0.3em]">
            <EditableText
              value={page.footerPageNumber}
              onChange={(val) => onUpdatePage({ footerPageNumber: val })}
              placeholder="01"
            />
          </div>
        </div>
      </footer>
    </div>
  );
};
