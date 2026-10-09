import React, { useState } from "react";
import { Upload, Image as ImageIcon, Sparkles, X, Check, Link } from "lucide-react";
import { SAMPLE_COOKWARE_LIBRARY } from "../data/defaultCatalog";
import { ProductItem } from "../types";

interface ImagePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ProductItem;
  itemIndex: number;
  collectionTitle: string;
  seriesSubtitle: string;
  language: "en" | "vi";
  onApplyImageAndText: (newImage: string, suggestedText?: { code: string; title: string; description: string }) => void;
}

export const ImagePickerModal: React.FC<ImagePickerModalProps> = ({
  isOpen,
  onClose,
  item,
  itemIndex,
  collectionTitle,
  seriesSubtitle,
  language,
  onApplyImageAndText,
}) => {
  const [activeTab, setActiveTab] = useState<"upload" | "library" | "url">("upload");
  const [selectedImage, setSelectedImage] = useState<string>(item.image);
  const [urlInput, setUrlInput] = useState("");
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Vui lòng chọn file hình ảnh hợp lệ (PNG, JPG, WEBP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const dataUrl = loadEvent.target?.result as string;
      setSelectedImage(dataUrl);
      setErrorMsg(null);
    };
    reader.readAsDataURL(file);
  };

  const handleApplyOnly = () => {
    onApplyImageAndText(selectedImage);
    onClose();
  };

  const handleApplyWithAi = async () => {
    setIsGeneratingAi(true);
    setErrorMsg(null);
    try {
      const response = await fetch("/api/ai/suggest-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageData: selectedImage,
          collectionTitle,
          seriesSubtitle,
          itemIndex: itemIndex + 1,
          existingCode: item.code,
          language,
        }),
      });

      const resData = await response.json();
      if (resData.success && resData.data) {
        onApplyImageAndText(selectedImage, resData.data);
        onClose();
      } else {
        throw new Error(resData.error || "Không thể phân tích ảnh");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Có lỗi khi gọi AI. Đã cập nhật ảnh, bạn có thể tự chỉnh sửa text.");
      // Still apply the image
      onApplyImageAndText(selectedImage);
      setTimeout(() => onClose(), 1200);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div>
            <h3 className="text-base font-semibold text-stone-900 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-red-600" />
              Thay đổi hình ảnh vị trí #{itemIndex + 1}
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Tải ảnh sản phẩm nồi chảo mới và nhận gợi ý thông số từ AI
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-stone-200 px-6 bg-white gap-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab("upload")}
            className={`py-3 flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === "upload"
                ? "border-red-600 text-red-600 font-semibold"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            <Upload className="w-4 h-4" />
            Tải ảnh từ máy tính
          </button>
          <button
            onClick={() => setActiveTab("library")}
            className={`py-3 flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === "library"
                ? "border-red-600 text-red-600 font-semibold"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            Thư viện mẫu đồ gia dụng
          </button>
          <button
            onClick={() => setActiveTab("url")}
            className={`py-3 flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === "url"
                ? "border-red-600 text-red-600 font-semibold"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            <Link className="w-4 h-4" />
            Đường dẫn ảnh (URL)
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              {errorMsg}
            </div>
          )}

          {activeTab === "upload" && (
            <div className="space-y-4">
              <label className="border-2 border-dashed border-stone-300 hover:border-red-500 hover:bg-red-50/20 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all group">
                <div className="w-12 h-12 rounded-full bg-red-50 group-hover:bg-red-100 flex items-center justify-center text-red-600 mb-3 transition-colors">
                  <Upload className="w-6 h-6" />
                </div>
                <span className="text-sm font-medium text-stone-800">
                  Nhấp để tải lên ảnh sản phẩm
                </span>
                <span className="text-xs text-stone-500 mt-1">
                  Định dạng PNG, JPG, WEBP chất lượng cao
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {activeTab === "library" && (
            <div className="grid grid-cols-4 gap-3">
              {SAMPLE_COOKWARE_LIBRARY.map((sample, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedImage(sample.url)}
                  className={`group relative rounded-lg overflow-hidden border cursor-pointer transition-all aspect-3/4 bg-stone-100 ${
                    selectedImage === sample.url
                      ? "ring-2 ring-red-600 border-red-600 shadow-md"
                      : "border-stone-200 hover:border-stone-400"
                  }`}
                >
                  <img
                    src={sample.url}
                    alt={sample.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {selectedImage === sample.url && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center shadow-sm">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2">
                    <p className="text-[10px] text-white font-medium truncate">
                      {sample.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "url" && (
            <div className="space-y-3">
              <label className="block text-xs font-medium text-stone-700">
                Nhập đường dẫn trực tiếp đến hình ảnh (URL):
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/elmich-cookware.jpg"
                  className="flex-1 px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (urlInput.trim()) setSelectedImage(urlInput.trim());
                  }}
                  className="px-4 py-2 bg-stone-800 text-white text-xs font-medium rounded-lg hover:bg-stone-900"
                >
                  Xem trước
                </button>
              </div>
            </div>
          )}

          {/* Current Selection Preview */}
          <div className="mt-4 pt-4 border-t border-stone-200 flex items-center gap-4 bg-stone-50/80 p-3 rounded-lg">
            <div className="w-16 h-20 bg-stone-200 rounded border border-stone-300 overflow-hidden shrink-0">
              <img
                src={selectedImage}
                alt="Xem trước ảnh đã chọn"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 text-xs">
              <div className="font-semibold text-stone-800">Ảnh đã chọn</div>
              <div className="text-stone-500 line-clamp-1 mt-0.5">
                {selectedImage.startsWith("data:")
                  ? "Ảnh tải lên từ máy tính (Base64)"
                  : selectedImage}
              </div>
              <div className="text-[11px] text-stone-400 mt-1">
                Tỷ lệ chuẩn 3:4 hoặc 4:5 sẽ hiển thị đẹp nhất trên catalogue Elmich.
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors"
          >
            Hủy
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleApplyOnly}
              disabled={isGeneratingAi}
              className="px-4 py-2 text-xs font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-100 transition-colors"
            >
              Chỉ đổi ảnh
            </button>
            <button
              onClick={handleApplyWithAi}
              disabled={isGeneratingAi}
              className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 rounded-lg hover:from-red-700 hover:to-rose-700 transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              {isGeneratingAi ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>AI đang phân tích ảnh...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Đổi ảnh & AI gợi ý text</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
