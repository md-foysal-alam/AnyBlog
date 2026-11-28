import type { Request, Response } from "express";
import asyncHandler from "../../utils/asyncHandler.ts";
import PostService from "./post.service.ts";
import appError from "../../utils/appError.ts";

class PostController {

    public getFeed = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).account?.id as string | undefined;
        const feed   = await PostService.getFeed(userId);

        return res.status(200).json({
            success : true,
            message : "Feed loaded",
            data    : feed,
        });
    });

    public getPost = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).account?.id as string | undefined;
        const postId = String(req.params.id);
        const post   = await PostService.getPostById(postId, userId);

        return res.status(200).json({
            success : true,
            message : "Post loaded",
            data    : post,
        });
    });

    public createPost = asyncHandler(async (req: Request, res: Response) => {
        const authorId = (req as any).account?.id;
        if (!authorId) throw new appError("Unauthorized", 401);

        const post = await PostService.createPost(authorId, req.body);

        return res.status(201).json({
            success : true,
            message : "Post created",
            data    : post,
        });
    });

    // 👇 NEW
    public toggleReaction = asyncHandler(async (req: Request, res: Response) => {
        const accountId = (req as any).account?.id;
        if (!accountId) throw new appError("Unauthorized", 401);

        const postId = String(req.params.id);
        const result = await PostService.toggleReaction(postId, accountId);

        return res.status(200).json({
            success : true,
            message : result.liked ? "Reacted" : "Reaction removed",
            data    : result,   // { liked: boolean, likeCount: number }
        });
    });
}

export default new PostController();