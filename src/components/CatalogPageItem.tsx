import React, { useState } from "react";
import { ProductItem } from "../types";
import { EditableText } from "./EditableText";
import { Camera, Sparkles, CircleDot, Crop, Move } from "lucide-react";

interface CatalogPageItemProps {
  item: ProductItem;
  index: number;
  layout: 3 | 4;
  collectionTitle: string;
  seriesSubtitle: string;
  language: "en" | "vi";
  onUpdateItem: (updated: Partial<ProductItem>) => void;
  onRequestImageChange: () => void;
  onRequestCropAdjust: () => void;
}

export const CatalogPageItem: React.FC<CatalogPageItemProps> = ({
  item,
  index,
  layout,
  collectionTitle,
  seriesSubtitle,
  language,
  onUpdateItem,
  onRequestImageChange,
  onRequestCropAdjust,
}) => {
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const zoom = item.zoom || 1.0;
  const panX = item.panX || 0;
  const panY = item.panY || 0;
  const fitMode = item.fitMode || "cover";

  const imageTransformStyle: React.CSSProperties = {
    transform: `scale(${zoom}) translate(${-panX / zoom}%, ${-panY / zoom}%)`,
    transformOrigin: "center center",
    objectFit: fitMode,
  };

  const handleGenerateAiText = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAiLoading(true);
    try {
      const response = await fetch("/api/ai/suggest-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageData: item.image,
          collectionTitle,
          seriesSubtitle,
          itemIndex: index + 1,
          existingCode: item.code,
          language,
        }),
      });

      const data = await response.json();
      if (data.success && data.data) {
        onUpdateItem({
          code: data.data.code,
          title: data.data.title,
          description: data.data.description,
        });
      }
    } catch (err) {
      console.error("AI error:", err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const presetSwatchColors = [
    "#ffffff", // pure white
    "#f3ede3", // ivory
    "#e8ded2", // ivory speckle
    "#c5b9a8", // warm taupe
    "#8a847c", // stone grey
    "#343434", // deep granite black
    "#b87333", // copper tone
  ];

  return (
    <div className="flex flex-col group relative">
      {/* Product Image Frame */}
      <div
        className={`relative overflow-hidden bg-stone-200/50 shadow-xs transition-all ${
          layout === 3 ? "aspect-4/5" : "aspect-3/4"
        }`}
      >
        <img
          src={item.image}
          alt={item.title}
          className="w-full h-full transition-transform duration-200"
          style={imageTransformStyle}
        />

        {/* Circular Accent Dot / Colorway Swatch */}
        {item.showSpotDot && (
          <div
            className="absolute top-3 left-3 w-4 h-4 rounded-full border border-black/20 shadow-xs cursor-pointer z-10 transition-transform hover:scale-110"
            style={{ backgroundColor: item.spotDotColor || "#ffffff" }}
            onClick={(e) => {
              e.stopPropagation();
              setShowColorPicker(!showColorPicker);
            }}
            title="Điểm nhấn màu sắc (Click để đổi màu swatch)"
          />
        )}

        {/* Swatch color popup */}
        {showColorPicker && (
          <div className="absolute top-8 left-3 z-30 p-2 bg-white/95 backdrop-blur-xs rounded-lg shadow-xl border border-stone-200 flex gap-1.5 animate-in fade-in">
            {presetSwatchColors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateItem({ spotDotColor: c });
                  setShowColorPicker(false);
                }}
                className="w-4 h-4 rounded-full border border-stone-300 hover:scale-125 transition-transform"
                style={{ backgroundColor: c }}
              />
            ))}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUpdateItem({ showSpotDot: false });
                setShowColorPicker(false);
              }}
              className="text-[9px] text-stone-500 hover:text-red-500 px-1"
            >
              Ẩn
            </button>
          </div>
        )}

        {/* Hover Action Overlay */}
        <div className="no-print absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2.5 pointer-events-none group-hover:pointer-events-auto">
          <div className="flex items-center justify-between gap-1 flex-wrap">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onRequestCropAdjust}
                title="Chỉnh Crop & Zoom thủ công bằng chuột hoặc thanh trượt"
                className="px-2 py-1 rounded bg-white text-stone-800 hover:bg-stone-100 text-[11px] font-semibold shadow-xs flex items-center gap-1 transition-all"
              >
                <Crop className="w-3 h-3 text-red-600" />
                <span>Crop & Zoom</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateItem({
                    zoom: 1.12,
                    panX: 0,
                    panY: -3,
                    fitMode: "cover",
                  });
                }}
                title="Tự động căn chỉnh ảnh vào khung chuẩn không méo"
                className="px-1.5 py-1 rounded bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-semibold shadow-xs transition-all"
              >
                Tự động căn
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateItem({ showSpotDot: !item.showSpotDot });
                }}
                title="Bật/tắt chấm màu điểm nhấn"
                className="p-1 rounded bg-white/90 text-stone-700 hover:bg-white text-xs shadow-xs transition-all"
              >
                <CircleDot className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleGenerateAiText}
                disabled={isAiLoading}
                title="Nhờ AI gợi ý text cho ảnh này"
                className="px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700 text-[11px] font-medium shadow-xs transition-all flex items-center gap-1 disabled:opacity-50"
              >
                <Sparkles className="w-3 h-3" />
                <span>{isAiLoading ? "Đang tạo..." : "AI Gợi ý"}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onRequestImageChange}
              className="flex-1 py-1.5 rounded bg-white/95 text-stone-800 hover:bg-white hover:text-black text-xs font-semibold shadow-md flex items-center justify-center gap-1.5 transition-all"
            >
              <Camera className="w-3.5 h-3.5 text-red-600" />
              <span>Đổi hình ảnh</span>
            </button>
            {(zoom !== 1.0 || panX !== 0 || panY !== 0) && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateItem({ zoom: 1.0, panX: 0, panY: 0, fitMode: "cover" });
                }}
                title="Khôi phục góc ảnh mặc định"
                className="px-2 py-1.5 rounded bg-stone-800 text-stone-200 hover:text-white text-[10px] font-medium shadow-md"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Product Information under image */}
      <div className="pt-3.5 flex flex-col space-y-1">
        {/* Item Code & Edition Tag (e.g. IV-01 • FW26 CORE SET) */}
        <div className="text-[10.5px] uppercase font-semibold text-[#8C7D6D] tracking-[0.16em] leading-tight">
          <EditableText
            value={item.code}
            onChange={(val) => onUpdateItem({ code: val })}
            placeholder="MÃ • PHIÊN BẢN"
          />
        </div>

        {/* Product Title (e.g. Ivory Speckle, Full Set + Griddle) */}
        <div
          className={`text-[#1E1B19] font-bold tracking-tight leading-snug ${
            layout === 3 ? "text-[15.5px]" : "text-[14px]"
          }`}
          style={{ fontFamily: "'Plus Jakarta Sans', Georgia, sans-serif" }}
        >
          <EditableText
            value={item.title}
            onChange={(val) => onUpdateItem({ title: val })}
            placeholder="Tên sản phẩm..."
          />
        </div>

        {/* Description (e.g. Includes stockpot, casseroles, saucepan...) */}
        <div className="text-[11px] text-[#635B53] leading-relaxed pt-0.5">
          <EditableText
            value={item.description}
            onChange={(val) => onUpdateItem({ description: val })}
            placeholder="Mô tả thông số chi tiết của sản phẩm..."
            multiline
          />
        </div>
      </div>
    </div>
  );
};
