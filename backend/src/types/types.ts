export type SignupInput = {
    email        : string;
    username     : string;
    password     : string;
    displayName? : string | null;
};

export type LoginInput = {
    identifier : string;         // email OR username
    password   : string;
};

export type VerifyLoginOtpInput = {
    identifier : string;
    otp        : string;
    userAgent? : string | null;
    ipAddress? : string | null;
};

export type ForgotPasswordOtpInput = {
    email        : string;
    otp?         : string;
    newPassword? : string;
};

export type UpdateProfileInput = {
    displayName?: string;
    bio?: string;
    avatarUrl?: string;
    websiteUrl?: string;
    twitterUrl?: string;
    githubUrl?: string;
    linkedinUrl?: string;
};

export type CreatePostInput = {
    title    : string;
    content  : string;
    status   : "draft" | "published";
    imageUrl?: string | null;
};

export type CreateCommentInput = {
    content  : string;
    parentId?: string | null;
};