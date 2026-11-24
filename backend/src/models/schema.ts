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

import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id:            serial('id').primaryKey(),
  first_name:    varchar('first_name', { length: 100 }).notNull(),
  last_name:     varchar('last_name', { length: 100 }),
  email:         varchar('email', { length: 255 }).notNull().unique(),
  password_hash: varchar('password_hash', { length: 255 }).notNull(),
  avatar_url:    text('avatar_url'),
  bio:           text('bio'),
  created_at:    timestamp('created_at').defaultNow().notNull(),
});

export const posts = pgTable('posts', {
  id:           serial('id').primaryKey(),
  user_id:      integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  subject:      varchar('subject', { length: 255 }),
  content:      text('content'),
  image_url:    text('image_url'),
  created_at:   timestamp('created_at').defaultNow().notNull(),
  updated_at:   timestamp('updated_at').defaultNow().notNull(),
});

export const comments = pgTable('comments', {
  id:           serial('id').primaryKey(),
  post_id:      integer('post_id')
    .notNull()
    .references(() => posts.id, { onDelete: 'cascade' }),
  user_id:      integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  content:      text('content').notNull(),
  created_at:   timestamp('created_at').defaultNow().notNull(),
});

export const likes = pgTable(
  'likes',
  {
    id:           serial('id').primaryKey(),
    post_id:      integer('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    user_id:      integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
      content:    text('content').notNull(),
    created_at:   timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('likes_post_id_user_id_idx').on(table.post_id, table.user_id),
  ]
);