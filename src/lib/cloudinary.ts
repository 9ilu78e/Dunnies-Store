import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

// Upload image to Cloudinary
export const uploadImage = async (file: File, folder = 'dunnies-store'): Promise<string> => {
  try {
    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const dataURI = `data:${file.type};base64,${base64}`;

    const result = await cloudinary.uploader.upload(dataURI, {
      folder,
      resource_type: 'auto',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif'],
      transformation: [{ quality: 'auto:good', fetch_format: 'auto' }],
    });

    return result.secure_url;
  } catch (error) {
    const cloudinaryError =
      typeof error === 'object' && error !== null
        ? (error as {
            message?: unknown;
            error?: { message?: unknown; http_code?: unknown };
            http_code?: unknown;
          })
        : undefined;
    const message =
      error instanceof Error
        ? error.message
        : typeof cloudinaryError?.error?.message === 'string'
          ? cloudinaryError.error.message
          : typeof cloudinaryError?.message === 'string'
            ? cloudinaryError.message
            : 'Unknown Cloudinary upload error';
    const statusCode =
      typeof cloudinaryError?.http_code === 'number'
        ? cloudinaryError.http_code
        : typeof cloudinaryError?.error?.http_code === 'number'
          ? cloudinaryError.error.http_code
          : undefined;
    console.error('[CLOUDINARY_UPLOAD]', statusCode, message);
    throw new Error(message);
  }
};

// Delete image from Cloudinary
export const deleteImage = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error: any) {
    console.error('Error deleting from Cloudinary:', error);
    throw new Error('Failed to delete image');
  }
};

// Get image info from Cloudinary
export const getImageInfo = async (publicId: string) => {
  try {
    const result = await cloudinary.api.resource(publicId);
    return result;
  } catch (error: any) {
    console.error('Error getting image info:', error);
    throw new Error('Failed to get image info');
  }
};

// Generate optimized image URL
export const getOptimizedImageUrl = (publicId: string, options = {}) => {
  const defaultOptions = {
    quality: 'auto',
    fetch_format: 'auto',
    secure: true,
  };

  const mergedOptions = { ...defaultOptions, ...options };
  return cloudinary.url(publicId, mergedOptions);
};

export default cloudinary;
