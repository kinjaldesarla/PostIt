import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME as string,
  api_key: process.env.CLOUDINARY_API_KEY as string,
  api_secret: process.env.CLOUDINARY_API_SECRET as string,
});

const uploadOnCloudinary = async (
  localFilePath: string
): Promise<UploadApiResponse | null> => {
  try {
    if (!localFilePath) return null;

    const response: UploadApiResponse = await cloudinary.uploader.upload(
      localFilePath,
      {
        resource_type: 'auto',
      }
    );

    console.log("File is uploaded on Cloudinary:", response.url);

    fs.unlinkSync(localFilePath); 

    return response;
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);

    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath); 
    }

    return null;
  }
};

const deleteImageOnCloudinary = async (oldPublicId: string): Promise<void> => {
  if (!oldPublicId) return;
  try {
    const result: UploadApiResponse | UploadApiErrorResponse =
      await cloudinary.uploader.destroy(oldPublicId, {
        resource_type: 'image',
      });

    console.log("Cloudinary deletion result:", result);
    console.log("File deleted from Cloudinary");
  } catch (error) {
    console.error("Error while deleting file from Cloudinary:", error);
  }
};


export { uploadOnCloudinary, deleteImageOnCloudinary };
