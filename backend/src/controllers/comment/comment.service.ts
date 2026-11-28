import { eq, asc } from "drizzle-orm";
import appError from "../../utils/appError.ts";
import { db } from "../../db/db.ts";
import { comments, accounts, posts } from "../../models/schema.ts";
import type { CreateCommentInput } from "../../types/types.ts";

class CommentService {

    public async createComment(postId: string, authorId: string, input: CreateCommentInput) {
        const content = String(input.content ?? "").trim();
        if (!content) throw new appError("Comment content is required.", 400);

        // Verify post exists
        const [post] = await db
            .select({ id: posts.id })
            .from(posts)
            .where(eq(posts.id, postId))
            .limit(1);
        if (!post) throw new appError("Post not found.", 404);

        // If replying, verify parent exists and belongs to same post
        if (input.parentId) {
            const [parent] = await db
                .select({ id: comments.id, postId: comments.postId })
                .from(comments)
                .where(eq(comments.id, input.parentId))
                .limit(1);
            if (!parent) throw new appError("Parent comment not found.", 404);
            if (parent.postId !== postId)
                throw new appError("Parent comment belongs to a different post.", 400);
        }

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

        // Attach author so the frontend can render it immediately
        const [author] = await db
            .select({
                id          : accounts.id,
                username    : accounts.username,
                displayName : accounts.displayName,
                avatarUrl   : accounts.avatarUrl,
            })
            .from(accounts)
            .where(eq(accounts.id, authorId))
            .limit(1);

        return { ...comment, author, replies: [] };
    }

    public async getCommentsForPost(postId: string) {
        // Fetch flat list — includes parentId so we can build the tree
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
                },
            })
            .from(comments)
            .innerJoin(accounts, eq(comments.authorId, accounts.id))
            .where(eq(comments.postId, postId))
            .orderBy(asc(comments.createdAt));

        // Build tree
        const map: Record<string, any> = {};
        const roots: any[] = [];

        for (const c of flatComments) {
            map[c.id] = { ...c, replies: [] };
        }

        for (const c of flatComments) {
            const node = map[c.id];
            if (c.parentId && map[c.parentId]) {
                map[c.parentId].replies.push(node);
            } else {
                // No parent, or parent missing (data drift) → treat as root
                roots.push(node);
            }
        }

        return roots;
    }
}

export default new CommentService();