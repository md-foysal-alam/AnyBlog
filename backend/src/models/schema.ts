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

import { relations } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  timestamp,
  pgEnum,
  boolean,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ============================================
// ENUMS
// ============================================

export const mediaTypeEnum = pgEnum("media_type", ["photo", "video"]);
export const postStatusEnum = pgEnum("post_status", ["draft", "published"]);

// ============================================
// ACCOUNTS (public profile)
// ============================================

export const accounts = pgTable("accounts", {
  id:             uuid("id").defaultRandom().primaryKey(),
  email:          text("email").notNull().unique(),
  username:       text("username").notNull().unique(),
  displayName:    text("display_name"),
  avatarUrl:      text("avatar_url"),
  bio:            text("bio"),
  emailVerified:  boolean("email_verified").default(false).notNull(),
  createdAt:      timestamp("created_at").defaultNow().notNull(),
  updatedAt:      timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// CREDENTIALS (password auth)
// ============================================

export const credentials = pgTable(
  "credentials",
  {
    id:             uuid("id").defaultRandom().primaryKey(),
    accountId:      uuid("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    passwordHash:   text("password_hash").notNull(), // argon2id / bcrypt
    createdAt:      timestamp("created_at").defaultNow().notNull(),
    updatedAt:      timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("credentials_account_idx").on(table.accountId),
  ]
);

// ============================================
// SESSIONS
// ============================================

export const sessions = pgTable(
  "sessions",
  {
    id:             uuid("id").defaultRandom().primaryKey(),
    accountId:      uuid("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    tokenHash:      text("token_hash").notNull().unique(), // hash the raw token
    userAgent:      text("user_agent"),
    ipAddress:      text("ip_address"),
    expiresAt:      timestamp("expires_at").notNull(),
    createdAt:      timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("sessions_account_idx").on(table.accountId),
    index("sessions_expires_idx").on(table.expiresAt),
  ]
);

// ============================================
// EMAIL VERIFICATION TOKENS
// ============================================

export const emailVerifications = pgTable(
  "email_verifications",
  {
    id:             uuid("id").defaultRandom().primaryKey(),
    accountId:      uuid("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    tokenHash:      text("token_hash").notNull().unique(),
    expiresAt:      timestamp("expires_at").notNull(),
    usedAt:         timestamp("used_at"), // null = unused
    createdAt:      timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("email_verifications_account_idx").on(table.accountId)]
);

// ============================================
// PASSWORD RESET TOKENS
// ============================================

export const passwordResets = pgTable(
  "password_resets",
  {
    id:             uuid("id").defaultRandom().primaryKey(),
    accountId:      uuid("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    tokenHash:      text("token_hash").notNull().unique(),
    expiresAt:      timestamp("expires_at").notNull(),
    usedAt:         timestamp("used_at"),
    createdAt:      timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("password_resets_account_idx").on(table.accountId)]
);

// ============================================
// POSTS
// ============================================

export const posts = pgTable(
  "posts",
  {
    id:             uuid("id").defaultRandom().primaryKey(),
    authorId:       uuid("author_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    title:          text("title").notNull(),
    content:        text("content").notNull(),
    status:         postStatusEnum("status").default("draft").notNull(),
    publishedAt:    timestamp("published_at"),
    createdAt:      timestamp("created_at").defaultNow().notNull(),
    updatedAt:      timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("posts_author_idx").on(table.authorId),
    index("posts_status_idx").on(table.status),
  ]
);

// ============================================
// MEDIA
// ============================================

export const media = pgTable(
  "media",
  {
    id:             uuid("id").defaultRandom().primaryKey(),
    postId:         uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    type:           mediaTypeEnum("type").notNull(),
    url:            text("url").notNull(),
    altText:        text("alt_text"),
    createdAt:      timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("media_post_idx").on(table.postId)]
);

// ============================================
// COMMENTS & REPLIES
// ============================================

export const comments = pgTable(
  "comments",
  {
    id:             uuid("id").defaultRandom().primaryKey(),
    postId:         uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    authorId:       uuid("author_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    parentId:       uuid("parent_id").references((): any => comments.id, {
      onDelete: "cascade",
    }),
    content:        text("content").notNull(),
    createdAt:      timestamp("created_at").defaultNow().notNull(),
    updatedAt:      timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("comments_post_idx").on(table.postId),
    index("comments_parent_idx").on(table.parentId),
  ]
);

// ============================================
// RELATIONS
// ============================================

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  credential:     one(credentials, {
    fields:       [accounts.id],
    references:   [credentials.accountId],
  }),
  sessions:   many(sessions),
  posts:      many(posts),
  comments:   many(comments),
}));

export const credentialsRelations = relations(credentials, ({ one }) => ({
  account:     one(accounts, {
    fields:     [credentials.accountId],
    references: [accounts.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  account:     one(accounts, {
    fields:     [sessions.accountId],
    references: [accounts.id],
  }),
}));

export const emailVerificationsRelations = relations(
  emailVerifications,
  ({ one }) => ({
    account:     one(accounts, {
      fields:     [emailVerifications.accountId],
      references: [accounts.id],
    }),
  })
);

export const passwordResetsRelations = relations(passwordResets, ({ one }) => ({
  account:       one(accounts, {
    fields:       [passwordResets.accountId],
    references:   [accounts.id],
  }),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author:        one(accounts, {
    fields:       [posts.authorId],
    references:   [accounts.id],
  }),
  media: many(media),
  comments: many(comments),
}));

export const mediaRelations = relations(media, ({ one }) => ({
  post:         one(posts, {
    fields:      [media.postId],
    references:  [posts.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  post:         one(posts, {
    fields:       [comments.postId],
    references:   [posts.id],
  }),
  author:       one(accounts, {
    fields:      [comments.authorId],
    references:  [accounts.id],
  }),
  parent:       one(comments, {
    fields:       [comments.parentId],
    references:   [comments.id],
    relationName: "comment_replies",
  }),
  replies: many(comments, { relationName: "comment_replies" }),
}));