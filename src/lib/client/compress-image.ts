type CompressOptions = {
  maxDimension?: number;
  quality?: number;
  /** Target max bytes for the output blob (JPEG). */
  maxBytes?: number;
};

const DEFAULT_MAX_DIMENSION = 1280;
const DEFAULT_QUALITY = 0.82;
const DEFAULT_MAX_BYTES = 2_800_000;

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read this image."));
    };
    img.src = url;
  });
}

function scaleDimensions(
  width: number,
  height: number,
  maxDimension: number
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= maxDimension) return { width, height };
  const scale = maxDimension / longest;
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not compress image."))),
      "image/jpeg",
      quality
    );
  });
}

/** Resize and compress a camera/gallery photo for API upload (stays under Vercel body limits). */
export async function compressImageForUpload(
  file: File,
  options: CompressOptions = {}
): Promise<{ file: File; dataUrl: string; mimeType: string }> {
  const maxDimension = options.maxDimension ?? DEFAULT_MAX_DIMENSION;
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  let quality = options.quality ?? DEFAULT_QUALITY;

  const img = await loadImageFromFile(file);
  const { width, height } = scaleDimensions(img.naturalWidth, img.naturalHeight, maxDimension);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not prepare image.");

  ctx.drawImage(img, 0, 0, width, height);

  let blob = await canvasToBlob(canvas, quality);
  while (blob.size > maxBytes && quality > 0.45) {
    quality -= 0.08;
    blob = await canvasToBlob(canvas, quality);
  }

  const compressed = new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", {
    type: "image/jpeg",
    lastModified: Date.now(),
  });

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read compressed image."));
    reader.readAsDataURL(compressed);
  });

  return { file: compressed, dataUrl, mimeType: "image/jpeg" };
}
