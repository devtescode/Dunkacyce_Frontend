const MAX_DIMENSION = 1280;
const JPEG_QUALITY = 0.82;
const SMALL_FILE_BYTES = 300 * 1024;

/**
 * Shrink large photos before sending them to the backend. The admin upload
 * pipeline stores images in Cloudinary; smaller payloads avoid the SDK's
 * request timeout while keeping food photos sharp enough for cards.
 */
export async function prepareImageForUpload(file) {
  if (!file) return file;
  if (file.size <= SMALL_FILE_BYTES) return file;
  if (typeof window === "undefined" || typeof document === "undefined") return file;
  // Keep GIFs animated and let the backend reject unsupported formats.
  if (file.type === "image/gif" || file.type === "image/svg+xml") return file;

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";

    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error("Could not read the selected image."));
      image.src = objectUrl;
    });

    const sourceWidth = image.naturalWidth || image.width;
    const sourceHeight = image.naturalHeight || image.height;
    if (!sourceWidth || !sourceHeight) return file;

    const scale = Math.min(1, MAX_DIMENSION / Math.max(sourceWidth, sourceHeight));
    const width = Math.max(1, Math.round(sourceWidth * scale));
    const height = Math.max(1, Math.round(sourceHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) return file;
    context.drawImage(image, 0, 0, width, height);

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
    );
    if (!blob) return file;

    const baseName = file.name.replace(/\.[^.]+$/, "") || "food-image";
    const compressed = new File([blob], `${baseName}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });

    return compressed.size < file.size ? compressed : file;
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
