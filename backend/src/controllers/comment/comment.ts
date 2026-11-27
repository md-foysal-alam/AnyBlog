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

        // Verify post exists first
        const [post] = await db.select({ id: posts.id }).from(posts).where(eq(posts.id, postId)).limit(1);
        if (!post)
        throw new appError("Post not found.", 404);

        const now = new Date();
        const [comment] = await db
            .insert(comments)
            .values({
                postId,
                authorId,
                content,
                parentId: input.parentId || null,
                createdAt: now,
                updatedAt: now,
            })
            .returning();

        return comment;
    }

    public async getCommentsForPost(postId: string) {
        const result = await db
            .select({
                id        : comments.id,
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

        return result;
    }
}

export default new CommentService();