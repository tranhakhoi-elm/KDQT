import React, { useState, useEffect } from "react";
import { CatalogPage, CatalogLayout, ProductItem } from "./types";
import { INITIAL_PAGES, SAMPLE_COOKWARE_LIBRARY } from "./data/defaultCatalog";
import { Toolbar } from "./components/Toolbar";
import { CatalogSheet } from "./components/CatalogSheet";
import { ImagePickerModal } from "./components/ImagePickerModal";
import { QuickEditorDrawer } from "./components/QuickEditorDrawer";
import { AiHeaderModal } from "./components/AiHeaderModal";
import { exportCatalogToVectorPdf } from "./utils/pdfVectorExport";
import { CheckCircle2, Sparkles, AlertCircle, Info, Edit3, ImagePlus } from "lucide-react";

export default function App() {
  const [pages, setPages] = useState<CatalogPage[]>(() => {
    const saved = localStorage.getItem("elmich_catalog_pages");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved catalog", e);
      }
    }
    return INITIAL_PAGES;
  });

  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [language, setLanguage] = useState<"en" | "vi">("en");

  // Modals & Drawers state
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
  const [targetItemIndex, setTargetItemIndex] = useState<number>(0);
  const [isQuickEditorOpen, setIsQuickEditorOpen] = useState(false);
  const [isAiHeaderModalOpen, setIsAiHeaderModalOpen] = useState(false);

  // Loading states
  const [isBatchAiLoading, setIsBatchAiLoading] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportProgress, setExportProgress] = useState<{
    percent: number;
    message: string;
  } | null>(null);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<{
    type: "success" | "info" | "error";
    text: string;
  } | null>(null);

  const showToast = (text: string, type: "success" | "info" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Sync with localStorage
  useEffect(() => {
    localStorage.setItem("elmich_catalog_pages", JSON.stringify(pages));
  }, [pages]);

  const currentPage = pages[activePageIndex] || pages[0];

  // Update current page fields
  const handleUpdateCurrentPage = (updated: Partial<CatalogPage>) => {
    setPages((prev) => {
      const next = [...prev];
      next[activePageIndex] = { ...next[activePageIndex], ...updated };
      return next;
    });
  };

  // Switch Layout (3 vs 4 images)
  const handleSetLayout = (newLayout: CatalogLayout) => {
    if (currentPage.layout === newLayout) return;

    let items = [...currentPage.items];
    if (newLayout === 4 && items.length < 4) {
      // Append a 4th default item if needed
      items.push({
        id: `item-${currentPage.id}-4`,
        image: SAMPLE_COOKWARE_LIBRARY[3]?.url || SAMPLE_COOKWARE_LIBRARY[0].url,
        code: "IV-04 • COPPER INTERIOR",
        title: "Ivory Body, Copper-Tone Interior",
        description: "Ivory exterior finished with a warm copper-tone non-stick interior.",
        showSpotDot: true,
        spotDotColor: "#b87333",
      });
    }

    handleUpdateCurrentPage({
      layout: newLayout,
      items,
    });
    showToast(`Đã chuyển sang bố cục ${newLayout} hình ảnh`);
  };

  // Add new page
  const handleAddPage = () => {
    const newPageNum = String(pages.length + 2).padStart(2, "0");
    const newPage: CatalogPage = {
      id: `page-${Date.now()}`,
      name: `Bộ Sưu Tập Mới (Trang ${pages.length + 1})`,
      layout: 4,
      seriesSubtitle: "WOOD-HANDLE GRANITE SERIES — NEUTRAL PALETTE",
      collectionTitle: "Contemporary Kitchen Collection",
      headerDescription: "Premium granite-coated cookware crafted for modern culinary spaces. Engineered with ergonomic handles and high-performance non-stick surfaces.",
      footerLeft: "ELMICH JSC • A LEADING COOKWARE MANUFACTURER IN VIETNAM",
      footerCenter: "CONTEMPORARY KITCHEN COLLECTION",
      footerPageNumber: newPageNum,
      items: [
        {
          id: `item-${Date.now()}-1`,
          image: SAMPLE_COOKWARE_LIBRARY[0].url,
          code: "CK-01 • CORE SET",
          title: "Granite Stone Full Cookware Set",
          description: "Includes stockpot, saucepan and frying pan with glass lids.",
          showSpotDot: true,
          spotDotColor: "#e8ded2",
        },
        {
          id: `item-${Date.now()}-2`,
          image: SAMPLE_COOKWARE_LIBRARY[1].url,
          code: "CK-02 • UTENSIL EDITION",
          title: "Natural Wood Utensil Bundle",
          description: "Cookware set accompanied by heat-resistant utensils.",
          showSpotDot: true,
          spotDotColor: "#f3ede3",
        },
        {
          id: `item-${Date.now()}-3`,
          image: SAMPLE_COOKWARE_LIBRARY[2].url,
          code: "CK-03 • CASSEROLE EDITION",
          title: "Deep Casserole with Soft Handles",
          description: "Forged aluminum body with induction-ready base.",
          showSpotDot: true,
          spotDotColor: "#a3988c",
        },
        {
          id: `item-${Date.now()}-4`,
          image: SAMPLE_COOKWARE_LIBRARY[3].url,
          code: "CK-04 • COPPER TONE",
          title: "Copper Accent Frying Skillet",
          description: "Warm copper-tone interior with anti-scratch coating.",
          showSpotDot: true,
          spotDotColor: "#b87333",
        },
      ],
    };

    setPages((prev) => [...prev, newPage]);
    setActivePageIndex(pages.length);
    showToast("Đã tạo thêm trang catalogue mới!");
  };

  // Duplicate page
  const handleDuplicatePage = () => {
    const duplicated: CatalogPage = {
      ...JSON.parse(JSON.stringify(currentPage)),
      id: `page-${Date.now()}`,
      name: `${currentPage.name} (Bản sao)`,
      footerPageNumber: String(pages.length + 2).padStart(2, "0"),
    };
    setPages((prev) => [...prev, duplicated]);
    setActivePageIndex(pages.length);
    showToast("Đã nhân bản trang thành công!");
  };

  // Delete page
  const handleDeletePage = () => {
    if (pages.length <= 1) {
      showToast("Catalogue cần có ít nhất 1 trang.", "error");
      return;
    }
    const nextPages = pages.filter((_, idx) => idx !== activePageIndex);
    setPages(nextPages);
    setActivePageIndex(Math.max(0, activePageIndex - 1));
    showToast("Đã xóa trang.");
  };

  // Reset to original 2 demo pages
  const handleResetDefaults = () => {
    if (window.confirm("Bạn có chắc chắn muốn khôi phục lại 2 trang demo mẫu ban đầu không?")) {
      setPages(INITIAL_PAGES);
      setActivePageIndex(0);
      showToast("Đã khôi phục 2 trang demo ban đầu.");
    }
  };

  // Open Image Picker
  const handleRequestImageChange = (itemIdx: number) => {
    setTargetItemIndex(itemIdx);
    setIsImagePickerOpen(true);
  };

  // Apply new image and optional AI suggested text
  const handleApplyImageAndText = (
    newImage: string,
    suggestedText?: { code: string; title: string; description: string }
  ) => {
    const updatedItems = [...currentPage.items];
    const currentItem = updatedItems[targetItemIndex];

    updatedItems[targetItemIndex] = {
      ...currentItem,
      image: newImage,
      ...(suggestedText
        ? {
            code: suggestedText.code,
            title: suggestedText.title,
            description: suggestedText.description,
          }
        : {}),
    };

    handleUpdateCurrentPage({ items: updatedItems });
    showToast(
      suggestedText
        ? "Đã cập nhật ảnh và điền thông số do AI gợi ý!"
        : "Đã cập nhật hình ảnh thành công!"
    );
  };

  // AI Full Page Analysis: Compute and update series, collection title, description, materials, and items from all uploaded cookware photos
  const handleTriggerBatchAi = async () => {
    setIsBatchAiLoading(true);
    try {
      const activeItems = currentPage.items.slice(0, currentPage.layout);

      const response = await fetch("/api/ai/suggest-full-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: activeItems,
          layout: currentPage.layout,
          language,
        }),
      });

      const resData = await response.json();
      if (resData.success && resData.data) {
        const {
          seriesSubtitle,
          collectionTitle,
          headerDescription,
          items: aiItems,
        } = resData.data;

        const newItems = [...currentPage.items];
        if (Array.isArray(aiItems)) {
          aiItems.forEach((aiItem: any, idx: number) => {
            if (newItems[idx]) {
              newItems[idx] = {
                ...newItems[idx],
                code: aiItem.code || newItems[idx].code,
                title: aiItem.title || newItems[idx].title,
                description: aiItem.description || newItems[idx].description,
                spotDotColor: aiItem.spotDotColor || newItems[idx].spotDotColor || "#e8ded2",
                showSpotDot: true,
              };
            }
          });
        }

        const newCollectionTitle = collectionTitle || currentPage.collectionTitle;

        handleUpdateCurrentPage({
          seriesSubtitle: seriesSubtitle || currentPage.seriesSubtitle,
          collectionTitle: newCollectionTitle,
          headerDescription: headerDescription || currentPage.headerDescription,
          footerCenter: newCollectionTitle.toUpperCase(),
          items: newItems,
        });

        showToast(
          `AI đã phân tích tất cả ảnh & cập nhật toàn bộ nội dung bộ sưu tập nồi chảo thành công!`
        );
      } else {
        throw new Error(resData.error || "Không thể phân tích ảnh");
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Lỗi khi gọi AI phân tích", "error");
    } finally {
      setIsBatchAiLoading(false);
    }
  };

  // Export PDF Vector (Editable text in Illustrator/Acrobat + 300 DPI images)
  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    setExportProgress({ percent: 5, message: "Đang tạo tài liệu PDF Vector chuẩn thiết kế (300 DPI)..." });

    try {
      await exportCatalogToVectorPdf(pages, {
        fileName: `Elmich_Catalogue_${currentPage.collectionTitle.replace(/\s+/g, "_")}_Vector.pdf`,
        onProgress: (percent, message) => {
          setExportProgress({ percent, message });
        },
      });

      showToast("Xuất file PDF Vector thành công! Mở được trong phần mềm thiết kế và sửa được text.");
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Có lỗi khi xuất PDF Vector", "error");
    } finally {
      setIsExportingPdf(false);
      setExportProgress(null);
    }
  };

  // Native Print
  const handlePrintNative = () => {
    window.print();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#EDE8E0] text-stone-900">
      {/* Top Navigation & Toolbar */}
      <Toolbar
        currentPage={currentPage}
        totalPages={pages.length}
        currentPageIndex={activePageIndex}
        pages={pages}
        language={language}
        isExportingPdf={isExportingPdf}
        exportProgress={exportProgress}
        onSelectPage={(idx) => setActivePageIndex(idx)}
        onSetLayout={handleSetLayout}
        onAddPage={handleAddPage}
        onDuplicatePage={handleDuplicatePage}
        onDeletePage={handleDeletePage}
        onSetLanguage={(lang) => {
          setLanguage(lang);
          showToast(`Đã chuyển ngôn ngữ AI sang: ${lang === "en" ? "Tiếng Anh (Export)" : "Tiếng Việt"}`);
        }}
        onTriggerBatchAi={handleTriggerBatchAi}
        onTriggerHeaderAi={() => setIsAiHeaderModalOpen(true)}
        onExportPdf={handleExportPdf}
        onPrintNative={handlePrintNative}
        onResetDefaults={handleResetDefaults}
        onToggleQuickEditor={() => setIsQuickEditorOpen(!isQuickEditorOpen)}
        isBatchAiLoading={isBatchAiLoading}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 overflow-auto p-4 md:p-8 flex flex-col items-center justify-start">
        {/* Helper Banner for Users */}
        <div className="no-print max-w-[1100px] w-full mb-4 bg-white/80 backdrop-blur-xs border border-stone-200/80 rounded-xl p-3 px-4 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-600 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="p-1 bg-red-100 text-red-600 rounded-md">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <span>
              <strong>Chỉnh sửa trực tiếp:</strong> Bạn có thể nhấp chuột vào bất kỳ dòng chữ nào trên trang catalogue bên dưới để gõ sửa nội dung ngay tại chỗ!
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-medium text-stone-500">
            <span className="flex items-center gap-1">
              <ImagePlus className="w-3.5 h-3.5 text-stone-400" />
              Rê chuột vào ảnh để đổi ảnh hoặc nhờ AI gợi ý
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="flex items-center gap-1">
              <Edit3 className="w-3.5 h-3.5 text-stone-400" />
              Chân trang & Logo được cố định đúng chuẩn Elmich
            </span>
          </div>
        </div>

        {/* Visible Active Catalog Sheet */}
        <div className="w-full flex justify-center py-2">
          <CatalogSheet
            page={currentPage}
            pageIndex={activePageIndex}
            language={language}
            onUpdatePage={handleUpdateCurrentPage}
            onRequestImageChange={handleRequestImageChange}
          />
        </div>

        {/* Offscreen & Print Container for all pages (NO duplicate IDs in DOM) */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed -left-[9999px] top-0 overflow-hidden w-[1100px] print:static print:pointer-events-auto print:overflow-visible print:w-full print:block"
        >
          {pages.map((p, idx) => {
            if (idx === activePageIndex) return null; // Already rendered and visible in DOM
            return (
              <div key={`page-render-${p.id}`} className="mb-8 print:mb-0 print:break-after-page">
                <CatalogSheet
                  page={p}
                  pageIndex={idx}
                  language={language}
                  onUpdatePage={() => {}}
                  onRequestImageChange={() => {}}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="no-print fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg bg-stone-900 text-white text-xs font-medium animate-in slide-in-from-bottom-5">
          {toastMessage.type === "success" && (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          {toastMessage.type === "error" && (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          {toastMessage.type === "info" && (
            <Info className="w-4 h-4 text-sky-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Modals & Drawers */}
      <ImagePickerModal
        isOpen={isImagePickerOpen}
        onClose={() => setIsImagePickerOpen(false)}
        item={currentPage.items[targetItemIndex] || currentPage.items[0]}
        itemIndex={targetItemIndex}
        collectionTitle={currentPage.collectionTitle}
        seriesSubtitle={currentPage.seriesSubtitle}
        language={language}
        onApplyImageAndText={handleApplyImageAndText}
      />

      <QuickEditorDrawer
        isOpen={isQuickEditorOpen}
        onClose={() => setIsQuickEditorOpen(false)}
        currentPage={currentPage}
        pageIndex={activePageIndex}
        totalPages={pages.length}
        onUpdatePage={handleUpdateCurrentPage}
        onDuplicatePage={handleDuplicatePage}
        onDeletePage={handleDeletePage}
        onResetDefaults={handleResetDefaults}
        onRequestImageChange={handleRequestImageChange}
      />

      <AiHeaderModal
        isOpen={isAiHeaderModalOpen}
        onClose={() => setIsAiHeaderModalOpen(false)}
        language={language}
        onApplyHeader={(newHeader) => {
          handleUpdateCurrentPage(newHeader);
          showToast("Đã cập nhật tiêu đề và mô tả bộ sưu tập mới từ AI!");
        }}
      />
    </div>
  );
}
