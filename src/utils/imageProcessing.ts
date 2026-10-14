import { ProcessOptions, UpscaleFactor } from '../types';

/**
 * Converts a Hex color (#RRGGBB) to RGB object
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map((c) => c + c).join('');
  }
  const num = parseInt(cleanHex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Loads an image from a Data URL / URL into an HTMLImageElement
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error('Gagal memuat gambar: ' + err));
    img.src = src;
  });
}

/**
 * Detects the dominant background color by sampling perimeter pixels
 */
export function detectPerimeterBgColor(ctx: CanvasRenderingContext2D, width: number, height: number): { r: number; g: number; b: number; hex: string } {
  const edgeData = ctx.getImageData(0, 0, width, height);
  const data = edgeData.data;

  // Sample perimeter pixels (corners and edges)
  const samples: { r: number; g: number; b: number }[] = [];
  const step = Math.max(1, Math.floor(Math.min(width, height) / 40));

  // Top and bottom edges
  for (let x = 0; x < width; x += step) {
    // top
    const idxTop = (0 * width + x) * 4;
    samples.push({ r: data[idxTop], g: data[idxTop + 1], b: data[idxTop + 2] });
    // bottom
    const idxBottom = ((height - 1) * width + x) * 4;
    samples.push({ r: data[idxBottom], g: data[idxBottom + 1], b: data[idxBottom + 2] });
  }

  // Left and right edges
  for (let y = 0; y < height; y += step) {
    const idxLeft = (y * width + 0) * 4;
    samples.push({ r: data[idxLeft], g: data[idxLeft + 1], b: data[idxLeft + 2] });
    const idxRight = (y * width + (width - 1)) * 4;
    samples.push({ r: data[idxRight], g: data[idxRight + 1], b: data[idxRight + 2] });
  }

  if (samples.length === 0) {
    return { r: 255, g: 255, b: 255, hex: '#FFFFFF' };
  }

  // Average perimeter color
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  for (const s of samples) {
    sumR += s.r;
    sumG += s.g;
    sumB += s.b;
  }
  const avgR = Math.round(sumR / samples.length);
  const avgG = Math.round(sumG / samples.length);
  const avgB = Math.round(sumB / samples.length);

  const hex = `#${((1 << 24) + (avgR << 16) + (avgG << 8) + avgB).toString(16).slice(1).toUpperCase()}`;
  return { r: avgR, g: avgG, b: avgB, hex };
}

/**
 * Deblurs and sharpens an ImageData using Unsharp Mask (USM) + Laplacian high-pass boost
 */
