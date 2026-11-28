import type { Request, Response } from "express";
import asyncHandler from "../../utils/asyncHandler.ts";
import ProfileService from "./profile.service.ts";
import appError from "../../utils/appError.ts";
import { uploadToCloudinary } from "../../utils/cloudinary.ts"; // 👈 Import Cloudinary

class ProfileController {
    public updateProfile = asyncHandler(async (req: Request & { file?: any }, res: Response) => {
        const accountId = (req as any).account?.id;
        if (!accountId) throw new appError("Unauthorized", 401);

        // If a new avatar image was uploaded, send it to Cloudinary
        let avatarUrl = req.body.avatarUrl; 
        if (req.file) {
            avatarUrl = await uploadToCloudinary(req.file.buffer);
        }

        // Save all text fields + the new Cloudinary avatar URL
        const updatedAccount = await ProfileService.updateProfile(accountId, {
            ...req.body,
            avatarUrl: avatarUrl,
        });

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: updatedAccount,
        });
    });
}
export default new ProfileController();