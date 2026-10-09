import React, { useState } from "react";
import {
  LayoutGrid,
  Sparkles,
  Download,
  Printer,
  Plus,
  Trash2,
  Copy,
  Languages,
  RotateCcw,
  SlidersHorizontal,
  FileText,
  Info,
} from "lucide-react";
import { CatalogPage, CatalogLayout } from "../types";

interface ToolbarProps {
  currentPage: CatalogPage;
  totalPages: number;
  currentPageIndex: number;
  pages: CatalogPage[];
  language: "en" | "vi";
  isExportingPdf: boolean;
  exportProgress: { percent: number; message: string } | null;
  onSelectPage: (index: number) => void;
  onSetLayout: (layout: CatalogLayout) => void;
  onAddPage: () => void;
  onDuplicatePage: () => void;
  onDeletePage: () => void;
  onSetLanguage: (lang: "en" | "vi") => void;
  onTriggerBatchAi: () => void;
  onTriggerHeaderAi: () => void;
  onExportPdf: () => void;
  onPrintNative: () => void;
  onResetDefaults: () => void;
  onToggleQuickEditor: () => void;
  isBatchAiLoading: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  currentPage,
  totalPages,
  currentPageIndex,
  pages,
  language,
  isExportingPdf,
  exportProgress,
  onSelectPage,
  onSetLayout,
  onAddPage,
  onDuplicatePage,
  onDeletePage,
  onSetLanguage,
  onTriggerBatchAi,
  onTriggerHeaderAi,
  onExportPdf,
  onPrintNative,
  onResetDefaults,
  onToggleQuickEditor,
  isBatchAiLoading,
}) => {
  const [showAiMenu, setShowAiMenu] = useState(false);
  const [showInfoTip, setShowInfoTip] = useState(false);

  return (
    <header className="no-print sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Page Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 pr-3 border-r border-stone-200">
            <div className="w-7 h-7 rounded-full bg-[#E30613] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              E
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-stone-900 text-sm tracking-tight block leading-tight">
                Elmich Catalog Studio
              </span>
              <span className="text-[10px] text-stone-500 font-medium">
                Xuất khẩu & Thiết kế Trang Catalog
              </span>
            </div>
          </div>

          {/* Page Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            {pages.map((p, idx) => (
              <button
                key={p.id}
                onClick={() => onSelectPage(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 flex items-center gap-1.5 ${
                  currentPageIndex === idx
                    ? "bg-stone-900 text-white shadow-xs"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200/80"
                }`}
              >
                <span>Trang {idx + 1}</span>
                <span className="text-[10px] opacity-75">
                  ({p.layout} ảnh)
                </span>
              </button>
            ))}

            <button
              onClick={onAddPage}
              title="Thêm trang mới"
              className="p-1.5 rounded-lg bg-stone-100 hover:bg-red-50 text-stone-600 hover:text-red-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center / Layout selector (3 vs 4 images) */}
        <div className="flex items-center gap-2 bg-stone-100 p-1 rounded-xl border border-stone-200">
          <span className="text-[11px] font-semibold text-stone-500 px-2 flex items-center gap-1">
            <LayoutGrid className="w-3.5 h-3.5" />
            Bố cục:
          </span>
          <button
            type="button"
            onClick={() => onSetLayout(3)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              currentPage.layout === 3
                ? "bg-white text-red-600 shadow-xs border border-stone-200/80"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            3 Hình ảnh
          </button>
          <button
            type="button"
            onClick={() => onSetLayout(4)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              currentPage.layout === 4
                ? "bg-white text-red-600 shadow-xs border border-stone-200/80"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            4 Hình ảnh
          </button>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <button
            type="button"
            onClick={() => onSetLanguage(language === "en" ? "vi" : "en")}
            className="px-2.5 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg flex items-center gap-1.5 border border-stone-200 transition-colors"
            title="Đổi ngôn ngữ cho AI gợi ý text"
          >
            <Languages className="w-3.5 h-3.5 text-stone-500" />
            <span>{language === "en" ? "EN (Export)" : "VI (Tiếng Việt)"}</span>
          </button>

          {/* AI Full Page Content Suggestion from Uploaded Photos */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onTriggerBatchAi}
              disabled={isBatchAiLoading}
              className="px-3.5 py-1.5 text-xs font-semibold bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white hover:from-red-700 hover:to-rose-800 rounded-lg shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
              title="Phân tích tất cả ảnh đã tải lên để AI tự động tính toán & cập nhật tên dòng sản phẩm, chất liệu, màu sắc và mô tả ngắn gọn"
            >
              {isBatchAiLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>AI đang phân tích các ảnh...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Gợi Ý Nội Dung Theo Ảnh</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onTriggerHeaderAi}
              className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors border border-stone-200"
              title="Đổi tên bộ sưu tập theo từ khóa mới"
            >
              <FileText className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Inspector Editor */}
          <button
            type="button"
            onClick={onToggleQuickEditor}
            className="p-2 text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors border border-stone-200"
            title="Bảng sửa nhanh nội dung"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          {/* PDF Export Action */}
          <div className="flex items-center gap-1 pl-1 border-l border-stone-200">
            <button
              type="button"
              onClick={onExportPdf}
              disabled={isExportingPdf}
              className="px-3.5 py-1.5 text-xs font-semibold bg-stone-900 hover:bg-black text-white rounded-lg shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
              title="Xuất file PDF giữ nguyên text vector (mở và sửa text trong Adobe Illustrator/Acrobat) & ảnh 300 DPI"
            >
              <Download className="w-3.5 h-3.5 text-red-400" />
              <span>{isExportingPdf ? "Đang xuất..." : "Lưu PDF Vector (300 DPI)"}</span>
            </button>

            <button
              type="button"
              onClick={onPrintNative}
              className="p-2 text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors border border-stone-200"
              title="In / Lưu Vector PDF Trình duyệt (A4 Landscape 300 DPI)"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Export progress toast bar */}
      {isExportingPdf && exportProgress && (
        <div className="bg-red-600 text-white text-xs py-1.5 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            <span>{exportProgress.message}</span>
          </div>
          <span className="font-mono font-bold">{exportProgress.percent}%</span>
        </div>
      )}
    </header>
  );
};
