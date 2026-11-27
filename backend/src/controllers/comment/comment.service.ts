import { eq, asc } from "drizzle-orm";
import appError from "../../utils/appError.ts";
import { db } from "../../db/db.ts";
import { comments, accounts, posts } from "../../models/schema.ts";
import type { CreateCommentInput } from "../../types/types.ts";

class CommentService {

    public async createComment(postId: string, authorId: string, input: CreateCommentInput) {
        const content = String(input.content ?? "").trim();

        if (!content)
            throw new appError("Comment content is required.", 400);

        // Verify post exists
        const [post] = await db.select({ id: posts.id }).from(posts).where(eq(posts.id, postId)).limit(1);
        if (!post) throw new appError("Post not found.", 404);

        const now = new Date();
        const [comment] = await db
            .insert(comments)
            .values({
                postId,
                authorId,
                content,
                parentId: input.parentId || null, // 👈 Save the parent reply ID
                createdAt: now,
                updatedAt: now,
            })
            .returning();

        // Fetch the author info so the frontend can display the new comment instantly
        const [author] = await db.select({ id: accounts.id, username: accounts.username, displayName: accounts.displayName, avatarUrl: accounts.avatarUrl }).from(accounts).where(eq(accounts.id, authorId)).limit(1);
        
        return { ...comment, author, replies: [] };
    }

    public async getCommentsForPost(postId: string) {
        // 1. Fetch all comments for this post (flat list)
        const flatComments = await db
            .select({
                id        : comments.id,
                parentId  : comments.parentId,
                content   : comments.content,
                createdAt : comments.createdAt,
                author    : {
                    id          : accounts.id,
                    username    : accounts.username,
                    displayName : accounts.displayName,
                    avatarUrl   : accounts.avatarUrl,
                }
            })
            .from(comments)
            .innerJoin(accounts, eq(comments.authorId, accounts.id))
            .where(eq(comments.postId, postId))
            .orderBy(asc(comments.createdAt));

        // 2. Convert flat list into a nested tree
        const commentMap: Record<string, any> = {};
        const rootComments: any[] = [];

        flatComments.forEach((comment) => {
            commentMap[comment.id] = { ...comment, replies: [] };
        });

        flatComments.forEach((comment) => {
            if (comment.parentId) {
                // If it has a parent, push it into the parent's replies array
                if (commentMap[comment.parentId]) {
                    commentMap[comment.parentId].replies.push(commentMap[comment.id]);
                }
            } else {
                // If no parent, it's a root comment
                rootComments.push(commentMap[comment.id]);
            }
        });

        return rootComments;
    }
}

export default new CommentService();