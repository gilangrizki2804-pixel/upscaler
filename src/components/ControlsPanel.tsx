import React, { useState } from 'react';
import {
  Sparkles,
  Sliders,
  Eye,
  Maximize2,
  Scissors,
  Check,
  ChevronDown,
  ChevronUp,
  Pipette,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { ProcessOptions, UpscaleFactor, DeblurPreset, BgRemovalMode } from '../types';

interface ControlsPanelProps {
  options: ProcessOptions;
  onChange: (options: ProcessOptions) => void;
  onAnalyzeAI: () => void;
  isAnalyzingAI: boolean;
  aiTip?: string;
  isEyedropperActive: boolean;
  setIsEyedropperActive: (active: boolean) => void;
  isProcessing: boolean;
  onApply: () => void;
}

export const ControlsPanel: React.FC<ControlsPanelProps> = ({
  options,
  onChange,
  onAnalyzeAI,
  isAnalyzingAI,
  aiTip,
  isEyedropperActive,
  setIsEyedropperActive,
  isProcessing,
  onApply,
}) => {
  const [showAdvancedDeblur, setShowAdvancedDeblur] = useState(false);
  const [showAdvancedBg, setShowAdvancedBg] = useState(false);

  const setUpscaleFactor = (factor: UpscaleFactor) => {
    onChange({ ...options, upscaleFactor: factor });
  };

  const setDeblurPreset = (preset: DeblurPreset) => {
    let strength = options.deblurStrength;
    let radius = options.deblurRadius;
    let threshold = options.deblurThreshold;
    let edgeEnhancement = options.edgeEnhancement;

    switch (preset) {
      case 'gentle':
        strength = 35;
        radius = 1.2;
        threshold = 3;
        edgeEnhancement = 15;
        break;
      case 'balanced':
        strength = 60;
        radius = 1.6;
        threshold = 2;
        edgeEnhancement = 28;
        break;
      case 'crisp':
        strength = 80;
        radius = 2.0;
        threshold = 2;
        edgeEnhancement = 45;
        break;
      case 'ultra':
        strength = 100;
        radius = 2.5;
        threshold = 1;
        edgeEnhancement = 65;
        break;
    }

    onChange({
      ...options,
      deblurPreset: preset,
      deblurStrength: strength,
      deblurRadius: radius,
      deblurThreshold: threshold,
      edgeEnhancement,
    });
  };

  const setBgMode = (mode: BgRemovalMode) => {
    let targetColor = options.targetColor;
    if (mode === 'white') targetColor = '#FFFFFF';
    if (mode === 'dark') targetColor = '#0F172A';

    onChange({
      ...options,
      bgMode: mode,
      targetColor,
      removeBg: mode !== 'none',
    });
  };

  return (
    <div className="w-full lg:w-80 xl:w-96 bg-white border-l border-slate-200 flex flex-col h-full overflow-y-auto">
      {/* Panel Header */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-600" />
            Parameter Restorasi PNG
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Kontrol ketajaman & transparansi</p>
        </div>

        <button
          onClick={onAnalyzeAI}
          disabled={isAnalyzingAI || isProcessing}
          className="text-xs px-2.5 py-1.5 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50"
          title="Analisis otomatis warna latar & tingkat blur dengan Gemini Vision"
        >
          <Sparkles className={`w-3.5 h-3.5 ${isAnalyzingAI ? 'animate-spin' : 'text-indigo-600'}`} />
          <span>{isAnalyzingAI ? 'Menganalisis...' : 'AI Auto-Tune'}</span>
        </button>
      </div>

      {/* AI Advice Notification (if present) */}
      {aiTip && (
        <div className="mx-5 mt-4 p-3 bg-indigo-50/70 border border-indigo-100 rounded-lg text-xs text-indigo-900 leading-relaxed">
          <div className="font-semibold text-indigo-950 flex items-center gap-1.5 mb-1">
            <Zap className="w-3.5 h-3.5 text-indigo-600" />
            <span>Rekomendasi AI</span>
          </div>
          <p className="text-indigo-800">{aiTip}</p>
        </div>
      )}

      <div className="p-5 space-y-6 flex-1">
        {/* Section 1: Upscale Factor */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
              1. Skala Resolusi (Upscale)
            </label>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              {options.upscaleFactor}x ({options.upscaleFactor * 100}%)
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-lg">
            {([1, 2, 4, 8] as UpscaleFactor[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setUpscaleFactor(f)}
                className={`py-1.5 text-xs font-semibold rounded-md transition-all ${
                  options.upscaleFactor === f
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f}x
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-500 leading-tight">
            Perbesar ukuran kanvas dengan algoritma super-sampling bertahap untuk menjaga ketajaman garis.
          </p>
        </div>

        {/* Section 2: Deblur & Sharpening */}
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-indigo-600" />
              2. Menghilangkan Blur (Deblur)
            </label>
            <span className="text-xs font-mono tabular-nums text-indigo-600 font-semibold">
              {options.deblurStrength}%
            </span>
          </div>

          {/* Preset Buttons */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-lg">
            {(['gentle', 'balanced', 'crisp', 'ultra'] as DeblurPreset[]).map((p) => {
              const labelMap: Record<string, string> = {
                gentle: 'Halus',
                balanced: 'Seimbang',
                crisp: 'Tajam',
                ultra: 'Ultra',
              };
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setDeblurPreset(p)}
                  className={`py-1.5 text-xs font-medium rounded-md transition-all ${
                    options.deblurPreset === p
                      ? 'bg-white text-slate-900 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {labelMap[p]}
                </button>
              );
            })}
          </div>

          {/* Strength Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Intensitas Penajaman</span>
              <span className="font-mono tabular-nums">{options.deblurStrength}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={options.deblurStrength}
              onChange={(e) =>
                onChange({
                  ...options,
                  deblurStrength: Number(e.target.value),
                  deblurPreset: 'custom',
                })
              }
              className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>

          {/* Advanced Deblur Toggle */}
          <button
            type="button"
            onClick={() => setShowAdvancedDeblur(!showAdvancedDeblur)}
            className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium transition-colors"
          >
            {showAdvancedDeblur ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            <span>{showAdvancedDeblur ? 'Sembunyikan Opsi Lanjutan' : 'Opsi Lanjutan Konvolusi'}</span>
          </button>

          {showAdvancedDeblur && (
            <div className="p-3 bg-slate-50 rounded-lg space-y-3 border border-slate-200 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-600">
                  <span>Radius Deblur (px)</span>
                  <span className="font-mono tabular-nums">{options.deblurRadius.toFixed(1)}px</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="4.0"
                  step="0.1"
                  value={options.deblurRadius}
                  onChange={(e) =>
                    onChange({
                      ...options,
                      deblurRadius: Number(e.target.value),
                      deblurPreset: 'custom',
                    })
                  }
                  className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-600">
                  <span>Laplacian Edge Boost</span>
                  <span className="font-mono tabular-nums">{options.edgeEnhancement}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={options.edgeEnhancement}
                  onChange={(e) =>
                    onChange({
                      ...options,
                      edgeEnhancement: Number(e.target.value),
                      deblurPreset: 'custom',
                    })
                  }
                  className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-600">
                  <span>Ambang Batas Noise (Threshold)</span>
                  <span className="font-mono tabular-nums">{options.deblurThreshold}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15"
                  value={options.deblurThreshold}
                  onChange={(e) =>
                    onChange({
                      ...options,
                      deblurThreshold: Number(e.target.value),
                      deblurPreset: 'custom',
                    })
                  }
                  className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Background Transparency */}
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <Scissors className="w-3.5 h-3.5 text-emerald-600" />
              3. Latar Transparan (Background)
            </label>
            <div className="flex items-center gap-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.removeBg}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    onChange({
                      ...options,
                      removeBg: checked,
                      bgMode: checked ? (options.bgMode === 'none' ? 'auto' : options.bgMode) : 'none',
                    });
                  }}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>

          {options.removeBg && (
            <div className="space-y-3">
              {/* Bg Mode Selector */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-lg text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setBgMode('auto')}
                  className={`py-1.5 px-2 rounded-md transition-all text-left flex items-center justify-between ${
                    options.bgMode === 'auto'
                      ? 'bg-white text-slate-900 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Auto Deteksi</span>
                  {options.bgMode === 'auto' && <Check className="w-3 h-3 text-emerald-600" />}
                </button>

                <button
                  type="button"
                  onClick={() => setBgMode('white')}
                  className={`py-1.5 px-2 rounded-md transition-all text-left flex items-center justify-between ${
                    options.bgMode === 'white'
                      ? 'bg-white text-slate-900 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Hapus Putih</span>
                  {options.bgMode === 'white' && <Check className="w-3 h-3 text-emerald-600" />}
                </button>

                <button
                  type="button"
                  onClick={() => setBgMode('dark')}
                  className={`py-1.5 px-2 rounded-md transition-all text-left flex items-center justify-between ${
                    options.bgMode === 'dark'
                      ? 'bg-white text-slate-900 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Hapus Gelap</span>
                  {options.bgMode === 'dark' && <Check className="w-3 h-3 text-emerald-600" />}
                </button>

                <button
                  type="button"
                  onClick={() => setBgMode('custom_color')}
                  className={`py-1.5 px-2 rounded-md transition-all text-left flex items-center justify-between ${
                    options.bgMode === 'custom_color'
                      ? 'bg-white text-slate-900 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Pipet / Kustom</span>
                  {options.bgMode === 'custom_color' && <Check className="w-3 h-3 text-emerald-600" />}
                </button>
              </div>

              {/* Custom Color Selector & Eyedropper */}
              {options.bgMode === 'custom_color' && (
                <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                  <input
                    type="color"
                    value={options.targetColor}
                    onChange={(e) => onChange({ ...options, targetColor: e.target.value })}
                    className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={options.targetColor}
                    onChange={(e) => onChange({ ...options, targetColor: e.target.value })}
                    className="flex-1 text-xs font-mono px-2 py-1 bg-white border border-slate-200 rounded text-slate-800"
                    placeholder="#FFFFFF"
                  />
                  <button
                    type="button"
                    onClick={() => setIsEyedropperActive(!isEyedropperActive)}
                    className={`p-1.5 rounded text-xs flex items-center gap-1 transition-colors ${
                      isEyedropperActive
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                    title="Klik pada gambar untuk mengambil warna latar"
                  >
                    <Pipette className="w-3.5 h-3.5" />
                    <span>{isEyedropperActive ? 'Klik Gambar' : 'Pipet'}</span>
                  </button>
                </div>
              )}

              {/* Tolerance Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-600">
                  <span>Toleransi Rentang Warna</span>
                  <span className="font-mono tabular-nums text-emerald-700 font-semibold">
                    {options.colorTolerance}
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="80"
                  value={options.colorTolerance}
                  onChange={(e) => onChange({ ...options, colorTolerance: Number(e.target.value) })}
                  className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
                <p className="text-[10px] text-slate-400">
                  Tingkatkan jika masih ada sisa latar belakang, turunkan jika subjek ikut terhapus.
                </p>
              </div>

              {/* Advanced Transparency Settings */}
              <button
                type="button"
                onClick={() => setShowAdvancedBg(!showAdvancedBg)}
                className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium transition-colors"
              >
                {showAdvancedBg ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                <span>{showAdvancedBg ? 'Sembunyikan Matting & Defringe' : 'Pengaturan Tepi & Matting'}</span>
              </button>

              {showAdvancedBg && (
                <div className="p-3 bg-slate-50 rounded-lg space-y-3 border border-slate-200 text-xs">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-600">
                      <span>Kehalusan Tepi (Feather)</span>
                      <span className="font-mono tabular-nums">{options.edgeFeather}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="8"
                      value={options.edgeFeather}
                      onChange={(e) => onChange({ ...options, edgeFeather: Number(e.target.value) })}
                      className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Defringe Checkbox */}
                  <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-700">
                    <input
                      type="checkbox"
                      checked={options.defringe}
                      onChange={(e) => onChange({ ...options, defringe: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">Defringe (Hilangkan Halo Tepi)</span>
                      <span className="text-[10px] text-slate-400">
                        Menghapus bias warna latar di pinggiran subjek
                      </span>
                    </div>
                  </label>

                  {/* Flood from Edges Only */}
                  <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-700">
                    <input
                      type="checkbox"
                      checked={options.floodFromEdgesOnly}
                      onChange={(e) => onChange({ ...options, floodFromEdgesOnly: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                    />
                    <div className="flex flex-col">
                      <span className="font-medium flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        Proteksi Area Dalam Subjek
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Cegah warna putih/gelap di dalam subjek ikut berlubang
                      </span>
                    </div>
                  </label>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center gap-2">
        <button
          onClick={onApply}
          disabled={isProcessing}
          className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Memproses PNG...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Terapkan Restorasi</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
