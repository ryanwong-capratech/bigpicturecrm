/**
 * Front-end image compression using Canvas API.
 * Guarantees output ≤ TARGET_SIZE_BYTES by progressively reducing
 * quality and then dimensions until the target is met.
 *
 * - Max initial dimension: 1200px (longest side)
 * - JPEG quality: starts at 0.82, steps down to 0.35
 * - If still over limit after quality reduction, halve dimensions and retry
 * - Throws if the image cannot be loaded
 */

const MAX_DIMENSION = 1200;
const TARGET_SIZE_BYTES = 800 * 1024; // 800KB
const INITIAL_QUALITY = 0.82;
const MIN_QUALITY = 0.35;
const QUALITY_STEP = 0.08;

function calcDimensions(
  origW: number,
  origH: number,
  maxDim: number
): { width: number; height: number } {
  let w = origW;
  let h = origH;
  if (w > maxDim || h > maxDim) {
    if (w >= h) {
      h = Math.round((h / w) * maxDim);
      w = maxDim;
    } else {
      w = Math.round((w / h) * maxDim);
      h = maxDim;
    }
  }
  return { width: w, height: h };
}

function drawToCanvas(img: HTMLImageElement, width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable");
  ctx.drawImage(img, 0, 0, width, height);
  return canvas;
}

function base64ByteSize(base64: string): number {
  // Approximate decoded byte size from base64 string length
  return Math.round((base64.length * 3) / 4);
}

export interface CompressResult {
  base64: string;
  mimeType: string;
  originalSize: number;
  compressedSize: number;
}

export async function compressImage(file: File): Promise<CompressResult> {
  const originalSize = file.size;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let maxDim = MAX_DIMENSION;

      // Outer loop: reduce dimensions if needed
      while (maxDim >= 200) {
        const { width, height } = calcDimensions(img.naturalWidth, img.naturalHeight, maxDim);
        const canvas = drawToCanvas(img, width, height);

        // Inner loop: reduce quality
        let quality = INITIAL_QUALITY;
        while (quality >= MIN_QUALITY) {
          const dataUrl = canvas.toDataURL("image/jpeg", quality);
          const base64 = dataUrl.split(",")[1];
          const compressedSize = base64ByteSize(base64);

          if (compressedSize <= TARGET_SIZE_BYTES) {
            return resolve({ base64, mimeType: "image/jpeg", originalSize, compressedSize });
          }
          quality -= QUALITY_STEP;
        }

        // Still too large — halve the max dimension and retry
        maxDim = Math.floor(maxDim / 1.5);
      }

      // Last resort: use the smallest possible output
      const { width, height } = calcDimensions(img.naturalWidth, img.naturalHeight, 200);
      const canvas = drawToCanvas(img, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", MIN_QUALITY);
      const base64 = dataUrl.split(",")[1];
      const compressedSize = base64ByteSize(base64);
      resolve({ base64, mimeType: "image/jpeg", originalSize, compressedSize });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("無法載入圖片，請確認檔案格式正確"));
    };

    img.src = objectUrl;
  });
}
