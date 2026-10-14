import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { ControlsPanel } from './components/ControlsPanel';
import { ImageComparisonViewer } from './components/ImageComparisonViewer';
import { PresetGallery } from './components/PresetGallery';
import { BatchQueue } from './components/BatchQueue';
import { GuideModal } from './components/GuideModal';
import { ImageItem, ProcessOptions } from './types';
import {
  processImagePipeline,
  loadImage,
  generateSampleDataUrl,
} from './utils/imageProcessing';
import { Upload, Sparkles, Layers, ShieldCheck } from 'lucide-react';

const DEFAULT_OPTIONS: ProcessOptions = {
  upscaleFactor: 2,
  deblurPreset: 'crisp',
  deblurStrength: 80,
  deblurRadius: 1.8,
  deblurThreshold: 2,
  edgeEnhancement: 40,
  removeBg: true,
  bgMode: 'white',
  targetColor: '#FFFFFF',
  colorTolerance: 24,
  edgeFeather: 2,
  defringe: true,
  floodFromEdgesOnly: true,
};

export default function App() {
  const [items, setItems] = useState<ImageItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [options, setOptions] = useState<ProcessOptions>(DEFAULT_OPTIONS);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isAnalyzingAI, setIsAnalyzingAI] = useState<boolean>(false);
  const [aiTip, setAiTip] = useState<string | undefined>(undefined);
  const [isEyedropperActive, setIsEyedropperActive] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'workspace' | 'batch' | 'guide'>('workspace');
  const [dragOverGlobal, setDragOverGlobal] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active selected item
  const selectedItem = items.find((i) => i.id === selectedId) || null;

  // Process a single image item with current options
  const processItem = useCallback(
    async (item: ImageItem, customOpts?: ProcessOptions) => {
      const opts = customOpts || options;
      setIsProcessing(true);

      try {
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: 'processing', errorMessage: undefined } : i))
        );

        const img = await loadImage(item.originalSrc);
        const result = await processImagePipeline(img, opts);

        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  processedSrc: result.dataUrl,
                  status: 'done',
                  metadata: {
                    ...i.metadata,
                    outputWidth: result.width,
                    outputHeight: result.height,
                    transparentRatio: result.transparentRatio,
                    processTimeMs: result.processTimeMs,
                  },
                }
              : i
          )
        );
      } catch (err: any) {
        console.error('Error processing image:', err);
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, status: 'error', errorMessage: err.message || 'Gagal memproses gambar' }
              : i
          )
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [options]
  );

  // Initialize with high-quality sample image on first load
  useEffect(() => {
    const initSample = async () => {
      const sampleUrl = generateSampleDataUrl('logo');
      const img = await loadImage(sampleUrl);
      const initialItem: ImageItem = {
        id: 'sample-logo-init',
        name: 'sample_emblem_logo.png',
        originalSrc: sampleUrl,
        status: 'idle',
        metadata: {
          name: 'sample_emblem_logo.png',
          originalWidth: img.naturalWidth || 400,
          originalHeight: img.naturalHeight || 400,
          originalSize: 45200,
        },
      };

      setItems([initialItem]);
      setSelectedId(initialItem.id);

      // Automatically trigger initial processing with default deblur and transparency
      processItem(initialItem, DEFAULT_OPTIONS);
    };

    initSample();
  }, []);

  // Re-process when options change or user clicks Apply
  const handleApply = () => {
    if (selectedItem) {
      processItem(selectedItem, options);
    }
  };

  // Upload files handler
  const handleUploadFiles = async (files: FileList | File[]) => {
    const newItems: ImageItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });

      const img = await loadImage(dataUrl);

      const newItem: ImageItem = {
        id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: file.name,
        originalSrc: dataUrl,
        status: 'idle',
        metadata: {
          name: file.name,
          originalWidth: img.naturalWidth,
          originalHeight: img.naturalHeight,
          originalSize: file.size,
        },
      };
      newItems.push(newItem);
    }

    if (newItems.length > 0) {
      setItems((prev) => [...prev, ...newItems]);
      setSelectedId(newItems[0].id);

      // Auto-process the first uploaded image immediately
      processItem(newItems[0], options);
    }
  };

  // Select sample from PresetGallery
  const handleSelectSample = async (title: string, dataUrl: string, sampleOpts: Partial<ProcessOptions>) => {
    const img = await loadImage(dataUrl);
    const newOptions: ProcessOptions = {
      ...options,
      ...sampleOpts,
    };
    setOptions(newOptions);

    const newItem: ImageItem = {
      id: `sample-${Date.now()}`,
      name: `${title.toLowerCase().replace(/\s+/g, '_')}.png`,
      originalSrc: dataUrl,
      status: 'idle',
      metadata: {
        name: `${title}.png`,
        originalWidth: img.naturalWidth,
        originalHeight: img.naturalHeight,
        originalSize: 52000,
      },
    };

    setItems((prev) => [newItem, ...prev]);
    setSelectedId(newItem.id);
    setActiveTab('workspace');
    setAiTip(undefined);

    processItem(newItem, newOptions);
  };

  // AI Auto-Tune endpoint caller
  const handleAnalyzeAI = async () => {
    if (!selectedItem) return;

    setIsAnalyzingAI(true);
    try {
      const res = await fetch('/api/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedItem.originalSrc,
          mimeType: 'image/png',
        }),
      });

      const data = await res.json();
      if (data.success && data.analysis) {
        const a = data.analysis;
        const newOpts: ProcessOptions = {
          ...options,
          removeBg: true,
          bgMode: a.isWhiteBg ? 'white' : a.isDarkBg ? 'dark' : 'auto',
          targetColor: a.dominantBgColor && a.dominantBgColor.startsWith('#') ? a.dominantBgColor : options.targetColor,
          colorTolerance: a.recommendedTolerance || 24,
          deblurStrength: a.recommendedSharpness || 80,
          deblurRadius: a.recommendedDeblur || 1.8,
          deblurPreset: 'custom',
          edgeFeather: a.edgeSoftness === 'soft' ? 4 : 2,
        };

        setOptions(newOpts);
        setAiTip(
          `Subjek: ${a.detectedSubject || 'Objek Terdeteksi'}. Warna latar: ${a.dominantBgColor || 'Putih'}. Tingkat blur: ${
            a.blurSeverity || 'Sedang'
          }. Pengaturan optimal telah diterapkan secara otomatis.`
        );

        processItem(selectedItem, newOpts);
      }
    } catch (err) {
      console.error('AI Analyze error:', err);
      setAiTip('Analisis lokal aktif: Parameter disesuaikan untuk ketajaman optimal.');
      handleApply();
    } finally {
      setIsAnalyzingAI(false);
    }
  };

  // Download processed PNG
  const handleDownload = () => {
    if (!selectedItem?.processedSrc) return;

    const link = document.createElement('a');
    link.href = selectedItem.processedSrc;
    const cleanName = selectedItem.name.replace(/\.[^/.]+$/, '');
    link.download = `${cleanName}-upscale${options.upscaleFactor}x-deblur-transparent.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download all completed items
  const handleDownloadAll = () => {
    const completedItems = items.filter((i) => i.status === 'done' && i.processedSrc);
    completedItems.forEach((item, index) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = item.processedSrc!;
        const cleanName = item.name.replace(/\.[^/.]+$/, '');
        link.download = `${cleanName}-upscaled-transparent.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, index * 250);
    });
  };

  // Process all queued items
  const handleProcessAll = async () => {
    setIsProcessing(true);
    for (const item of items) {
      if (item.status !== 'done') {
        await processItem(item, options);
      }
    }
    setIsProcessing(false);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOverGlobal(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setDragOverGlobal(false);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragOverGlobal(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          handleUploadFiles(e.dataTransfer.files);
        }
      }}
      className="flex flex-col h-screen w-full bg-slate-950 font-sans text-slate-100 overflow-hidden relative"
    >
      {/* Global Drag & Drop Overlay */}
      {dragOverGlobal && (
        <div className="absolute inset-0 bg-indigo-900/90 backdrop-blur-md z-50 flex flex-col items-center justify-center border-4 border-dashed border-indigo-400 p-8 text-center pointer-events-none">
          <Upload className="w-16 h-16 text-indigo-200 animate-bounce mb-4" />
          <h2 className="text-xl font-bold text-white">Lepas File PNG untuk Memproses</h2>
          <p className="text-sm text-indigo-200 mt-2">
            Meningkatkan resolusi, menghilangkan blur, dan membuat latar transparan secara otomatis
          </p>
        </div>
      )}

      {/* Top Bar Header */}
      <Header
        onProcess={handleApply}
        onDownload={handleDownload}
        canDownload={Boolean(selectedItem?.processedSrc)}
        isProcessing={isProcessing}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex overflow-hidden relative">
        {activeTab === 'guide' ? (
          <GuideModal onBackToStudio={() => setActiveTab('workspace')} />
        ) : activeTab === 'batch' ? (
          <BatchQueue
            items={items}
            selectedId={selectedId}
            onSelect={(id) => {
              setSelectedId(id);
              setActiveTab('workspace');
            }}
            onRemove={(id) => {
              setItems((prev) => prev.filter((i) => i.id !== id));
              if (selectedId === id) {
                const remaining = items.filter((i) => i.id !== id);
                setSelectedId(remaining.length > 0 ? remaining[0].id : null);
              }
            }}
            onClear={() => {
              setItems([]);
              setSelectedId(null);
            }}
            onProcessAll={handleProcessAll}
            onDownloadAll={handleDownloadAll}
            onUploadFiles={handleUploadFiles}
            isProcessing={isProcessing}
          />
        ) : (
          /* Studio Workspace View */
          <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden">
            {/* Center: Image Comparison Viewer */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
              {selectedItem ? (
                <ImageComparisonViewer
                  item={selectedItem}
                  onPickColor={(hex) => {
                    setOptions({
                      ...options,
                      bgMode: 'custom_color',
                      targetColor: hex,
                      removeBg: true,
                    });
                  }}
                  isEyedropperActive={isEyedropperActive}
                  setIsEyedropperActive={setIsEyedropperActive}
                  isProcessing={isProcessing}
                />
              ) : (
                /* Empty Upload State */
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-900">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="max-w-md w-full border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-10 cursor-pointer transition-all bg-slate-800/40 hover:bg-slate-800/80 group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 text-indigo-400 mx-auto flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Upload className="w-7 h-7" />
                    </div>
                    <h3 className="text-base font-bold text-white mb-1">Unggah Gambar PNG Anda</h3>
                    <p className="text-xs text-slate-400 mb-4">
                      Tingkatkan ketajaman hingga 8x, hilangkan blur kompresi, dan buat latar belakang transparan
                    </p>
                    <button
                      type="button"
                      className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg shadow-sm"
                    >
                      Pilih Berkas PNG
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) => e.target.files && handleUploadFiles(e.target.files)}
                      className="hidden"
                    />
                  </div>
                </div>
              )}

              {/* Bottom Quick Presets Showcase */}
              <PresetGallery onSelectSample={handleSelectSample} />
            </div>

            {/* Right: Controls Configuration Panel */}
            <ControlsPanel
              options={options}
              onChange={(newOpts) => {
                setOptions(newOpts);
                if (selectedItem) {
                  processItem(selectedItem, newOpts);
                }
              }}
              onAnalyzeAI={handleAnalyzeAI}
              isAnalyzingAI={isAnalyzingAI}
              aiTip={aiTip}
              isEyedropperActive={isEyedropperActive}
              setIsEyedropperActive={setIsEyedropperActive}
              isProcessing={isProcessing}
              onApply={handleApply}
            />
          </div>
        )}
      </div>
    </div>
  );
}
