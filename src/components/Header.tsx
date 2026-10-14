import React from 'react';
import { Download, Sparkles, Layers } from 'lucide-react';

interface HeaderProps {
  onProcess: () => void;
  onDownload: () => void;
  canDownload: boolean;
  isProcessing: boolean;
  activeTab: 'workspace' | 'batch' | 'guide';
  setActiveTab: (tab: 'workspace' | 'batch' | 'guide') => void;
}

export const Header: React.FC<HeaderProps> = ({
  onProcess,
  onDownload,
  canDownload,
  isProcessing,
  activeTab,
  setActiveTab,
}) => {
  return (
    <header className="h-16 border-b border-slate-200 bg-white/95 backdrop-blur-sm sticky top-0 z-40 px-6 flex items-center justify-between gap-8">
      {/* Zone 1: Brand Wordmark (Single text element) */}
      <div className="flex items-center gap-3 shrink-0">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('workspace');
          }}
          className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 flex items-center gap-2"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <span>ClariPNG</span>
        </a>
        <span className="text-xs text-slate-400 hidden sm:inline">PNG Upscaler & Deblur</span>
      </div>

      {/* Zone 2: Single-line Navigation Links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
        <button
          onClick={() => setActiveTab('workspace')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${
            activeTab === 'workspace' ? 'border-indigo-600 text-slate-900 font-semibold' : 'border-transparent'
          }`}
        >
          Studio Upscaler
        </button>
        <button
          onClick={() => setActiveTab('batch')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${
            activeTab === 'batch' ? 'border-indigo-600 text-slate-900 font-semibold' : 'border-transparent'
          }`}
        >
          Antrean Batch
        </button>
        <button
          onClick={() => setActiveTab('guide')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${
            activeTab === 'guide' ? 'border-indigo-600 text-slate-900 font-semibold' : 'border-transparent'
          }`}
        >
          Panduan & Presisi
        </button>
      </nav>

      {/* Zone 3: Primary Action CTA */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onProcess}
          disabled={isProcessing}
          className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 disabled:opacity-50"
          title="Terapkan perbaikan blur dan latar transparan"
        >
          <Layers className="w-3.5 h-3.5 text-slate-600" />
          <span>{isProcessing ? 'Memproses...' : 'Terapkan Ulang'}</span>
        </button>

        <button
          onClick={onDownload}
          disabled={!canDownload || isProcessing}
          className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-sm transition-all whitespace-nowrap shrink-0 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Unduh PNG Transparan</span>
        </button>
      </div>
    </header>
  );
};