export function applyDeblurAndSharpen(
  imageData: ImageData,
  strength: number, // 0 to 100
  radius: number = 1.5,
  threshold: number = 2,
  edgeEnhancement: number = 25
): ImageData {
  const width = imageData.width;
  const height = imageData.height;
  const src = imageData.data;

  if (strength <= 0 && edgeEnhancement <= 0) {
    return imageData;
  }

  const output = new ImageData(new Uint8ClampedArray(src), width, height);
  const dst = output.data;

  // 1. Create a blurred copy using 1D separable box/gaussian approximation
  const blurred = new Float32Array(width * height * 4);
  const temp = new Float32Array(width * height * 4);

  // Copy src to float array
  for (let i = 0; i < src.length; i++) {
    blurred[i] = src[i];
  }

  const r = Math.max(1, Math.round(radius));

  // Horizontal blur pass
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let rSum = 0, gSum = 0, bSum = 0, count = 0;
      for (let k = -r; k <= r; k++) {
        const nx = Math.min(width - 1, Math.max(0, x + k));
        const idx = (y * width + nx) * 4;
        rSum += src[idx];
        gSum += src[idx + 1];
        bSum += src[idx + 2];
        count++;
      }
      const outIdx = (y * width + x) * 4;
      temp[outIdx] = rSum / count;
      temp[outIdx + 1] = gSum / count;
      temp[outIdx + 2] = bSum / count;
    }
  }

  // Vertical blur pass
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let rSum = 0, gSum = 0, bSum = 0, count = 0;
      for (let k = -r; k <= r; k++) {
        const ny = Math.min(height - 1, Math.max(0, y + k));
        const idx = (ny * width + x) * 4;
        rSum += temp[idx];
        gSum += temp[idx + 1];
        bSum += temp[idx + 2];
        count++;
      }
      const outIdx = (y * width + x) * 4;
      blurred[outIdx] = rSum / count;
      blurred[outIdx + 1] = gSum / count;
      blurred[outIdx + 2] = bSum / count;
    }
  }

  // 2. Unsharp Masking subtraction: Sharpened = Original + Amount * (Original - Blurred)
  const amount = (strength / 100) * 2.2;
  const edgeBoost = (edgeEnhancement / 100) * 0.8;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const alpha = src[idx + 3];

      // Skip fully transparent pixels
      if (alpha === 0) continue;

      for (let c = 0; c < 3; c++) {
        const orig = src[idx + c];
        const blur = blurred[idx + c];
        const diff = orig - blur;

        let val = orig;
        if (Math.abs(diff) >= threshold) {
          val = orig + diff * amount;
        }

        // Optional Laplacian edge boost for crisp micro-details
        if (edgeBoost > 0 && x > 0 && x < width - 1 && y > 0 && y < height - 1) {
          const top = src[((y - 1) * width + x) * 4 + c];
          const btm = src[((y + 1) * width + x) * 4 + c];
          const lft = src[(y * width + (x - 1)) * 4 + c];
          const rgt = src[(y * width + (x + 1)) * 4 + c];
          const laplacian = 4 * orig - (top + btm + lft + rgt);
          val += laplacian * edgeBoost * 0.25;
        }

        dst[idx + c] = Math.max(0, Math.min(255, Math.round(val)));
      }
      dst[idx + 3] = alpha;
    }
  }

  return output;
}

/**
 * Removes background and produces transparent PNG with defringing and soft edge matting
 */
