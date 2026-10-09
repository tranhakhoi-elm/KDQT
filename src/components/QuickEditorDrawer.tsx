import React from "react";
import { X, Sparkles, Image as ImageIcon, Trash2, Copy, RotateCcw } from "lucide-react";
import { CatalogPage, ProductItem } from "../types";

interface QuickEditorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage: CatalogPage;
  pageIndex: number;
  totalPages: number;
  onUpdatePage: (updated: Partial<CatalogPage>) => void;
  onDuplicatePage: () => void;
  onDeletePage: () => void;
  onResetDefaults: () => void;
  onRequestImageChange: (itemIndex: number) => void;
}

export const QuickEditorDrawer: React.FC<QuickEditorDrawerProps> = ({
  isOpen,
  onClose,
  currentPage,
  pageIndex,
  totalPages,
  onUpdatePage,
  onDuplicatePage,
  onDeletePage,
  onResetDefaults,
  onRequestImageChange,
}) => {
  if (!isOpen) return null;

  const handleUpdateItem = (itemIdx: number, field: keyof ProductItem, val: string) => {
    const updatedItems = [...currentPage.items];
    updatedItems[itemIdx] = {
      ...updatedItems[itemIdx],
      [field]: val,
    };
    onUpdatePage({ items: updatedItems });
  };

  const activeItems = currentPage.items.slice(0, currentPage.layout);

  return (
    <div className="no-print fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-white shadow-2xl border-l border-stone-200 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
        <div>
          <h3 className="text-sm font-bold text-stone-900">
            Chỉnh sửa nội dung Trang #{pageIndex + 1}
          </h3>
          <p className="text-[11px] text-stone-500">
            Bố cục: {currentPage.layout} ảnh • Có thể gõ sửa trực tiếp trên trang
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-200/50"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Drawer Body Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Header Section Fields */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
            1. Tiêu đề & Thông tin đầu trang
          </h4>

          <div>
            <label className="block text-[11px] font-semibold text-stone-700 mb-1">
              Dòng sê-ri / Subtitle:
            </label>
            <input
              type="text"
              value={currentPage.seriesSubtitle}
              onChange={(e) => onUpdatePage({ seriesSubtitle: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-md focus:ring-1 focus:ring-red-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-stone-700 mb-1">
              Tên Bộ Sưu Tập (Collection Title):
            </label>
            <input
              type="text"
              value={currentPage.collectionTitle}
              onChange={(e) =>
                onUpdatePage({
                  collectionTitle: e.target.value,
                  footerCenter: e.target.value.toUpperCase(),
                })
              }
              className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-md focus:ring-1 focus:ring-red-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-stone-700 mb-1">
              Mô tả đầu trang (Header description):
            </label>
            <textarea
              rows={2}
              value={currentPage.headerDescription}
              onChange={(e) => onUpdatePage({ headerDescription: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-md focus:ring-1 focus:ring-red-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Product Items Fields */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center justify-between">
            <span>2. Danh sách {currentPage.layout} sản phẩm</span>
          </h4>

          {activeItems.map((item, idx) => (
            <div
              key={item.id || idx}
              className="p-3 bg-stone-50 rounded-lg border border-stone-200/80 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-800">
                  Vị trí #{idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => onRequestImageChange(idx)}
                  className="text-[11px] text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  Đổi ảnh
                </button>
              </div>

              <div>
                <label className="block text-[10px] text-stone-500 mb-0.5">
                  Mã & Phiên bản (Code / Edition):
                </label>
                <input
                  type="text"
                  value={item.code}
                  onChange={(e) => handleUpdateItem(idx, "code", e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-stone-300 rounded focus:ring-1 focus:ring-red-500 focus:outline-none uppercase font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] text-stone-500 mb-0.5">
                  Tên sản phẩm (Title):
                </label>
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => handleUpdateItem(idx, "title", e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-stone-300 rounded focus:ring-1 focus:ring-red-500 focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] text-stone-500 mb-0.5">
                  Mô tả sản phẩm (Description):
                </label>
                <textarea
                  rows={2}
                  value={item.description}
                  onChange={(e) =>
                    handleUpdateItem(idx, "description", e.target.value)
                  }
                  className="w-full px-2 py-1 text-xs border border-stone-300 rounded focus:ring-1 focus:ring-red-500 focus:outline-none"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Footer Section Fields */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
            3. Chân trang (Footer)
          </h4>

          <div>
            <label className="block text-[11px] font-semibold text-stone-700 mb-1">
              Chữ bên trái (Giữ nguyên nhận diện Elmich):
            </label>
            <input
              type="text"
              value={currentPage.footerLeft}
              onChange={(e) => onUpdatePage({ footerLeft: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-md focus:ring-1 focus:ring-red-500 focus:outline-none font-mono text-[10px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                Tiêu đề giữa:
              </label>
              <input
                type="text"
                value={currentPage.footerCenter}
                onChange={(e) => onUpdatePage({ footerCenter: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-md focus:ring-1 focus:ring-red-500 focus:outline-none font-mono text-[10px]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                Số trang:
              </label>
              <input
                type="text"
                value={currentPage.footerPageNumber}
                onChange={(e) =>
                  onUpdatePage({ footerPageNumber: e.target.value })
                }
                className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-md focus:ring-1 focus:ring-red-500 focus:outline-none font-mono text-center"
              />
            </div>
          </div>
        </div>

        {/* Page Management Actions */}
        <div className="pt-4 border-t border-stone-200 space-y-2">
          <button
            type="button"
            onClick={onDuplicatePage}
            className="w-full py-2 px-3 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            Nhân bản trang này
          </button>

          {totalPages > 1 && (
            <button
              type="button"
              onClick={onDeletePage}
              className="w-full py-2 px-3 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Xóa trang này
            </button>
          )}

          <button
            type="button"
            onClick={onResetDefaults}
            className="w-full py-2 px-3 text-xs font-medium text-stone-500 hover:text-stone-800 flex items-center justify-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Khôi phục 2 trang demo mẫu ban đầu
          </button>
        </div>
      </div>
    </div>
  );
};
