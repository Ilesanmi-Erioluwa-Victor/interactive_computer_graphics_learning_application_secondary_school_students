import { v2 as cloudinaryV2 } from 'cloudinary';

const configureCloudinary = () => {
  const config = {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  };

  if (config.cloud_name && config.api_key && config.api_secret) {
    cloudinaryV2.config(config);
    return cloudinaryV2;
  }

  console.warn(
    '[CLOUDINARY] Credentials not set — media uploads will fall back to local /uploads storage.'
  );
  return null;
};

export const cloudinary = configureCloudinary();
export default configureCloudinary;