export function applyBackgroundRemoval(
  imageData: ImageData,
  options: {
    mode: 'auto' | 'white' | 'dark' | 'custom_color';
    targetColorHex?: string;
    tolerance: number; // 5 to 80
    edgeFeather: number; // 0 to 8
    defringe: boolean;
    floodFromEdgesOnly: boolean;
  }
): ImageData {
  const width = imageData.width;
  const height = imageData.height;
  const src = imageData.data;
  const output = new ImageData(new Uint8ClampedArray(src), width, height);
  const dst = output.data;

  // Determine target background RGB
  let targetR = 255;
  let targetG = 255;
  let targetB = 255;

  if (options.mode === 'white') {
    targetR = 255;
    targetG = 255;
    targetB = 255;
  } else if (options.mode === 'dark') {
    targetR = 15;
    targetG = 15;
    targetB = 15;
  } else if (options.mode === 'custom_color' && options.targetColorHex) {
    const rgb = hexToRgb(options.targetColorHex);
    targetR = rgb.r;
    targetG = rgb.g;
    targetB = rgb.b;
  } else {
    // Auto: detect from canvas perimeter
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const ctx = tempCanvas.getContext('2d')!;
    ctx.putImageData(imageData, 0, 0);
    const bg = detectPerimeterBgColor(ctx, width, height);
    targetR = bg.r;
    targetG = bg.g;
    targetB = bg.b;
  }

  // Precompute color distance function
  const colorDist = (r: number, g: number, b: number): number => {
    // Weighted Euclidean distance matching human eye perception
    const dr = r - targetR;
    const dg = g - targetG;
    const db = b - targetB;
    return Math.sqrt(0.299 * dr * dr + 0.587 * dg * dg + 0.114 * db * db);
  };

  const tolerance = Math.max(3, options.tolerance);
  const feather = Math.max(0, options.edgeFeather);
  const maxTolerance = tolerance + feather;

  // Mask array: 0 = not processed/foreground, 1 = background/transparent, 2 = border feather
  const mask = new Uint8Array(width * height);

  if (options.floodFromEdgesOnly) {
    // Connected component flood fill from all perimeter pixels
    const visited = new Uint8Array(width * height);
    const queue: number[] = [];

    // Push all boundary pixels into queue
    for (let x = 0; x < width; x++) {
      queue.push(x); // top
      queue.push((height - 1) * width + x); // bottom
    }
    for (let y = 1; y < height - 1; y++) {
      queue.push(y * width); // left
      queue.push(y * width + (width - 1)); // right
    }

    let head = 0;
    while (head < queue.length) {
      const pos = queue[head++];
      if (visited[pos]) continue;
      visited[pos] = 1;

      const x = pos % width;
      const y = Math.floor(pos / width);
      const idx = pos * 4;

      const r = src[idx];
      const g = src[idx + 1];
      const b = src[idx + 2];
      const alpha = src[idx + 3];

      if (alpha === 0) {
        mask[pos] = 1;
      } else {
        const dist = colorDist(r, g, b);
        if (dist <= maxTolerance) {
          mask[pos] = dist <= tolerance ? 1 : 2;

          // Expand to 4-neighbors
          if (x > 0 && !visited[pos - 1]) queue.push(pos - 1);
          if (x < width - 1 && !visited[pos + 1]) queue.push(pos + 1);
          if (y > 0 && !visited[pos - width]) queue.push(pos - width);
          if (y < height - 1 && !visited[pos + width]) queue.push(pos + width);
        }
      }
    }
  } else {
    // Global color thresholding
    for (let i = 0; i < width * height; i++) {
      const idx = i * 4;
      const r = src[idx];
      const g = src[idx + 1];
      const b = src[idx + 2];
      const alpha = src[idx + 3];

      if (alpha === 0) {
        mask[i] = 1;
        continue;
      }

      const dist = colorDist(r, g, b);
      if (dist <= tolerance) {
        mask[i] = 1; // Pure transparent
      } else if (dist <= maxTolerance) {
        mask[i] = 2; // Semi-transparent feather
      }
    }
  }

  // Apply mask to destination pixels with smooth alpha and defringing
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    const m = mask[i];

    if (m === 1) {
      // Background: full transparent
      dst[idx + 3] = 0;
    } else if (m === 2) {
      // Feathered border
      const r = src[idx];
      const g = src[idx + 1];
      const b = src[idx + 2];
      const dist = colorDist(r, g, b);

      // Smooth step calculation between tolerance and maxTolerance
      const t = (dist - tolerance) / (feather || 1);
      const smoothAlpha = Math.max(0, Math.min(1, t));
      const newAlpha = Math.round(src[idx + 3] * smoothAlpha);

      dst[idx + 3] = newAlpha;

      // Defringe: subtract background color contribution from edge
      if (options.defringe && smoothAlpha > 0.1 && smoothAlpha < 0.95) {
        const factor = 1 - smoothAlpha;
        dst[idx] = Math.max(0, Math.min(255, Math.round((r - factor * targetR) / smoothAlpha)));
        dst[idx + 1] = Math.max(0, Math.min(255, Math.round((g - factor * targetG) / smoothAlpha)));
        dst[idx + 2] = Math.max(0, Math.min(255, Math.round((b - factor * targetB) / smoothAlpha)));
      }
    } else {
      // Foreground: keep pristine
      dst[idx + 3] = src[idx + 3];
    }
  }

  return output;
}

/**
 * Upscales an image canvas using multi-stage bicubic super-sampling
 */
