import type { Request, Response } from "express";
import asyncHandler from "../../utils/asyncHandler.ts";
import CommentService from "./comment.service.ts";
import appError from "../../utils/appError.ts";

class CommentController {

    public createComment = asyncHandler(async (req: Request, res: Response) => {
        const accountId = (req as any).account?.id;
        const postId    = String(req.params.id);
        const { content, parentId } = req.body;

        if (!accountId) throw new appError("Unauthorized", 401);

        const comment = await CommentService.createComment(postId, accountId, { content, parentId });

        return res.status(201).json({
            success : true,
            message : "Comment added successfully",
            data    : comment,
        });
    });

    public getComments = asyncHandler(async (req: Request, res: Response) => {
        const postId = String(req.params.id);
        const comments = await CommentService.getCommentsForPost(postId);

        return res.status(200).json({
            success : true,
            message : "Comments loaded",
            data    : comments,
        });
    });
}

export default new CommentController();