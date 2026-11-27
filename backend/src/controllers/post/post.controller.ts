import type { Request, Response } from "express";
import asyncHandler from "../../utils/asyncHandler.ts";
import PostService from "./post.service.ts";
import appError from "../../utils/appError.ts";

class PostController {

    public createPost = asyncHandler(async (req: Request, res: Response) => {
        const accountId = (req as any).account?.id;
        const { title, content, status, imageUrl } = req.body;

        if (!accountId) throw new appError("Unauthorized", 401);

        const post = await PostService.createPost(accountId, { 
            title, 
            content, 
            status, 
            imageUrl 
        });

        return res.status(201).json({
            success : true,
            message : "Post created successfully",
            data    : post,
        });
    });

    public getFeed = asyncHandler(async (_req: Request, res: Response) => {
        const feed = await PostService.getFeed();
        return res.status(200).json({
            success : true,
            message : "Feed loaded",
            data    : feed,
        });
    });

    public getPost = asyncHandler(async (req: Request, res: Response) => {
        const postId = String(req.params.id); 
        const post = await PostService.getPostById(postId);
        return res.status(200).json({
            success : true,
            message : "Post loaded",
            data    : post,
        });
    });
}

export default new PostController();