import { eq } from "drizzle-orm";
import appError from "../../utils/appError.ts";
import { db } from "../../db/db.ts";
import { accounts } from "../../models/schema.ts";
import type { UpdateProfileInput } from "../../types/types.ts";

class ProfileService {
    public async updateProfile(accountId: string, input: UpdateProfileInput) {
        const now = new Date();
        
        const [updated] = await db
            .update(accounts)
            .set({
                displayName: input.displayName?.trim(),
                bio: input.bio?.trim(),
                avatarUrl: input.avatarUrl,
                websiteUrl: input.websiteUrl?.trim(),
                twitterUrl: input.twitterUrl?.trim(),
                githubUrl: input.githubUrl?.trim(),
                linkedinUrl: input.linkedinUrl?.trim(),
                updatedAt: now,
            })
            .where(eq(accounts.id, accountId))
            .returning();

        if (!updated) throw new appError("Profile not found.", 404);

        return updated;
    }
}
export default new ProfileService();