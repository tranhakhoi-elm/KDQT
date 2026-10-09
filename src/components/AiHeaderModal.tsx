import React, { useState } from "react";
import { Sparkles, X, Check } from "lucide-react";

interface AiHeaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: "en" | "vi";
  onApplyHeader: (header: {
    seriesSubtitle: string;
    collectionTitle: string;
    headerDescription: string;
  }) => void;
}

export const AiHeaderModal: React.FC<AiHeaderModalProps> = ({
  isOpen,
  onClose,
  language,
  onApplyHeader,
}) => {
  const [topic, setTopic] = useState("Diamond Granite Series with Rose Gold Handles");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const quickIdeas = [
    "Bộ nồi chống dính vân đá Sapphire",
    "Scandinavian Matte Cast Aluminum Cookware",
    "Chảo chiên chống dính ceramic vân gỗ sồi",
    "Tri-Ply Stainless Steel Pro Chef Collection",
    "Modern Minimalist Neutral Cookware Set",
  ];

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/ai/suggest-header", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, language }),
      });
      const data = await response.json();
      if (data.success && data.data) {
        onApplyHeader(data.data);
        onClose();
      } else {
        throw new Error(data.error || "Không thể tạo tiêu đề");
      }
    } catch (err: any) {
      setError(err.message || "Lỗi khi kết nối với AI");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-stone-200 p-6 space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-2 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                AI Gợi Ý Tên Bộ Sưu Tập Mới
              </h3>
              <p className="text-[11px] text-stone-500">
                Chuẩn hóa văn phong thương hiệu Elmich
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-600 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-2 bg-red-50 text-red-600 text-xs rounded border border-red-200">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-xs font-semibold text-stone-700">
            Nhập ý tưởng sản phẩm / vật liệu / màu sắc:
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Ví dụ: Nồi chảo vân đá kem tay cầm gỗ sồi..."
            className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-1 focus:ring-red-500 focus:outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-stone-500">
            Gợi ý chủ đề nhanh:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {quickIdeas.map((idea, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setTopic(idea)}
                className="text-[10px] bg-stone-100 hover:bg-red-50 hover:text-red-600 text-stone-700 px-2 py-1 rounded border border-stone-200 transition-colors text-left"
              >
                {idea}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isLoading || !topic.trim()}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 rounded-lg hover:from-red-700 hover:to-rose-700 flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>AI đang tạo...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tạo thông tin</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
