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

import { eq, sql, desc } from "drizzle-orm"; // 👈 Added 'desc'

import appError from "../../utils/appError.ts";

import { db } from "../../db/db.ts";
import { accounts, posts } from "../../models/schema.ts";

class Me {

    public async Me(accountId: string) {

        if (!accountId)
        throw new appError("Unauthorized.", 401);

        const [account] = await db
            .select({
                id            : accounts.id,
                email         : accounts.email,
                username      : accounts.username,
                displayName   : accounts.displayName,
                avatarUrl     : accounts.avatarUrl,
                bio           : accounts.bio,
                emailVerified : accounts.emailVerified,
                createdAt     : accounts.createdAt,
            })
            .from(accounts)
            .where(eq(accounts.id, accountId))
            .limit(1);

        if (!account)
        throw new appError("Account not found.", 404);

        const [stats] = await db
            .select({
                totalPosts     : sql<number>`count(*)::int`,
                publishedPosts : sql<number>`count(*) filter (where ${posts.status} = 'published')::int`,
                draftPosts     : sql<number>`count(*) filter (where ${posts.status} = 'draft')::int`,
            })
            .from(posts)
            .where(eq(posts.authorId, account.id));

        const userPosts = await db
            .select({
                id          : posts.id,
                title       : posts.title,
                status      : posts.status,
                publishedAt : posts.publishedAt,
                createdAt   : posts.createdAt,
            })
            .from(posts)
            .where(eq(posts.authorId, account.id))
            .orderBy(desc(posts.createdAt)); // 👈 Fix applied here

        return {
            account,
            stats,
            posts : userPosts,
        };
    }
}

export default new Me();