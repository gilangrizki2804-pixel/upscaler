import React from 'react';
import {
  Sparkles,
  Zap,
  Scissors,
  CheckCircle,
  HelpCircle,
  Sliders,
  ShieldCheck,
  Maximize2,
} from 'lucide-react';

interface GuideModalProps {
  onBackToStudio: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ onBackToStudio }) => {
  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 p-6 md:p-10 overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full space-y-8 text-slate-200">
        {/* Header */}
        <div className="border-b border-slate-800 pb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <span>Panduan Teknik Restorasi & Transparansi PNG</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Prinsip algoritma super-sampling, Unsharp Mask deblurring, dan penghapusan latar belakang bersih tanpa halo.
            </p>
          </div>
          <button
            onClick={onBackToStudio}
            className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
          >
            Kembali ke Studio
          </button>
        </div>

        {/* Section 1: Cara Menghilangkan Blur */}
        <div className="bg-slate-800/80 rounded-xl p-6 border border-slate-700 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-400" />
            <span>1. Cara Kerja Algoritma Penghilang Blur (Deblur Engine)</span>
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Ketika gambar PNG mengalami blur atau kompresi, detail frekuensi tinggi (garis tepi, kontur teks, dan tekstur mikro) mengalami pelebaran spasial. ClariPNG memulihkan ketajaman tersebut melalui dua fase konvolusi:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            <div className="p-4 bg-slate-900/80 rounded-lg border border-slate-700/60 text-xs space-y-2">
              <div className="font-semibold text-indigo-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                <span>Unsharp Masking (USM)</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Menghitung selisih antara piksel asli dan Gaussian blur halus. Selisih frekuensi tinggi ini kemudian ditambahkan kembali dengan pengali intensitas untuk menegaskan tepian gambar.
              </p>
            </div>

            <div className="p-4 bg-slate-900/80 rounded-lg border border-slate-700/60 text-xs space-y-2">
              <div className="font-semibold text-indigo-300 flex items-center gap-1.5">
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Laplacian Edge Boost</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Matriks kernel diferensial orde dua yang mendeteksi perubahan kontras tajam di setiap piksel, mempertajam garis tepi logo dan teks tanpa memunculkan noise di area rata.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Latar Belakang Transparan & Defringe */}
        <div className="bg-slate-800/80 rounded-xl p-6 border border-slate-700 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Scissors className="w-4 h-4 text-emerald-400" />
            <span>2. Rahasia Menghasilkan Latar Belakang Transparan Tanpa Garis Putih (Defringe)</span>
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Menghapus latar belakang sering kali meninggalkan bekas garis putih tipis (halo/fringe) di sekeliling subjek. ClariPNG mengatasinya dengan teknologi matting presisi:
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3 text-xs">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                ✓
              </div>
              <div>
                <span className="font-bold text-slate-200">Proteksi Area Dalam (Flood from Edges):</span>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Algoritma banjir warna hanya merambat dari tepi luar kanvas ke dalam. Area putih di dalam subjek (misalnya pupil mata karakter atau huruf di dalam logo) tidak akan berlubang.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 text-xs">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                ✓
              </div>
              <div>
                <span className="font-bold text-slate-200">Defringe Filter:</span>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Secara matematis mengurangi nilai warna latar belakang yang terserap pada piksel semi-transparan di tepian subjek, sehingga subjek dapat diletakkan di latar belakang apapun tanpa garis putih.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 text-xs">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                ✓
              </div>
              <div>
                <span className="font-bold text-slate-200">Pipet Warna Interaktif (Eyedropper):</span>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Jika latar belakang memiliki warna khusus (seperti krem, hijau chroma, atau abu-abu), cukup aktifkan tombol Pipet dan klik warna tersebut langsung pada gambar.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Rekomendasi Parameter Berdasarkan Jenis Gambar */}
        <div className="bg-slate-800/80 rounded-xl p-6 border border-slate-700 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-amber-400" />
            <span>3. Panduan Pengaturan Ideal</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/60 text-slate-400 font-semibold border-b border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Tipe Gambar</th>
                  <th className="py-2.5 px-3">Faktor Upscale</th>
                  <th className="py-2.5 px-3">Intensitas Deblur</th>
                  <th className="py-2.5 px-3">Mode Latar</th>
                  <th className="py-2.5 px-3">Toleransi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-white">Logo & Ikon</td>
                  <td className="py-2.5 px-3 font-mono tabular-nums">4x</td>
                  <td className="py-2.5 px-3 font-mono tabular-nums text-indigo-400">80% - 90% (Tajam)</td>
                  <td className="py-2.5 px-3">Hapus Putih / Auto</td>
                  <td className="py-2.5 px-3 font-mono tabular-nums">20 - 25</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-white">Stiker / Ilustrasi</td>
                  <td className="py-2.5 px-3 font-mono tabular-nums">2x atau 4x</td>
                  <td className="py-2.5 px-3 font-mono tabular-nums text-indigo-400">70% - 85% (Tajam)</td>
                  <td className="py-2.5 px-3">Auto Deteksi</td>
                  <td className="py-2.5 px-3 font-mono tabular-nums">25 - 32</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-white">Foto Produk</td>
                  <td className="py-2.5 px-3 font-mono tabular-nums">2x</td>
                  <td className="py-2.5 px-3 font-mono tabular-nums text-indigo-400">50% - 65% (Seimbang)</td>
                  <td className="py-2.5 px-3">Auto / Kustom</td>
                  <td className="py-2.5 px-3 font-mono tabular-nums">18 - 24</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-white">Tipografi / Teks</td>
                  <td className="py-2.5 px-3 font-mono tabular-nums">4x atau 8x</td>
                  <td className="py-2.5 px-3 font-mono tabular-nums text-indigo-400">90% - 100% (Ultra)</td>
                  <td className="py-2.5 px-3">Hapus Putih</td>
                  <td className="py-2.5 px-3 font-mono tabular-nums">22 - 28</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
