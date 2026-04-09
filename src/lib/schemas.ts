import { z } from "zod";

// topics
export const createTopicSchema = z.object({
  section: z.enum(["rc", "lr", "math"]),
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  displayOrder: z.number().int().default(0),
  cheatsheet: z.string().optional(),
  dependencyIds: z.array(z.string().uuid()).default([]),
  status: z.enum(["draft", "published"]).default("draft"),
});

export const updateTopicSchema = createTopicSchema.partial();

// pattern types
export const createPatternTypeSchema = z.object({
  topicId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  displayOrder: z.number().int().default(0),
});

export const updatePatternTypeSchema = createPatternTypeSchema.omit({ topicId: true }).partial();

// resources
export const createResourceSchema = z.object({
  topicId: z.string().uuid(),
  type: z.enum(["video", "pdf", "article"]).default("video"),
  title: z.string().min(1).max(200),
  url: z.string().url(),
  language: z.enum(["en", "hi"]).default("en"),
  displayOrder: z.number().int().default(0),
});

export const updateResourceSchema = createResourceSchema.omit({ topicId: true }).partial();

// questions
export const createQuestionSchema = z.object({
  topicId: z.string().uuid(),
  patternTypeId: z.string().uuid().optional(),
  subtopic: z.string().optional(),
  difficulty: z.enum(["l1", "l2", "l3"]),
  questionText: z.string().min(1),
  imageUrl: z.string().url().optional(),
  optionA: z.string().min(1),
  optionB: z.string().min(1),
  optionC: z.string().min(1),
  optionD: z.string().min(1),
  correctOption: z.enum(["a", "b", "c", "d"]),
  smartSolution: z.string().min(1),
  detailedSolution: z.string().optional(),
  optionAExplanation: z.string().optional(),
  optionBExplanation: z.string().optional(),
  optionCExplanation: z.string().optional(),
  optionDExplanation: z.string().optional(),
  sourceType: z.enum(["pyq", "cat", "ai", "custom"]).default("custom"),
  sourceYear: z.number().int().optional(),
  language: z.enum(["en", "hi"]).default("en"),
});

export const updateQuestionSchema = createQuestionSchema.partial();

// formula cards
export const createFormulaCardSchema = z.object({
  topicId: z.string().uuid(),
  content: z.string().min(1),
  displayOrder: z.number().int().default(0),
});

export const updateFormulaCardSchema = createFormulaCardSchema.omit({ topicId: true }).partial();
