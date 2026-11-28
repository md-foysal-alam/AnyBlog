import { Router } from "express";
import ProfileController from "../controllers/profile/profile.controller.ts";
import VerifySession from "../controllers/auth/verifySession.ts";
import { upload } from "../utils/upload.ts"; 

const router = Router();

router.put("/", VerifySession, upload.single("avatar"), ProfileController.updateProfile);

export default router;