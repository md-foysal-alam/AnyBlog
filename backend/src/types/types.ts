// Copyright 2026 Foysal Alam Rohan
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/* =========================================================================
 * Auth — signup
 * ========================================================================= */

export type SignupInput = {
    email        : string;
    username     : string;
    password     : string;
    displayName? : string;
};

/* =========================================================================
 * Auth — signin (email OR username + password)
 * ========================================================================= */

export type SigninInput = {
    identifier : string;   // email OR username
    password   : string;
};

// Backward-compatible alias
export type LoginInput = SigninInput;

/* =========================================================================
 * Auth — verify email
 * ========================================================================= */

export type VerifyEmailInput = {
    token : string;
};

/* =========================================================================
 * Auth — password reset (two-step, no OTP yet)
 *
 * `ForgotPasswordOtpInput` was removed — it allowed invalid states like
 * `{ email, otp }` with no new password. Split into two precise types.
 * Re-add the OTP field to `ResetPasswordInput` when OTP is implemented.
 * ========================================================================= */

export type RequestPasswordResetInput = {
    email : string;
};

export type ResetPasswordInput = {
    email       : string;
    newPassword : string;
    // otp      : string;   // 👈 add when OTP is implemented
};

/* =========================================================================
 * Profile — update
 *
 *   undefined = leave unchanged
 *   null      = clear field
 *   string    = set field
 * ========================================================================= */

export type UpdateProfileInput = {
    displayName? : string | null;
    bio?         : string | null;
    avatarUrl?   : string | null;
    websiteUrl?  : string | null;
    twitterUrl?  : string | null;
    githubUrl?   : string | null;
    linkedinUrl? : string | null;
};

/* =========================================================================
 * Posts
 * ========================================================================= */

export type CreatePostInput = {
    title    : string;
    content  : string;
    status   : "draft" | "published";
    imageUrl? : string | null;
};

export type UpdatePostInput = Partial<CreatePostInput>;

/* =========================================================================
 * Comments
 * ========================================================================= */

export type CreateCommentInput = {
    content   : string;
    parentId? : string | null;
};

/* =========================================================================
 * Express augmentation — attach verified identity to req
 * ========================================================================= */

export interface SessionAccount {
    id            : string;
    email         : string;
    username      : string;
    displayName   : string | null;
    avatarUrl     : string | null;
    bio           : string | null;
    websiteUrl    : string | null;
    twitterUrl    : string | null;
    githubUrl     : string | null;
    linkedinUrl   : string | null;
    emailVerified : boolean;
}

declare global {
    namespace Express {
        interface Request {
            account?  : SessionAccount;
            sessionId?: string;
        }
    }
}