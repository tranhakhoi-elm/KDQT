import React from "react";
import {
  LayoutGrid,
  Sparkles,
  Download,
  Printer,
  Languages,
  RotateCcw,
  SlidersHorizontal,
  FileText,
  Bookmark,
} from "lucide-react";
import { CatalogPage, CatalogLayout } from "../types";

interface ToolbarProps {
  currentPage: CatalogPage;
  language: "en" | "vi";
  isExportingPdf: boolean;
  exportProgress: { percent: number; message: string } | null;
  onSetLayout: (layout: CatalogLayout) => void;
  onSelectPreset: (presetIndex: number) => void;
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
  language,
  isExportingPdf,
  exportProgress,
  onSetLayout,
  onSelectPreset,
  onSetLanguage,
  onTriggerBatchAi,
  onTriggerHeaderAi,
  onExportPdf,
  onPrintNative,
  onResetDefaults,
  onToggleQuickEditor,
  isBatchAiLoading,
}) => {
  return (
    <header className="no-print sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Preset Templates */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 pr-3 border-r border-stone-200">
            <div className="w-7 h-7 rounded-full bg-[#E30613] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              E
            </div>
            <div>
              <span className="font-bold text-stone-900 text-sm tracking-tight block leading-tight">
                Elmich Studio
              </span>
              <span className="text-[10px] text-stone-500 font-medium">
                Tạo 1 Trang Catalogue Xuất Khẩu
              </span>
            </div>
          </div>

          {/* Quick Preset Selector */}
          <div className="hidden lg:flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl border border-stone-200">
            <span className="text-[10px] font-semibold text-stone-400 px-1.5 flex items-center gap-1">
              <Bookmark className="w-3 h-3" />
              Mẫu:
            </span>
            <button
              type="button"
              onClick={() => onSelectPreset(0)}
              className="px-2.5 py-1 text-xs rounded-lg font-medium text-stone-700 hover:bg-white hover:shadow-2xs transition-all"
            >
              Ivory Stone (4 ảnh)
            </button>
            <button
              type="button"
              onClick={() => onSelectPreset(1)}
              className="px-2.5 py-1 text-xs rounded-lg font-medium text-stone-700 hover:bg-white hover:shadow-2xs transition-all"
            >
              Taupe & Black (3 ảnh)
            </button>
          </div>
        </div>

        {/* Center: Layout switcher (3 vs 4 images) */}
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

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <button
            type="button"
            onClick={() => onSetLanguage(language === "en" ? "vi" : "en")}
            className="px-2.5 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg flex items-center gap-1.5 border border-stone-200 transition-colors"
            title="Đổi ngôn ngữ cho AI gợi ý"
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
              title="Đổi ý tưởng tên bộ sưu tập"
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
          <div className="flex items-center gap-1.5 pl-1 border-l border-stone-200">
            {/* Primary: Native Print-to-PDF matching Ctrl+P 100% */}
            <button
              type="button"
              onClick={onPrintNative}
              className="px-4 py-1.5 text-xs font-bold bg-[#E30613] hover:bg-[#c90510] text-white rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer ring-2 ring-red-500/20 active:scale-95"
              title="Lưu PDF giữ nguyên 100% font chữ, độ dãn chữ, dãn dòng và tỷ lệ giống như lệnh Ctrl+P (Chọn Lưu dưới dạng PDF)"
            >
              <Printer className="w-3.5 h-3.5 text-white" />
              <span>Lưu PDF (Ctrl+P Chuẩn 100%)</span>
            </button>

            {/* Secondary: Direct jsPDF 300 DPI file download */}
            <button
              type="button"
              onClick={onExportPdf}
              disabled={isExportingPdf}
              className="px-2.5 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg flex items-center gap-1.5 border border-stone-200 transition-colors disabled:opacity-50"
              title="Tải trực tiếp file PDF Vector 300 DPI về máy"
            >
              <Download className="w-3.5 h-3.5 text-stone-500" />
              <span className="hidden sm:inline">{isExportingPdf ? "Đang xuất..." : "Tải jsPDF"}</span>
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
