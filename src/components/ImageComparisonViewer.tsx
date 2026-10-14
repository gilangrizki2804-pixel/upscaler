import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Columns,
  SplitSquareVertical,
  Check,
  RefreshCw,
  Pipette,
  Layers,
  Sparkles,
} from 'lucide-react';
import { ImageItem } from '../types';

interface ImageComparisonViewerProps {
  item: ImageItem | null;
  onPickColor?: (hexColor: string) => void;
  isEyedropperActive: boolean;
  setIsEyedropperActive: (active: boolean) => void;
  isProcessing: boolean;
}

export type ViewMode = 'split' | 'sideBySide' | 'processedOnly' | 'originalOnly';

export const ImageComparisonViewer: React.FC<ImageComparisonViewerProps> = ({
  item,
  onPickColor,
  isEyedropperActive,
  setIsEyedropperActive,
  isProcessing,
}) => {
  const [sliderPos, setSliderPos] = useState<number>(50); // percentage 0 to 100
  const [isDraggingSlider, setIsDraggingSlider] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [bgStyle, setBgStyle] = useState<'checker_light' | 'checker_dark' | 'white' | 'black' | 'green'>('checker_light');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);

  // Reset zoom & pan when item changes
  useEffect(() => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    setSliderPos(50);
  }, [item?.id]);

  // Handle Split Slider Dragging
  const handleSliderMove = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const percent = (x / rect.width) * 100;
      setSliderPos(percent);
    },
    []
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEyedropperActive) return;

    // Check if clicking near slider divider
    if (containerRef.current && viewMode === 'split') {
      const rect = containerRef.current.getBoundingClientRect();
      const clickPercent = ((e.clientX - rect.left) / rect.width) * 100;
      if (Math.abs(clickPercent - sliderPos) < 4) {
        setIsDraggingSlider(true);
        return;
      }
    }

    // Otherwise initiate Pan
    if (zoomLevel > 1) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingSlider) {
      handleSliderMove(e.clientX);
    } else if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDraggingSlider(false);
    setIsPanning(false);
  };

  // Eyedropper click on canvas to pick background color
  const handleCanvasClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!isEyedropperActive || !item?.originalSrc || !onPickColor) return;

    const img = e.currentTarget;
    const rect = img.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * img.naturalWidth);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * img.naturalHeight);

    // Create temporary offscreen canvas to sample pixel
    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = 1;
    sampleCanvas.height = 1;
    const ctx = sampleCanvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(img, x, y, 1, 1, 0, 0, 1, 1);
    const pixel = ctx.getImageData(0, 0, 1, 1).data;
    const hex = `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1).toUpperCase()}`;

    onPickColor(hex);
    setIsEyedropperActive(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey || zoomLevel > 1) {
      e.preventDefault();
      const zoomDelta = e.deltaY > 0 ? -0.2 : 0.2;
      setZoomLevel((prev) => Math.min(8, Math.max(0.5, prev + zoomDelta)));
    }
  };

  // Determine background class based on selection
  const getBgClass = () => {
    switch (bgStyle) {
      case 'checker_light':
        return 'bg-checkerboard';
      case 'checker_dark':
        return 'bg-checkerboard-dark';
      case 'white':
        return 'bg-white';
      case 'black':
        return 'bg-slate-950';
      case 'green':
        return 'bg-[#00FF00]';
      default:
        return 'bg-checkerboard';
    }
  };

  if (!item) {
    return null;
  }

  const { metadata, originalSrc, processedSrc } = item;
  const hasResult = Boolean(processedSrc);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 overflow-hidden select-none relative">
      {/* Viewer Floating Header Toolbar */}
      <div className="h-12 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 flex items-center justify-between text-xs text-slate-300 z-30">
        {/* Left: View Mode Toggles */}
        <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60">
          <button
            onClick={() => setViewMode('split')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              viewMode === 'split' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
            title="Split Slider (Bandingkan Sebelum dan Sesudah)"
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            <span>Split Slider</span>
          </button>
          <button
            onClick={() => setViewMode('sideBySide')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              viewMode === 'sideBySide' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
            title="Berdampingan (Side-by-Side)"
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Side by Side</span>
          </button>
          <button
            onClick={() => setViewMode('processedOnly')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              viewMode === 'processedOnly' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
            title="Hanya Tampilkan Hasil"
          >
            Hasil Bersih
          </button>
          <button
            onClick={() => setViewMode('originalOnly')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              viewMode === 'originalOnly' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
            title="Hanya Tampilkan Asli"
          >
            Asli
          </button>
        </div>

        {/* Center: Background Tester for Transparency */}
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-[11px] text-slate-400">Cek Latar Transparan:</span>
          <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60">
            <button
              onClick={() => setBgStyle('checker_light')}
              className={`w-6 h-6 rounded-md bg-checkerboard border ${
                bgStyle === 'checker_light' ? 'border-indigo-400 ring-2 ring-indigo-500/50' : 'border-slate-600'
              }`}
              title="Papan Catur Terang"
            />
            <button
              onClick={() => setBgStyle('checker_dark')}
              className={`w-6 h-6 rounded-md bg-checkerboard-dark border ${
                bgStyle === 'checker_dark' ? 'border-indigo-400 ring-2 ring-indigo-500/50' : 'border-slate-600'
              }`}
              title="Papan Catur Gelap"
            />
            <button
              onClick={() => setBgStyle('white')}
              className={`w-6 h-6 rounded-md bg-white border ${
                bgStyle === 'white' ? 'border-indigo-400 ring-2 ring-indigo-500/50' : 'border-slate-600'
              }`}
              title="Latar Putih Polos"
            />
            <button
              onClick={() => setBgStyle('black')}
              className={`w-6 h-6 rounded-md bg-black border ${
                bgStyle === 'black' ? 'border-indigo-400 ring-2 ring-indigo-500/50' : 'border-slate-600'
              }`}
              title="Latar Hitam Pekat"
            />
            <button
              onClick={() => setBgStyle('green')}
              className={`w-6 h-6 rounded-md bg-[#00FF00] border ${
                bgStyle === 'green' ? 'border-indigo-400 ring-2 ring-indigo-500/50' : 'border-slate-600'
              }`}
              title="Chroma Hijau (Untuk Cek Tepi Bersih)"
            />
          </div>
        </div>

        {/* Right: Zoom & Reset */}
        <div className="flex items-center gap-1.5">
          {isEyedropperActive && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-md text-[11px] animate-pulse">
              <Pipette className="w-3.5 h-3.5" />
              <span>Klik warna latar pada gambar</span>
            </div>
          )}

          <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
              className="p-1 hover:text-white rounded hover:bg-slate-700 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px] tabular-nums px-1.5 text-slate-300 min-w-10 text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(8, z + 0.25))}
              className="p-1 hover:text-white rounded hover:bg-slate-700 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setZoomLevel(1);
                setPanOffset({ x: 0, y: 0 });
              }}
              className="p-1 hover:text-white rounded hover:bg-slate-700 transition-colors border-l border-slate-700 ml-0.5 pl-1.5"
              title="Reset Zoom & Posisi"
            >
              <Maximize className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Canvas Area */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className={`flex-1 overflow-hidden flex items-center justify-center relative cursor-${
          isEyedropperActive ? 'crosshair' : isPanning ? 'grabbing' : zoomLevel > 1 ? 'grab' : 'default'
        }`}
      >
        {/* Processing Spinner Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center z-50 text-white gap-3">
            <div className="w-10 h-10 border-3 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            <div className="text-sm font-semibold tracking-wide flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>Menghilangkan Blur & Memproses Transparansi...</span>
            </div>
            <p className="text-xs text-slate-400">Algoritma super-sampling & unsharp mask berjalan</p>
          </div>
        )}

        {/* Viewport content transformed by zoom & pan */}
        <div
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
            transformOrigin: 'center center',
            transition: isPanning ? 'none' : 'transform 100ms ease-out',
          }}
          className="relative max-w-full max-h-full flex items-center justify-center p-8"
        >
          {viewMode === 'sideBySide' ? (
            /* Side by Side Mode */
            <div className="flex items-center gap-6 flex-wrap justify-center">
              {/* Original Card */}
              <div className="flex flex-col items-center">
                <span className="text-[11px] font-semibold text-slate-400 mb-2">SEBELUM (ASLI & BLUR)</span>
                <div className="rounded-lg overflow-hidden shadow-2xl border border-slate-700 bg-white">
                  <img
                    src={originalSrc}
                    alt="Original"
                    onClick={handleCanvasClick}
                    className="max-h-[60vh] max-w-[40vw] object-contain"
                  />
                </div>
              </div>

              {/* Processed Card */}
              <div className="flex flex-col items-center">
                <span className="text-[11px] font-semibold text-indigo-400 mb-2">
                  SESUDAH (DEBLUR & TRANSPARAN {metadata.outputWidth ? `${metadata.outputWidth}x${metadata.outputHeight}` : ''})
                </span>
                <div className={`rounded-lg overflow-hidden shadow-2xl border border-indigo-500/40 ${getBgClass()}`}>
                  <img
                    src={processedSrc || originalSrc}
                    alt="Processed"
                    className="max-h-[60vh] max-w-[40vw] object-contain"
                  />
                </div>
              </div>
            </div>
          ) : viewMode === 'processedOnly' ? (
            /* Processed Only */
            <div className={`rounded-lg overflow-hidden shadow-2xl border border-slate-700 ${getBgClass()}`}>
              <img
                src={processedSrc || originalSrc}
                alt="Processed"
                className="max-h-[75vh] max-w-[85vw] object-contain"
              />
            </div>
          ) : viewMode === 'originalOnly' ? (
            /* Original Only */
            <div className="rounded-lg overflow-hidden shadow-2xl border border-slate-700 bg-white">
              <img
                src={originalSrc}
                alt="Original"
                onClick={handleCanvasClick}
                className="max-h-[75vh] max-w-[85vw] object-contain"
              />
            </div>
          ) : (
            /* Interactive Split-Slider Mode */
            <div
              className={`relative rounded-lg overflow-hidden shadow-2xl border border-slate-700 max-h-[75vh] max-w-[85vw] ${getBgClass()}`}
            >
              {/* Processed Result (Full background) */}
              <img
                src={processedSrc || originalSrc}
                alt="Processed"
                className="block max-h-[75vh] max-w-[85vw] object-contain"
              />

              {/* Original Image (Clipped by slider position) */}
              <div
                style={{
                  clipPath: `polygon(0% 0%, ${sliderPos}% 0%, ${sliderPos}% 100%, 0% 100%)`,
                }}
                className="absolute inset-0 bg-white"
              >
                <img
                  src={originalSrc}
                  alt="Original Blurry"
                  onClick={handleCanvasClick}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Draggable Vertical Divider Line */}
              <div
                style={{ left: `${sliderPos}%` }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setIsDraggingSlider(true);
                }}
                className="absolute top-0 bottom-0 w-0.5 bg-white shadow-2xl z-20 cursor-ew-resize flex items-center justify-center -translate-x-1/2"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white shadow-lg border-2 border-white flex items-center justify-center text-[10px] font-bold">
                  <SplitSquareVertical className="w-4 h-4" />
                </div>
              </div>

              {/* Corner Watermark Tags for Before / After */}
              <div className="absolute top-3 left-3 px-2 py-0.5 bg-black/70 backdrop-blur-xs text-white text-[10px] font-medium rounded pointer-events-none z-10">
                Asli (Blur)
              </div>
              <div className="absolute top-3 right-3 px-2 py-0.5 bg-indigo-600/90 backdrop-blur-xs text-white text-[10px] font-medium rounded pointer-events-none z-10">
                Hasil Deblur & Transparan
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Metadata & Statistics Strip (Tabular Figures) */}
      <div className="h-10 border-t border-slate-800 bg-slate-900/95 px-6 flex items-center justify-between text-xs text-slate-400 z-30">
        <div className="flex items-center gap-4">
          <span className="text-slate-300 font-medium truncate max-w-48">{metadata.name}</span>
          <span aria-hidden="true" className="text-slate-700">·</span>
          <div className="flex items-center gap-1.5 font-mono tabular-nums text-slate-400">
            <span>Resolusi Awal:</span>
            <span className="text-slate-200">{metadata.originalWidth} × {metadata.originalHeight}</span>
          </div>
          {metadata.outputWidth && (
            <>
              <span className="text-indigo-400 font-bold">→</span>
              <div className="flex items-center gap-1.5 font-mono tabular-nums text-indigo-300 font-semibold">
                <span>Hasil Upscale:</span>
                <span>{metadata.outputWidth} × {metadata.outputHeight}</span>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-4 font-mono tabular-nums">
          {metadata.transparentRatio !== undefined && (
            <div className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Transparansi: {Math.round(metadata.transparentRatio * 100)}% Alpha</span>
            </div>
          )}
          {metadata.processTimeMs !== undefined && (
            <>
              <span aria-hidden="true" className="text-slate-700">·</span>
              <span className="text-slate-400">Waktu: {metadata.processTimeMs}ms</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
