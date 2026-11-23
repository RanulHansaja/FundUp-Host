/**
 * Client-side image compression utility using HTML5 Canvas.
 * Automatically reduces high-resolution phone/camera photos (3MB - 12MB)
 * down to web-optimized 150KB - 300KB JPEGs before uploading over HTTP.
 * This prevents HTTP 413 (Payload Too Large) errors and drastically improves upload speeds.
 */
export const compressImage = (file, maxWidth = 1200, quality = 0.8) => {
  return new Promise((resolve) => {
    if (!file || !file.type || !file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    // If file is already smaller than 350KB, keep it untouched
    if (file.size < 350 * 1024) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const cleanName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
            const compressedFile = new File([blob], cleanName, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};

/**
 * Compresses an array of image files in parallel.
 */
export const compressImages = async (files, maxWidth = 1200, quality = 0.8) => {
  if (!files || !Array.isArray(files)) return [];
  return Promise.all(files.map((f) => compressImage(f, maxWidth, quality)));
};
