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
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      max_file_size: 10485760, // 10MB
      quality: 'auto:good',
      fetch_format: 'auto',
    });

    return result.secure_url;
  } catch (error: any) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error('Failed to upload image');
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
