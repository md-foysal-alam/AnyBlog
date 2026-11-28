import { Router } from "express";
import { upload } from "../utils/upload.ts";
import UploadController from "../controllers/upload/upload.controller.ts";
import AuthVerifySession from "../controllers/auth/verifySession.ts";

const router = Router();

// Protected route: Only logged-in users can upload images
router.post("/", AuthVerifySession.AuthVerifySession, upload.single("image"), UploadController.uploadImage);

export default router;