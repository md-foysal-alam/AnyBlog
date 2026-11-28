import { Router } from "express";
import ProfileController from "../controllers/profile/profile.controller.ts";
import AuthVerifySession from "../controllers/auth/verifySession.ts";
import { upload } from "../utils/upload.ts"; 

const router = Router();

router.put("/", AuthVerifySession.AuthVerifySession, upload.single("avatar"), ProfileController.updateProfile);

export default router;