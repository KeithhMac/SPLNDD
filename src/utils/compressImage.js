// src/utils/compressImage.js
import imageCompression from "browser-image-compression";

/**
 * Compress an image in the browser using browser-image-compression.
 * Returns the compressed File (or original file on failure).
 */
export async function compressImage(file, opts = {}) {
  if (!file?.type?.startsWith("image/")) return file;

  const options = {
    // sensible defaults; tweak freely
    maxSizeMB: 1.2, // try to keep ≤ ~1.2MB
    maxWidthOrHeight: 1600, // cap resolution
    useWebWorker: true,
    initialQuality: 0.8,
    fileType: "image/webp", // output format
    ...opts,
  };

  try {
    const compressed = await imageCompression(file, options);
    const base = (file.name || "image").replace(/\.[^.]+$/, "");
    const ext = options.fileType?.split("/")[1] || "webp";
    return new File([compressed], `${base}.${ext}`, {
      type: options.fileType || compressed.type,
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}
