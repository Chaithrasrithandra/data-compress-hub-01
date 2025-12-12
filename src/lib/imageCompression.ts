// Client-side image compression using Canvas API

export interface ImageCompressionOptions {
  quality: number; // 0-100
  maxWidth?: number;
  maxHeight?: number;
  format: 'original' | 'webp' | 'jpeg' | 'png';
  targetSizeBytes?: number;
}

export interface ImageCompressionResult {
  blob: Blob;
  width: number;
  height: number;
  originalSize: number;
  compressedSize: number;
  format: string;
}

const getMimeType = (format: string, originalType: string): string => {
  switch (format) {
    case 'webp':
      return 'image/webp';
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    default:
      return originalType || 'image/jpeg';
  }
};

export const compressImage = async (
  file: File,
  options: ImageCompressionOptions
): Promise<ImageCompressionResult> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          throw new Error('Could not get canvas context');
        }

        let { width, height } = img;
        const maxWidth = options.maxWidth || 4096;
        const maxHeight = options.maxHeight || 4096;

        // Scale down if necessary
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;

        // Draw image to canvas
        ctx.drawImage(img, 0, 0, width, height);

        const mimeType = getMimeType(options.format, file.type);
        let quality = options.quality / 100;

        // If target size is specified, iteratively adjust quality
        if (options.targetSizeBytes) {
          let blob = await canvasToBlob(canvas, mimeType, quality);
          let iterations = 0;
          const maxIterations = 10;

          while (iterations < maxIterations) {
            if (Math.abs(blob.size - options.targetSizeBytes) < 1024) {
              break; // Close enough
            }

            if (blob.size > options.targetSizeBytes) {
              quality *= 0.8;
            } else {
              quality = Math.min(quality * 1.1, 1);
            }

            quality = Math.max(0.1, Math.min(1, quality));
            blob = await canvasToBlob(canvas, mimeType, quality);
            iterations++;
          }

          resolve({
            blob,
            width,
            height,
            originalSize: file.size,
            compressedSize: blob.size,
            format: mimeType,
          });
        } else {
          const blob = await canvasToBlob(canvas, mimeType, quality);
          resolve({
            blob,
            width,
            height,
            originalSize: file.size,
            compressedSize: blob.size,
            format: mimeType,
          });
        }
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

const canvasToBlob = (
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      },
      mimeType,
      quality
    );
  });
};

// Get image dimensions without loading the full image
export const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      reject(new Error('Failed to load image'));
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  });
};
