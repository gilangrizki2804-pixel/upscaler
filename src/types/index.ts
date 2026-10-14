export type UpscaleFactor = 1 | 2 | 4 | 8;

export type DeblurPreset = 'gentle' | 'balanced' | 'crisp' | 'ultra' | 'custom';

export type BgRemovalMode = 'none' | 'auto' | 'white' | 'dark' | 'custom_color';

export interface ProcessOptions {
  upscaleFactor: UpscaleFactor;
  deblurPreset: DeblurPreset;
  deblurStrength: number; // 0 to 100
  deblurRadius: number; // 0.5 to 5.0
  deblurThreshold: number; // 0 to 20
  edgeEnhancement: number; // 0 to 100
  removeBg: boolean;
  bgMode: BgRemovalMode;
  targetColor: string; // Hex color e.g. '#ffffff'
  colorTolerance: number; // 5 to 80
  edgeFeather: number; // 0 to 8
  defringe: boolean;
  floodFromEdgesOnly: boolean; // if true, protects interior areas
}

export interface ImageMetadata {
  name: string;
  originalWidth: number;
  originalHeight: number;
  originalSize: number; // bytes
  outputWidth?: number;
  outputHeight?: number;
  outputSize?: number;
  transparentRatio?: number; // 0 to 1
  processTimeMs?: number;
}

export interface ImageItem {
  id: string;
  name: string;
  originalSrc: string;
  processedSrc?: string;
  metadata: ImageMetadata;
  status: 'idle' | 'processing' | 'done' | 'error';
  errorMessage?: string;
  aiAnalysis?: {
    detectedSubject?: string;
    dominantBgColor?: string;
    recommendedDeblur?: number;
    recommendedSharpness?: number;
    recommendedTolerance?: number;
    blurSeverity?: string;
    recommendationTips?: string;
  };
}

export interface SamplePreset {
  id: string;
  title: string;
  description: string;
  category: string;
  previewUrl: string;
  recommendedOptions: Partial<ProcessOptions>;
}
