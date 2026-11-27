import { eq, desc } from "drizzle-orm";
import appError from "../../utils/appError.ts";
import { db } from "../../db/db.ts";
import { posts, media } from "../../models/schema.ts";
import type { CreatePostInput } from "../../types/types.ts";

class PostService {

    public async createPost(authorId: string, input: CreatePostInput) {
        const title   = String(input.title ?? "").trim();
        const content = String(input.content ?? "").trim();
        const status  = input.status === "published" ? "published" : "draft";

        if (!title || !content)
            throw new appError("title and content are required.", 400);

        const now = new Date();
        const publishedAt = status === "published" ? now : null;

        return await db.transaction(async (tx) => {
            const [post] = await tx
                .insert(posts)
                .values({ authorId, title, content, status, publishedAt, createdAt: now, updatedAt: now })
                .returning();

            if (input.imageUrl) {
                await tx.insert(media).values({
                    postId: post.id,
                    type: "photo",
                    url: input.imageUrl,
                });
            }

            return post;
        });
    }

    public async getFeed() {
        // Using Drizzle relational query to automatically fetch media and author
        const feed = await db.query.posts.findMany({
            where: eq(posts.status, "published"),
            orderBy: [desc(posts.publishedAt), desc(posts.createdAt)],
            with: {
                author: {
                    columns: { id: true, username: true, displayName: true, avatarUrl: true }
                },
                media: true
            }
        });
        return feed;
    }

    public async getPostById(postId: string) {
        const post = await db.query.posts.findFirst({
            where: eq(posts.id, postId),
            with: {
                author: {
                    columns: { id: true, username: true, displayName: true, avatarUrl: true }
                },
                media: true
            }
        });

        if (!post) throw new appError("Post not found.", 404);
        return post;
    }
}

export default new PostService();