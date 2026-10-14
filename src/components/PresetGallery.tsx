import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { generateSampleDataUrl } from '../utils/imageProcessing';
import { ProcessOptions } from '../types';

interface PresetGalleryProps {
  onSelectSample: (name: string, dataUrl: string, options: Partial<ProcessOptions>) => void;
}

export const PresetGallery: React.FC<PresetGalleryProps> = ({ onSelectSample }) => {
  const samples = [
    {
      id: 'logo',
      title: 'Logo Shield Korporat',
      description: 'Emblem gradien dengan blur tinggi pada latar putih polos.',
      options: {
        upscaleFactor: 4 as const,
        deblurStrength: 85,
        deblurRadius: 2.0,
        deblurThreshold: 1,
        edgeEnhancement: 50,
        removeBg: true,
        bgMode: 'white' as const,
        colorTolerance: 20,
        edgeFeather: 2,
        defringe: true,
        floodFromEdgesOnly: true,
      },
    },
    {
      id: 'mascot',
      title: 'Stiker Maskot Robot',
      description: 'Karakter vektor kartun dengan blur pada latar abu-abu terang.',
      options: {
        upscaleFactor: 4 as const,
        deblurStrength: 80,
        deblurRadius: 1.8,
        deblurThreshold: 2,
        edgeEnhancement: 40,
        removeBg: true,
        bgMode: 'auto' as const,
        colorTolerance: 28,
        edgeFeather: 2,
        defringe: true,
        floodFromEdgesOnly: true,
      },
    },
    {
      id: 'sneaker',
      title: 'Produk Sepatu Sneaker',
      description: 'Foto komersial produk sneaker dengan blur kamera halus.',
      options: {
        upscaleFactor: 2 as const,
        deblurStrength: 65,
        deblurRadius: 1.5,
        deblurThreshold: 2,
        edgeEnhancement: 30,
        removeBg: true,
        bgMode: 'auto' as const,
        colorTolerance: 22,
        edgeFeather: 3,
        defringe: true,
        floodFromEdgesOnly: true,
      },
    },
    {
      id: 'stamp',
      title: 'Stempel Tipografi Vintage',
      description: 'Lencana teks stempel lingkaran beresolusi rendah dan buram.',
      options: {
        upscaleFactor: 4 as const,
        deblurStrength: 95,
        deblurRadius: 2.2,
        deblurThreshold: 1,
        edgeEnhancement: 60,
        removeBg: true,
        bgMode: 'white' as const,
        colorTolerance: 25,
        edgeFeather: 1,
        defringe: true,
        floodFromEdgesOnly: false,
      },
    },
  ];

  return (
    <div className="p-6 bg-slate-900 border-t border-slate-800">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Contoh Gambar Uji Langsung (1-Klik Test)
            </h3>
            <p className="text-xs text-slate-400">
              Uji langsung keampuhan upscaler, penghilang blur, dan latar transparan tanpa perlu mengunggah file.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {samples.map((s) => {
            const previewUrl = generateSampleDataUrl(s.id);
            return (
              <div
                key={s.id}
                onClick={() => onSelectSample(s.title, previewUrl, s.options)}
                className="group bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-indigo-500/50 rounded-xl p-3.5 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-square w-full rounded-lg overflow-hidden bg-white mb-3 flex items-center justify-center border border-slate-700/60 group-hover:scale-[1.02] transition-transform">
                    <img src={previewUrl} alt={s.title} className="w-full h-full object-contain" />
                  </div>
                  <h4 className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors">
                    {s.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {s.description}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-indigo-400 font-semibold">
                  <span>Coba Contoh Ini</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
