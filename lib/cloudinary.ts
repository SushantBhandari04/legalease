import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Check if Cloudinary is properly configured
export function isCloudinaryConfigured(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

export default cloudinary;

// Helper function to upload file to Cloudinary
export async function uploadToCloudinary(
  file: Buffer,
  fileName: string,
  folder: string = 'legal-ease/documents'
): Promise<{ url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    // Determine resource type based on file extension
    const fileExtension = fileName.split('.').pop()?.toLowerCase();
    let resourceType: 'auto' | 'raw' | 'image' | 'video' = 'auto';
    
    // For PDFs, use 'raw' resource type for proper handling
    if (fileExtension === 'pdf') {
      resourceType = 'raw';
    }

    cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        public_id: fileName.replace(/\.[^/.]+$/, ''), // Remove file extension for public_id
        overwrite: false, // Don't overwrite existing files
        unique_filename: true, // Add unique suffix if file exists
        // Make files publicly accessible
        access_mode: 'public',
        // For PDFs, ensure they're downloadable
        ...(resourceType === 'raw' && fileExtension === 'pdf' && {
          flags: 'attachment'
        })
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else if (result) {
          console.log('Cloudinary upload success:', {
            public_id: result.public_id,
            url: result.secure_url,
            resource_type: result.resource_type
          });
          resolve({
            url: result.secure_url,
            public_id: result.public_id,
          });
        } else {
          reject(new Error('Upload failed - no result returned'));
        }
      }
    ).end(file);
  });
}

// Helper function to delete file from Cloudinary
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

// Helper function to get file info from Cloudinary
export async function getCloudinaryFileInfo(publicId: string) {
  return new Promise((resolve, reject) => {
    cloudinary.api.resource(publicId, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
}

// Helper function to generate a signed URL for downloading
export function generateSignedDownloadUrl(publicId: string, resourceType: string = 'image'): string {
  const timestamp = Math.floor(Date.now() / 1000) + 3600; // Expires in 1 hour
  
  return cloudinary.url(publicId, {
    resource_type: resourceType,
    flags: 'attachment',
    sign_url: true,
    expires_at: timestamp,
    secure: true,
    type: 'upload'
  });
}

// Alternative approach: Use Cloudinary's API to get the file directly
export async function getCloudinaryFileBuffer(publicId: string, resourceType: string = 'raw'): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    cloudinary.api.resource(publicId, {
      resource_type: resourceType,
      type: 'upload'
    }, async (error, result) => {
      if (error) {
        console.error('Cloudinary API error:', error);
        reject(error);
      } else {
        try {
          console.log('Cloudinary API result:', {
            public_id: result.public_id,
            secure_url: result.secure_url,
            format: result.format,
            bytes: result.bytes
          });
          
          // Generate a public URL with attachment flag for download
          const downloadUrl = cloudinary.url(publicId, {
            resource_type: resourceType,
            flags: 'attachment',
            secure: true,
            type: 'upload'
          });
          
          console.log('Generated download URL:', downloadUrl);
          
          // Fetch the file using the download URL
          const response = await fetch(downloadUrl, {
            headers: {
              'User-Agent': 'LegalEase-App/1.0'
            }
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          
          console.log('File fetched successfully:', {
            originalSize: result.bytes,
            fetchedSize: buffer.length
          });
          
          resolve(buffer);
        } catch (fetchError) {
          console.error('Fetch error:', fetchError);
          reject(fetchError);
        }
      }
    });
  });
}
