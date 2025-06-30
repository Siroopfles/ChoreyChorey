/**
 * Compresses an image client-side before uploading.
 * @param dataUrl The base64 data URL of the image.
 * @param options Options for compression (maxWidth and quality).
 * @returns A promise that resolves to the compressed image as a data URL.
 */
export function compressImage(
  dataUrl: string,
  options: { maxWidth: number; quality: number }
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
        // If on server, just return the original for now.
        // This function is intended for client-side use.
        resolve(dataUrl);
        return;
    }

    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        return reject(new Error('Failed to get canvas context'));
      }

      let { width, height } = img;

      if (width > options.maxWidth) {
        height = (height * options.maxWidth) / width;
        width = options.maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      resolve(canvas.toDataURL('image/jpeg', options.quality));
    };
    img.onerror = (error) => {
      reject(error);
    };
  });
}