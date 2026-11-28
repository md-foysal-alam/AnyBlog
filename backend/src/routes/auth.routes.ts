import { Router } from "express";

import Signup          from "../controllers/auth/signup.ts";
import Signin          from "../controllers/auth/signin.ts";
import Logout          from "../controllers/auth/logout.ts";
import VerifyEmail     from "../controllers/auth/verifyEmail.ts";
import ForgotPassword  from "../controllers/auth/forgotpass.ts";
import VerifySession   from "../controllers/auth/verifySession.ts";

import Me from "../controllers/auth/me.ts"

const router = Router();

// Public
router.post("/signup",         Signup.Signup);
router.post("/signin",         Signin.Signin);
router.post("/signin/verify",  Signin.VerifySigninOtp);
router.post("/logout",         Logout.Logout);
router.get ("/verify-email",   VerifyEmail.VerifyEmail);
router.post("/verify-email",   VerifyEmail.VerifyEmail);
router.post("/forgot-password",ForgotPassword.ForgotPassword);

// Protected
// 👈 Corrected the route to use the 'Me' controller
router.get ("/me", VerifySession, Me.Me);

export default router;