export async function upscaleCanvas(
  sourceCanvas: HTMLCanvasElement,
  factor: UpscaleFactor
): Promise<HTMLCanvasElement> {
  if (factor === 1) return sourceCanvas;

  const targetWidth = sourceCanvas.width * factor;
  const targetHeight = sourceCanvas.height * factor;

  // For multi-scale upscaling (e.g. 4x or 8x), perform intermediate 2x steps with smoothing
  let currentCanvas = sourceCanvas;
  let currentScale = 1;

  while (currentScale * 2 <= factor) {
    const nextWidth = currentCanvas.width * 2;
    const nextHeight = currentCanvas.height * 2;
    const stepCanvas = document.createElement('canvas');
    stepCanvas.width = nextWidth;
    stepCanvas.height = nextHeight;
    const ctx = stepCanvas.getContext('2d', { willReadFrequently: true })!;

    // High quality bicubic image smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(currentCanvas, 0, 0, nextWidth, nextHeight);

    currentCanvas = stepCanvas;
    currentScale *= 2;
  }

  // Final scale if factor wasn't an exact power of 2
  if (currentScale < factor) {
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = targetWidth;
    finalCanvas.height = targetHeight;
    const ctx = finalCanvas.getContext('2d', { willReadFrequently: true })!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(currentCanvas, 0, 0, targetWidth, targetHeight);
    return finalCanvas;
  }

  return currentCanvas;
}

/**
 * Full Pipeline: Upscale + Deblur + Background Transparency
 */
export async function processImagePipeline(
  img: HTMLImageElement,
  options: ProcessOptions
): Promise<{
  dataUrl: string;
  width: number;
  height: number;
  transparentRatio: number;
  processTimeMs: number;
}> {
  const startTime = performance.now();

  // 1. Initial draw on base canvas
  const baseCanvas = document.createElement('canvas');
  baseCanvas.width = img.naturalWidth || img.width;
  baseCanvas.height = img.naturalHeight || img.height;
  const baseCtx = baseCanvas.getContext('2d', { willReadFrequently: true })!;
  baseCtx.drawImage(img, 0, 0);

  // 2. Perform high-precision upscaling
  const upscaledCanvas = await upscaleCanvas(baseCanvas, options.upscaleFactor);
  const upCtx = upscaledCanvas.getContext('2d', { willReadFrequently: true })!;
  const width = upscaledCanvas.width;
  const height = upscaledCanvas.height;

  // Extract pixel buffer
  let imageData = upCtx.getImageData(0, 0, width, height);

  // 3. Apply Background Removal if enabled
  if (options.removeBg && options.bgMode !== 'none') {
    imageData = applyBackgroundRemoval(imageData, {
      mode: options.bgMode === 'white' ? 'white' : options.bgMode === 'dark' ? 'dark' : options.bgMode === 'custom_color' ? 'custom_color' : 'auto',
      targetColorHex: options.targetColor,
      tolerance: options.colorTolerance,
      edgeFeather: options.edgeFeather,
      defringe: options.defringe,
      floodFromEdgesOnly: options.floodFromEdgesOnly,
    });
  }

  // 4. Apply Deblur and Sharpening
  if (options.deblurStrength > 0 || options.edgeEnhancement > 0) {
    imageData = applyDeblurAndSharpen(
      imageData,
      options.deblurStrength,
      options.deblurRadius,
      options.deblurThreshold,
      options.edgeEnhancement
    );
  }

  // 5. Measure transparency statistics
  let transparentPixels = 0;
  const data = imageData.data;
  const totalPixels = width * height;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 128) {
      transparentPixels++;
    }
  }
  const transparentRatio = totalPixels > 0 ? transparentPixels / totalPixels : 0;

  // Write back to canvas
  upCtx.putImageData(imageData, 0, 0);

  // Export as lossless PNG with alpha channel preserved
  const dataUrl = upscaledCanvas.toDataURL('image/png');
  const processTimeMs = Math.round(performance.now() - startTime);

  return {
    dataUrl,
    width,
    height,
    transparentRatio,
    processTimeMs,
  };
}

/**
 * Generates sample demo images with simulated blur on canvas for instant testing
 */
