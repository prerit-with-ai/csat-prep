import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  uuid,
} from "drizzle-orm/pg-core";

// ============================================
// BetterAuth core tables
// ============================================

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: text("role").notNull().default("student"),
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  impersonatedBy: text("impersonated_by"),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================
// Content tables (Slice 1)
// ============================================

export const topics = pgTable("topics", {
  id: uuid("id").primaryKey().defaultRandom(),
  section: text("section").notNull(), // 'rc' | 'lr' | 'math'
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  displayOrder: integer("display_order").notNull().default(0),
  cheatsheet: text("cheatsheet"), // markdown
  dependencyIds: text("dependency_ids").array().default([]),
  status: text("status").notNull().default("draft"), // 'draft' | 'published'
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const patternTypes = pgTable("pattern_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  topicId: uuid("topic_id")
    .notNull()
    .references(() => topics.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const resources = pgTable("resources", {
  id: uuid("id").primaryKey().defaultRandom(),
  topicId: uuid("topic_id")
    .notNull()
    .references(() => topics.id, { onDelete: "cascade" }),
  type: text("type").notNull().default("video"), // 'video' | 'pdf' | 'article'
  title: text("title").notNull(),
  url: text("url").notNull(),
  language: text("language").notNull().default("en"), // 'en' | 'hi'
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const questions = pgTable("questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  topicId: uuid("topic_id")
    .notNull()
    .references(() => topics.id),
  patternTypeId: uuid("pattern_type_id").references(() => patternTypes.id),
  subtopic: text("subtopic"),
  difficulty: text("difficulty").notNull(), // 'l1' | 'l2' | 'l3'
  questionText: text("question_text").notNull(),
  imageUrl: text("image_url"),
  optionA: text("option_a").notNull(),
  optionB: text("option_b").notNull(),
  optionC: text("option_c").notNull(),
  optionD: text("option_d").notNull(),
  correctOption: text("correct_option").notNull(), // 'a' | 'b' | 'c' | 'd'
  smartSolution: text("smart_solution").notNull(),
  detailedSolution: text("detailed_solution"),
  optionAExplanation: text("option_a_explanation"),
  optionBExplanation: text("option_b_explanation"),
  optionCExplanation: text("option_c_explanation"),
  optionDExplanation: text("option_d_explanation"),
  sourceType: text("source_type").notNull().default("custom"), // 'pyq' | 'cat' | 'ai' | 'custom'
  sourceYear: integer("source_year"),
  language: text("language").notNull().default("en"),
  isArchived: boolean("is_archived").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const topicProgress = pgTable("topic_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  topicId: uuid("topic_id")
    .notNull()
    .references(() => topics.id, { onDelete: "cascade" }),
  currentLevel: text("current_level").notNull().default("l1"), // 'l1' | 'l2' | 'l3'
  l1Attempts: integer("l1_attempts").notNull().default(0),
  l1Correct: integer("l1_correct").notNull().default(0),
  l2Attempts: integer("l2_attempts").notNull().default(0),
  l2Correct: integer("l2_correct").notNull().default(0),
  l3Attempts: integer("l3_attempts").notNull().default(0),
  l3Correct: integer("l3_correct").notNull().default(0),
  status: text("status").notNull().default("red"), // 'red' | 'amber' | 'green'
  needsHelp: boolean("needs_help").notNull().default(false),
  adminNotes: text("admin_notes"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const formulaCards = pgTable("formula_cards", {
  id: uuid("id").primaryKey().defaultRandom(),
  topicId: uuid("topic_id")
    .notNull()
    .references(() => topics.id, { onDelete: "cascade" }),
  content: text("content").notNull(), // markdown + KaTeX
  displayOrder: integer("display_order").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
