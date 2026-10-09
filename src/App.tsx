import React, { useState, useEffect } from "react";
import { CatalogPage, CatalogLayout, ProductItem } from "./types";
import { INITIAL_PAGES, SAMPLE_COOKWARE_LIBRARY } from "./data/defaultCatalog";
import { Toolbar } from "./components/Toolbar";
import { CatalogSheet } from "./components/CatalogSheet";
import { ImagePickerModal } from "./components/ImagePickerModal";
import { ImageAdjustModal } from "./components/ImageAdjustModal";
import { QuickEditorDrawer } from "./components/QuickEditorDrawer";
import { AiHeaderModal } from "./components/AiHeaderModal";
import { exportCatalogToVectorPdf } from "./utils/pdfVectorExport";
import { CheckCircle2, Sparkles, AlertCircle, Info, Edit3, ImagePlus, Crop } from "lucide-react";

export default function App() {
  // Single page state (multi-page temporarily disabled per user request)
  const [page, setPage] = useState<CatalogPage>(() => {
    const saved = localStorage.getItem("elmich_catalog_single_page");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved catalog", e);
      }
    }
    return INITIAL_PAGES[0];
  });

  const [language, setLanguage] = useState<"en" | "vi">("en");

  // Modals & Drawers state
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
  const [targetItemIndex, setTargetItemIndex] = useState<number>(0);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [activeCropItemIndex, setActiveCropItemIndex] = useState<number>(0);
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
    localStorage.setItem("elmich_catalog_single_page", JSON.stringify(page));
  }, [page]);

  // Update current page fields
  const handleUpdatePage = (updated: Partial<CatalogPage>) => {
    setPage((prev) => ({ ...prev, ...updated }));
  };

  // Switch Layout (3 vs 4 images)
  const handleSetLayout = (newLayout: CatalogLayout) => {
    if (page.layout === newLayout) return;

    let items = [...page.items];
    if (newLayout === 4 && items.length < 4) {
      // Append a 4th default item if needed
      items.push({
        id: `item-${page.id}-4`,
        image: SAMPLE_COOKWARE_LIBRARY[3]?.url || SAMPLE_COOKWARE_LIBRARY[0].url,
        code: "IV-04 • COPPER INTERIOR",
        title: "Ivory Body, Copper-Tone Interior",
        description: "Ivory exterior finished with a warm copper-tone non-stick interior.",
        showSpotDot: true,
        spotDotColor: "#b87333",
        zoom: 1.0,
        panX: 0,
        panY: 0,
        fitMode: "cover",
      });
    }

    handleUpdatePage({
      layout: newLayout,
      items,
    });
    showToast(`Đã chuyển sang bố cục ${newLayout} hình ảnh`);
  };

  // Switch between presets (Ivory Stone 4 photos vs Taupe & Black 3 photos)
  const handleSelectPreset = (presetIndex: number) => {
    const template = INITIAL_PAGES[presetIndex] || INITIAL_PAGES[0];
    setPage(JSON.parse(JSON.stringify(template)));
    showToast(`Đã nạp mẫu: ${template.name}`);
  };

  // Reset to original demo
  const handleResetDefaults = () => {
    if (window.confirm("Bạn có chắc chắn muốn khôi phục lại trang demo mẫu ban đầu không?")) {
      setPage(JSON.parse(JSON.stringify(INITIAL_PAGES[0])));
      showToast("Đã khôi phục trang demo ban đầu.");
    }
  };

  // Open Image Picker
  const handleRequestImageChange = (itemIdx: number) => {
    setTargetItemIndex(itemIdx);
    setIsImagePickerOpen(true);
  };

  // Open Crop & Zoom Modal
  const handleRequestCropAdjust = (itemIdx: number) => {
    setActiveCropItemIndex(itemIdx);
    setIsCropModalOpen(true);
  };

  // Apply Crop & Zoom adjustment to item
  const handleApplyCropAdjustment = (adjustment: {
    zoom: number;
    panX: number;
    panY: number;
    fitMode: "cover" | "contain";
  }) => {
    const updatedItems = [...page.items];
    if (updatedItems[activeCropItemIndex]) {
      updatedItems[activeCropItemIndex] = {
        ...updatedItems[activeCropItemIndex],
        zoom: adjustment.zoom,
        panX: adjustment.panX,
        panY: adjustment.panY,
        fitMode: adjustment.fitMode,
      };
      handleUpdatePage({ items: updatedItems });
      showToast("Đã lưu căn chỉnh Crop & Zoom cho hình ảnh!");
    }
  };

  // Apply new image and optional AI suggested text
  const handleApplyImageAndText = (
    newImage: string,
    suggestedText?: { code: string; title: string; description: string }
  ) => {
    const updatedItems = [...page.items];
    const currentItem = updatedItems[targetItemIndex];

    updatedItems[targetItemIndex] = {
      ...currentItem,
      image: newImage,
      zoom: 1.0,
      panX: 0,
      panY: 0,
      fitMode: "cover",
      ...(suggestedText
        ? {
            code: suggestedText.code,
            title: suggestedText.title,
            description: suggestedText.description,
          }
        : {}),
    };

    handleUpdatePage({ items: updatedItems });
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
      const activeItems = page.items.slice(0, page.layout);

      const response = await fetch("/api/ai/suggest-full-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: activeItems,
          layout: page.layout,
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

        const newItems = [...page.items];
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

        const newCollectionTitle = collectionTitle || page.collectionTitle;

        handleUpdatePage({
          seriesSubtitle: seriesSubtitle || page.seriesSubtitle,
          collectionTitle: newCollectionTitle,
          headerDescription: headerDescription || page.headerDescription,
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
      await exportCatalogToVectorPdf(page, {
        fileName: `Elmich_Catalogue_${page.collectionTitle.replace(/\s+/g, "_")}_300DPI_Vector.pdf`,
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

  // Keyboard shortcut Ctrl+P / Cmd+P to trigger native 100% Vector Print-to-PDF
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        handlePrintNative();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Native Print-to-PDF matching Ctrl+P 100%
  const handlePrintNative = () => {
    showToast("Đang mở hộp thoại in. Chọn Máy in 'Lưu dưới dạng PDF' (Save as PDF) để giữ nguyên 100% font chữ, dãn chữ & tỷ lệ vector!", "info");
    setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#EDE8E0] text-stone-900 print:bg-[#FAF7F2] print:min-h-0">
      {/* Top Navigation & Toolbar */}
      <Toolbar
        currentPage={page}
        language={language}
        isExportingPdf={isExportingPdf}
        exportProgress={exportProgress}
        onSetLayout={handleSetLayout}
        onSelectPreset={handleSelectPreset}
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
      <div className="flex-1 overflow-auto p-4 md:p-8 flex flex-col items-center justify-start print:p-0 print:m-0 print:overflow-hidden print:w-[297mm] print:h-[210mm] app-workspace-container">
        {/* Helper Banner for Users */}
        <div className="no-print max-w-[1100px] w-full mb-4 bg-white/80 backdrop-blur-xs border border-stone-200/80 rounded-xl p-3 px-4 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-600 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="p-1 bg-red-100 text-red-600 rounded-md">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <span>
              <strong>Chỉnh sửa trực tiếp:</strong> Bạn có thể nhấp chuột vào bất kỳ dòng chữ nào trên trang catalogue bên dưới để sửa ngay tại chỗ! Nhấn <strong>Ctrl + P</strong> hoặc nút <strong>Lưu PDF (Ctrl+P)</strong> để lưu bản in vector 100% giữ nguyên font chữ & tỷ lệ.
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-medium text-stone-500">
            <span className="flex items-center gap-1">
              <Crop className="w-3.5 h-3.5 text-red-500" />
              Công cụ Crop & Zoom tự động cho từng ảnh
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="flex items-center gap-1">
              <ImagePlus className="w-3.5 h-3.5 text-stone-400" />
              Rê chuột vào ảnh để đổi ảnh hoặc nhờ AI gợi ý
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="flex items-center gap-1">
              <Edit3 className="w-3.5 h-3.5 text-stone-400" />
              Giữ nguyên tỷ lệ khoảng cách chân trang & logo
            </span>
          </div>
        </div>

        {/* Visible Single Catalog Sheet */}
        <div className="w-full flex justify-center py-2">
          <CatalogSheet
            page={page}
            pageIndex={0}
            language={language}
            onUpdatePage={handleUpdatePage}
            onRequestImageChange={handleRequestImageChange}
            onRequestCropAdjust={handleRequestCropAdjust}
          />
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
        item={page.items[targetItemIndex] || page.items[0]}
        itemIndex={targetItemIndex}
        collectionTitle={page.collectionTitle}
        seriesSubtitle={page.seriesSubtitle}
        language={language}
        onApplyImageAndText={handleApplyImageAndText}
      />

      <ImageAdjustModal
        isOpen={isCropModalOpen}
        onClose={() => setIsCropModalOpen(false)}
        item={page.items[activeCropItemIndex] || page.items[0]}
        itemIndex={activeCropItemIndex}
        layout={page.layout}
        onApplyAdjustment={handleApplyCropAdjustment}
      />

      <QuickEditorDrawer
        isOpen={isQuickEditorOpen}
        onClose={() => setIsQuickEditorOpen(false)}
        currentPage={page}
        onUpdatePage={handleUpdatePage}
        onResetDefaults={handleResetDefaults}
        onRequestImageChange={handleRequestImageChange}
        onRequestCropAdjust={handleRequestCropAdjust}
      />

      <AiHeaderModal
        isOpen={isAiHeaderModalOpen}
        onClose={() => setIsAiHeaderModalOpen(false)}
        language={language}
        onApplyHeader={(newHeader) => {
          handleUpdatePage(newHeader);
          showToast("Đã cập nhật tiêu đề và mô tả bộ sưu tập mới từ AI!");
        }}
      />
    </div>
  );
}
