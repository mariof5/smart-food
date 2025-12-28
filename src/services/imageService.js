import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase/config';
import { v4 as uuidv4 } from 'uuid';

// Image upload service
export const imageService = {
  // Upload single image
  uploadImage: async (file, folder = 'general') => {
    try {
      // Validate file
      if (!file) {
        return { success: false, error: 'No file provided' };
      }

      // Check file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        return { success: false, error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' };
      }

      // Check file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        return { success: false, error: 'File size too large. Maximum size is 5MB.' };
      }

      // Generate unique filename
      const fileExtension = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExtension}`;
      const filePath = `${folder}/${fileName}`;

      // Create storage reference
      const storageRef = ref(storage, filePath);

      // Upload file
      const snapshot = await uploadBytes(storageRef, file);
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);

      return {
        success: true,
        url: downloadURL,
        path: filePath,
        fileName: fileName
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      return { success: false, error: error.message };
    }
  },

  // Upload multiple images
  uploadMultipleImages: async (files, folder = 'general') => {
    try {
      const uploadPromises = Array.from(files).map(file => 
        imageService.uploadImage(file, folder)
      );

      const results = await Promise.all(uploadPromises);
      
      const successful = results.filter(result => result.success);
      const failed = results.filter(result => !result.success);

      return {
        success: failed.length === 0,
        successful: successful,
        failed: failed,
        totalUploaded: successful.length,
        totalFailed: failed.length
      };
    } catch (error) {
      console.error('Error uploading multiple images:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete image
  deleteImage: async (imagePath) => {
    try {
      if (!imagePath) {
        return { success: false, error: 'No image path provided' };
      }

      const storageRef = ref(storage, imagePath);
      await deleteObject(storageRef);

      return { success: true };
    } catch (error) {
      console.error('Error deleting image:', error);
      return { success: false, error: error.message };
    }
  },

  // Resize image on client side before upload
  resizeImage: (file, maxWidth = 800, maxHeight = 600, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(resolve, file.type, quality);
      };

      img.src = URL.createObjectURL(file);
    });
  },

  // Generate thumbnail
  generateThumbnail: (file, size = 150) => {
    return imageService.resizeImage(file, size, size, 0.7);
  }
};

export default imageService;