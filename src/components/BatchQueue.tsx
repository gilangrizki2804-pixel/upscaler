import React, { useRef } from 'react';
import {
  Upload,
  Layers,
  Download,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { ImageItem } from '../types';

interface BatchQueueProps {
  items: ImageItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onProcessAll: () => void;
  onDownloadAll: () => void;
  onUploadFiles: (files: FileList | File[]) => void;
  isProcessing: boolean;
}

export const BatchQueue: React.FC<BatchQueueProps> = ({
  items,
  selectedId,
  onSelect,
  onRemove,
  onClear,
  onProcessAll,
  onDownloadAll,
  onUploadFiles,
  isProcessing,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUploadFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUploadFiles(e.target.files);
    }
  };

  const completedCount = items.filter((i) => i.status === 'done').length;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 p-6 overflow-y-auto">
      <div className="max-w-5xl mx-auto w-full space-y-6">
        {/* Header & Batch Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              <span>Antrean Batch PNG ({items.length} Gambar)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Tingkatkan resolusi, hilangkan blur, dan buat transparan sekaligus untuk banyak gambar.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Tambah File</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              onClick={onProcessAll}
              disabled={isProcessing || items.length === 0}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{isProcessing ? 'Memproses Semua...' : 'Proses Semua'}</span>
            </button>

            <button
              onClick={onDownloadAll}
              disabled={completedCount === 0}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Semua ({completedCount})</span>
            </button>

            {items.length > 0 && (
              <button
                onClick={onClear}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                title="Hapus Semua Antrean"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Drag & Drop Area */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-8 text-center cursor-pointer transition-colors bg-slate-800/40 hover:bg-slate-800/70"
        >
          <div className="w-12 h-12 rounded-full bg-indigo-600/20 text-indigo-400 mx-auto flex items-center justify-center mb-3">
            <Upload className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-200">
            Tarik & Lepas File PNG ke Sini atau Klik untuk Memilih
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Mendukung file PNG, JPEG, dan WEBP transparan dengan resolusi hingga 4K
          </p>
        </div>

        {/* Queue Items Table / Grid */}
        {items.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            Belum ada gambar dalam antrean. Unggah beberapa gambar di atas atau gunakan contoh di Studio.
          </div>
        ) : (
          <div className="bg-slate-800/80 rounded-xl border border-slate-700/80 overflow-hidden divide-y divide-slate-700/60">
            {items.map((item) => {
              const isSelected = item.id === selectedId;
              return (
                <div
                  key={item.id}
                  onClick={() => onSelect(item.id)}
                  className={`p-4 flex items-center justify-between gap-4 transition-colors cursor-pointer ${
                    isSelected ? 'bg-indigo-950/40 border-l-2 border-indigo-500' : 'hover:bg-slate-800'
                  }`}
                >
                  {/* Left: Thumbnail & Name */}
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-checkerboard flex-shrink-0 border border-slate-600">
                      <img
                        src={item.processedSrc || item.originalSrc}
                        alt={item.name}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-100 truncate">{item.name}</h4>
                        {isSelected && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold">
                            Sedang Dibuka
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-mono tabular-nums">
                        <span>
                          {item.metadata.originalWidth} × {item.metadata.originalHeight} px
                        </span>
                        {item.metadata.outputWidth && (
                          <>
                            <span className="text-indigo-400">→</span>
                            <span className="text-indigo-300 font-semibold">
                              {item.metadata.outputWidth} × {item.metadata.outputHeight} px
                            </span>
                          </>
                        )}
                        {item.metadata.processTimeMs !== undefined && (
                          <>
                            <span className="text-slate-600">·</span>
                            <span>{item.metadata.processTimeMs}ms</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Status & Actions */}
                  <div className="flex items-center gap-3">
                    {/* Status Badge */}
                    {item.status === 'done' ? (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Selesai</span>
                      </div>
                    ) : item.status === 'processing' ? (
                      <div className="flex items-center gap-1.5 text-xs text-amber-400 font-medium bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/30">
                        <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                        <span>Memproses</span>
                      </div>
                    ) : item.status === 'error' ? (
                      <div className="flex items-center gap-1.5 text-xs text-rose-400 font-medium bg-rose-500/10 px-2.5 py-1 rounded-md border border-rose-500/30">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Gagal</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium bg-slate-700/50 px-2.5 py-1 rounded-md">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Menunggu</span>
                      </div>
                    )}

                    {/* Open in Studio Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(item.id);
                      }}
                      className="px-2.5 py-1.5 text-xs font-semibold text-indigo-300 hover:text-white hover:bg-indigo-600/30 rounded-md transition-colors flex items-center gap-1"
                      title="Buka di Studio Perbandingan"
                    >
                      <span>Buka Studio</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>

                    {/* Remove Item Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(item.id);
                      }}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded transition-colors"
                      title="Hapus dari antrean"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
