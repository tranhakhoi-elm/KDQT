import React, { useState, useRef, useEffect } from "react";
import { ZoomIn, ZoomOut, Move, RotateCcw, X, Check, Maximize2, Minimize2 } from "lucide-react";
import { ProductItem } from "../types";

interface ImageAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ProductItem;
  itemIndex: number;
  layout: 3 | 4;
  onApplyAdjustment: (adjustment: {
    zoom: number;
    panX: number;
    panY: number;
    fitMode: "cover" | "contain";
  }) => void;
}

export const ImageAdjustModal: React.FC<ImageAdjustModalProps> = ({
  isOpen,
  onClose,
  item,
  itemIndex,
  layout,
  onApplyAdjustment,
}) => {
  const [zoom, setZoom] = useState<number>(item.zoom || 1.0);
  const [panX, setPanX] = useState<number>(item.panX || 0);
  const [panY, setPanY] = useState<number>(item.panY || 0);
  const [fitMode, setFitMode] = useState<"cover" | "contain">(item.fitMode || "cover");

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; startPanX: number; startPanY: number }>({
    x: 0,
    y: 0,
    startPanX: 0,
    startPanY: 0,
  });

  useEffect(() => {
    if (isOpen) {
      setZoom(item.zoom || 1.0);
      setPanX(item.panX || 0);
      setPanY(item.panY || 0);
      setFitMode(item.fitMode || "cover");
    }
  }, [isOpen, item]);

  if (!isOpen) return null;

  // Mouse / Touch Drag to Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startPanX: panX,
      startPanY: panY,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;

    // Scale movement relative to zoom
    const sensitivity = 0.25;
    const newPanX = Math.max(-50, Math.min(50, dragStartRef.current.startPanX - deltaX * sensitivity));
    const newPanY = Math.max(-50, Math.min(50, dragStartRef.current.startPanY - deltaY * sensitivity));

    setPanX(Math.round(newPanX));
    setPanY(Math.round(newPanY));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleReset = () => {
    setZoom(1.0);
    setPanX(0);
    setPanY(0);
    setFitMode("cover");
  };

  const handleAutoFit = () => {
    setZoom(1.15);
    setPanX(0);
    setPanY(-5);
    setFitMode("cover");
  };

  const handleApply = () => {
    onApplyAdjustment({
      zoom,
      panX,
      panY,
      fitMode,
    });
    onClose();
  };

  // Compute transform style for live preview
  const transformStyle: React.CSSProperties = {
    transform: `scale(${zoom}) translate(${-panX / zoom}%, ${-panY / zoom}%)`,
    transformOrigin: "center center",
    objectFit: fitMode,
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full flex flex-col overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div>
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Move className="w-4 h-4 text-red-600" />
              Chỉnh Sửa Crop & Zoom (Vị trí #{itemIndex + 1})
            </h3>
            <p className="text-[11px] text-stone-500">
              Kéo thả chuột trực tiếp trên ảnh để căn vị trí, thanh trượt để phóng to/thu nhỏ
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body: Preview Frame & Sliders */}
        <div className="p-6 space-y-5 bg-stone-50/50">
          {/* Interactive Live Frame */}
          <div className="flex justify-center">
            <div
              className={`relative overflow-hidden bg-stone-200 rounded shadow-md border-2 border-stone-300 cursor-grab ${
                isDragging ? "cursor-grabbing ring-2 ring-red-500" : ""
              } ${layout === 3 ? "w-64 aspect-4/5" : "w-56 aspect-3/4"}`}
              onMouseDown={handleMouseDown}
              title="Nhấn giữ và kéo chuột để di chuyển khung hình"
            >
              <img
                src={item.image}
                alt="Preview"
                draggable={false}
                className="w-full h-full transition-transform duration-75 pointer-events-none"
                style={transformStyle}
              />

              {/* Grid overlay guide */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none border border-white/20">
                <div className="border-r border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div className="border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div className="border-b border-white/20" />
                <div className="border-r border-white/20" />
                <div className="border-r border-white/20" />
                <div />
              </div>

              {/* Drag indicator pill */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded-full pointer-events-none">
                Kéo ảnh để căn góc
              </div>
            </div>
          </div>

          {/* Quick presets bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-stone-200 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-stone-500">Căn nhanh:</span>
              <button
                type="button"
                onClick={() => {
                  setPanX(0);
                  setPanY(0);
                }}
                className="px-2 py-1 bg-white hover:bg-stone-100 border border-stone-200 rounded text-[11px] font-medium text-stone-700"
              >
                Căn Giữa
              </button>
              <button
                type="button"
                onClick={() => setPanY(-20)}
                className="px-2 py-1 bg-white hover:bg-stone-100 border border-stone-200 rounded text-[11px] font-medium text-stone-700"
              >
                Căn Trên
              </button>
              <button
                type="button"
                onClick={() => setPanY(20)}
                className="px-2 py-1 bg-white hover:bg-stone-100 border border-stone-200 rounded text-[11px] font-medium text-stone-700"
              >
                Căn Dưới
              </button>
              <button
                type="button"
                onClick={handleAutoFit}
                className="px-2 py-1 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded text-[11px] font-semibold"
              >
                Tự Động Fit
              </button>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="px-2 py-1 text-stone-500 hover:text-stone-800 flex items-center gap-1 text-[11px]"
            >
              <RotateCcw className="w-3 h-3" />
              Mặc định
            </button>
          </div>

          {/* Controls: Zoom Slider */}
          <div className="space-y-1 bg-white p-3 rounded-xl border border-stone-200">
            <div className="flex items-center justify-between text-xs font-semibold text-stone-700">
              <span className="flex items-center gap-1.5">
                <ZoomIn className="w-3.5 h-3.5 text-stone-500" />
                Độ thu phóng (Zoom):
              </span>
              <span className="font-mono text-red-600">{Math.round(zoom * 100)}%</span>
            </div>
            <div className="flex items-center gap-3">
              <ZoomOut className="w-3.5 h-3.5 text-stone-400" />
              <input
                type="range"
                min="1.0"
                max="2.5"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="flex-1 accent-red-600 cursor-pointer h-1.5 bg-stone-200 rounded-lg"
              />
              <ZoomIn className="w-3.5 h-3.5 text-stone-400" />
            </div>
          </div>

          {/* Controls: Pan X & Y Sliders */}
          <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-stone-200">
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium text-stone-700">
                <span>Vị trí ngang (Pan X):</span>
                <span className="font-mono text-[11px] text-stone-500">{panX}%</span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                step="1"
                value={panX}
                onChange={(e) => setPanX(parseInt(e.target.value))}
                className="w-full accent-stone-700 cursor-pointer h-1.5 bg-stone-200 rounded-lg"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium text-stone-700">
                <span>Vị trí dọc (Pan Y):</span>
                <span className="font-mono text-[11px] text-stone-500">{panY}%</span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                step="1"
                value={panY}
                onChange={(e) => setPanY(parseInt(e.target.value))}
                className="w-full accent-stone-700 cursor-pointer h-1.5 bg-stone-200 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-white border-t border-stone-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900"
          >
            Hủy
          </button>
          <button
            onClick={handleApply}
            className="px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            Áp dụng Crop & Zoom
          </button>
        </div>
      </div>
    </div>
  );
};
