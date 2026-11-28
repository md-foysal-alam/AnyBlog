// Copyright 2026 Foysal Alam Rohan

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { eq, desc, sql } from "drizzle-orm";
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
        const feed = await db.query.posts.findMany({
            where: eq(posts.status, "published"),
            orderBy: [desc(posts.createdAt)],
            with: {
                author: {
                    columns: { id: true, username: true, displayName: true, avatarUrl: true }
                },
                media: true
            },
            extras: {
                // Raw SQL — do NOT use ${comments.postId} here.
                // Inside `extras`, Drizzle resolves column refs against the
                // outer table (posts), which produces "posts"."post_id".
                commentCount: sql<number>`(
                    select count(*)::int
                    from "comments"
                    where "comments"."post_id" = "posts"."id"
                )`.as("comment_count"),
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
            },
            extras: {
                commentCount: sql<number>`(
                    select count(*)::int
                    from "comments"
                    where "comments"."post_id" = "posts"."id"
                )`.as("comment_count"),
            }
        });

        if (!post) throw new appError("Post not found.", 404);
        return post;
    }
}

export default new PostService();