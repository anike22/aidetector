import { supabase } from '@/db/supabase';

export interface UploadImageResult {
  url: string;
  error?: string;
}

/**
 * Compress an image file in browser if it exceeds 1MB.
 */
export async function compressImageFile(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas 2D context unavailable'));

      let width = img.width;
      let height = img.height;
      const MAX_WIDTH = 1920;
      const MAX_HEIGHT = 1080;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width = Math.round((width * MAX_HEIGHT) / height);
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
            const newFile = new File([blob], `${cleanName}.webp`, {
              type: 'image/webp',
            });
            resolve(newFile);
          } else {
            reject(new Error('Canvas to Blob conversion failed'));
          }
        },
        'image/webp',
        0.82
      );
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };
  });
}

/**
 * Uploads an image to the Supabase storage 'images' bucket under 'uploads/'.
 * Returns the permanent public HTTPS URL.
 */
export async function uploadInlineImage(
  file: File,
  onProgress?: (progress: number) => void
): Promise<UploadImageResult> {
  try {
    let uploadFile = file;

    if (file.size > 1024 * 1024) {
      if (onProgress) onProgress(15);
      try {
        uploadFile = await compressImageFile(file);
      } catch (e) {
        console.warn('Image compression fallback to original:', e);
      }
    }

    if (onProgress) onProgress(40);

    const fileExt = uploadFile.name.split('.').pop() || 'webp';
    const randomId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const filePath = `uploads/${randomId}.${fileExt}`;

    const { error: uploadError, data } = await supabase.storage
      .from('images')
      .upload(filePath, uploadFile, {
        cacheControl: '31536000',
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    if (onProgress) onProgress(90);

    if (data) {
      const { data: publicUrlData } = supabase.storage
        .from('images')
        .getPublicUrl(data.path);

      if (onProgress) onProgress(100);
      return { url: publicUrlData.publicUrl };
    }

    throw new Error('No storage data returned after upload');
  } catch (err: any) {
    return { url: '', error: err.message || 'Image upload failed' };
  }
}