export function generateSampleDataUrl(presetId: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 400;
  const ctx = canvas.getContext('2d')!;

  if (presetId === 'logo') {
    // Solid white background with blurry corporate emblem
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 400, 400);

    // Apply simulated blur
    ctx.filter = 'blur(3.5px)';

    // Modern geometric shield logo
    const gradient = ctx.createLinearGradient(120, 100, 280, 300);
    gradient.addColorStop(0, '#2563EB');
    gradient.addColorStop(0.5, '#4F46E5');
    gradient.addColorStop(1, '#7C3AED');
    ctx.fillStyle = gradient;

    ctx.beginPath();
    ctx.moveTo(200, 70);
    ctx.lineTo(290, 120);
    ctx.lineTo(290, 230);
    ctx.quadraticCurveTo(290, 310, 200, 340);
    ctx.quadraticCurveTo(110, 310, 110, 230);
    ctx.lineTo(110, 120);
    ctx.closePath();
    ctx.fill();

    // Inner sharp emblem
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(200, 190, 45, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#4F46E5';
    ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚡', 200, 190);

    ctx.filter = 'none';
  } else if (presetId === 'mascot') {
    // Mascot sticker with white border on light background
    ctx.fillStyle = '#F1F5F9';
    ctx.fillRect(0, 0, 400, 400);

    ctx.filter = 'blur(4px)';

    // Robot head
    ctx.fillStyle = '#0EA5E9';
    ctx.beginPath();
    ctx.roundRect(110, 110, 180, 160, [32]);
    ctx.fill();

    // Robot ears
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.rect(90, 160, 20, 40);
    ctx.rect(290, 160, 20, 40);
    ctx.fill();

    // Robot visor/screen
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.roundRect(130, 140, 140, 65, [18]);
    ctx.fill();

    // Eyes glowing cyan
    ctx.fillStyle = '#38BDF8';
    ctx.beginPath();
    ctx.arc(165, 172, 16, 0, Math.PI * 2);
    ctx.arc(235, 172, 16, 0, Math.PI * 2);
    ctx.fill();

    // Smile
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(200, 225, 24, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();

    // Antenna
    ctx.strokeStyle = '#64748B';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(200, 110);
    ctx.lineTo(200, 70);
    ctx.stroke();

    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.arc(200, 65, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.filter = 'none';
  } else if (presetId === 'sneaker') {
    // Product shoe on clean studio gray
    ctx.fillStyle = '#E2E8F0';
    ctx.fillRect(0, 0, 400, 400);

    ctx.filter = 'blur(3px)';

    // Shoe sole
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(80, 260);
    ctx.quadraticCurveTo(150, 280, 320, 260);
    ctx.lineTo(330, 240);
    ctx.quadraticCurveTo(200, 250, 90, 240);
    ctx.closePath();
    ctx.fill();

    // Shoe body
    ctx.fillStyle = '#DC2626';
    ctx.beginPath();
    ctx.moveTo(90, 240);
    ctx.lineTo(130, 160);
    ctx.quadraticCurveTo(200, 170, 250, 210);
    ctx.lineTo(330, 240);
    ctx.closePath();
    ctx.fill();

    // Stripe accent
    ctx.fillStyle = '#FBBF24';
    ctx.beginPath();
    ctx.moveTo(150, 190);
    ctx.lineTo(260, 220);
    ctx.lineTo(250, 235);
    ctx.lineTo(140, 205);
    ctx.closePath();
    ctx.fill();

    ctx.filter = 'none';
  } else {
    // Stamp / Typography with blur on solid white
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 400, 400);

    ctx.filter = 'blur(3.2px)';

    ctx.strokeStyle = '#047857';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(200, 200, 130, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(200, 200, 115, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#047857';
    ctx.font = '800 28px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ORIGINAL', 200, 175);
    ctx.font = '700 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('QUALITY PNG', 200, 210);
    ctx.font = '600 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('★ 2026 EDITION ★', 200, 240);

    ctx.filter = 'none';
  }

  return canvas.toDataURL('image/png');
}
