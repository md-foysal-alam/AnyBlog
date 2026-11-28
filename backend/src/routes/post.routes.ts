import { Router } from "express";
import PostController from "../controllers/post/post.controller.ts";
import CommentController from "../controllers/comment/comment.controller.ts";
import AuthVerifySession from "../controllers/auth/verifySession.ts";

const router = Router();

// --- PUBLIC ROUTES ---
router.get("/", PostController.getFeed);
router.get("/:id", PostController.getPost);
router.get("/:id/comments", CommentController.getComments);

// --- PROTECTED ROUTES (Requires Login) ---
router.post("/", AuthVerifySession.AuthVerifySession, PostController.createPost); // Write a new post
router.post("/:id/comments", AuthVerifySession.AuthVerifySession, CommentController.createComment); // Add a comment

export default router;