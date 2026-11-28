import { Router } from "express";
import PostController from "../controllers/post/post.controller.ts";
import CommentController from "../controllers/comment/comment.controller.ts";
import VerifySession, { optionalSession } from "../controllers/auth/verifySession.ts";

const router = Router();

// --- PUBLIC (soft auth — sets req.account if a valid token is present) ---
router.get("/",              optionalSession, PostController.getFeed);
router.get("/:id",           optionalSession, PostController.getPost);
router.get("/:id/comments",  CommentController.getComments);

// --- PROTECTED ---
router.post("/",             VerifySession, PostController.createPost);
router.post("/:id/comments", VerifySession, CommentController.createComment);
router.post("/:id/react",    VerifySession, PostController.toggleReaction);  

export default router;