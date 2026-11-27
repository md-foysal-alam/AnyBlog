import type { Request, Response } from "express";
import asyncHandler from "../../utils/asyncHandler.ts";
import { uploadToCloudinary } from "../../utils/cloudinary.ts";
import appError from "../../utils/appError.ts";

class UploadController {
    // 👇 We explicitly type req to include the file property from Multer
    public uploadImage = asyncHandler(async (req: Request & { file?: any }, res: Response) => {
        if (!req.file) {
            throw new appError("No image provided.", 400);
        }

        if (!req.file.buffer) {
            throw new appError("File buffer is missing.", 400);
        }

        // Upload the memory buffer directly to Cloudinary
        const imageUrl = await uploadToCloudinary(req.file.buffer);

        return res.status(200).json({
            success: true,
            message: "Image uploaded successfully",
            data: { url: imageUrl },
        });
    });
}

export default new UploadController();