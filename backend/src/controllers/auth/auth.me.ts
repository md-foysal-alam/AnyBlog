// import { eq, sql } from "drizzle-orm";

// import appError from "../../utils/appError.ts";

// import { db } from "../../db/db.ts";
// import { accounts, posts } from "../../models/schema.ts";

// class AuthMe {

//     public async AuthMe(accountId: string) {

//         if (!accountId)
//         throw new appError("Unauthorized.", 401);

//         const [account] = await db
//             .select({
//                 id            : accounts.id,
//                 email         : accounts.email,
//                 username      : accounts.username,
//                 displayName   : accounts.displayName,
//                 avatarUrl     : accounts.avatarUrl,
//                 bio           : accounts.bio,
//                 emailVerified : accounts.emailVerified,
//                 createdAt     : accounts.createdAt,
//             })
//             .from(accounts)
//             .where(eq(accounts.id, accountId))
//             .limit(1);

//         if (!account)
//         throw new appError("Account not found.", 404);

//         const [stats] = await db
//             .select({
//                 totalPosts     : sql<number>`count(*)::int`,
//                 publishedPosts : sql<number>`count(*) filter (where ${posts.status} = 'published')::int`,
//                 draftPosts     : sql<number>`count(*) filter (where ${posts.status} = 'draft')::int`,
//             })
//             .from(posts)
//             .where(eq(posts.authorId, account.id));

//         const userPosts = await db
//             .select({
//                 id          : posts.id,
//                 title       : posts.title,
//                 status      : posts.status,
//                 publishedAt : posts.publishedAt,
//                 createdAt   : posts.createdAt,
//             })
//             .from(posts)
//             .where(eq(posts.authorId, account.id))
//             .orderBy(posts.createdAt);

//         return {
//             account,
//             stats,
//             posts : userPosts,
//         };
//     }
// }

// export default new AuthMe();