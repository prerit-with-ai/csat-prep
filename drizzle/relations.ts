import { relations } from "drizzle-orm";
import { topics, patternTypes, resources, questions, formulaCards, user, revisionQueue, patternProgress } from "./schema";

export const topicsRelations = relations(topics, ({ many }) => ({
  patternTypes: many(patternTypes),
  resources: many(resources),
  questions: many(questions),
  formulaCards: many(formulaCards),
}));

export const patternTypesRelations = relations(patternTypes, ({ one, many }) => ({
  topic: one(topics, { fields: [patternTypes.topicId], references: [topics.id] }),
  questions: many(questions),
}));

export const resourcesRelations = relations(resources, ({ one }) => ({
  topic: one(topics, { fields: [resources.topicId], references: [topics.id] }),
}));

export const questionsRelations = relations(questions, ({ one }) => ({
  topic: one(topics, { fields: [questions.topicId], references: [topics.id] }),
  patternType: one(patternTypes, { fields: [questions.patternTypeId], references: [patternTypes.id] }),
}));

export const formulaCardsRelations = relations(formulaCards, ({ one }) => ({
  topic: one(topics, { fields: [formulaCards.topicId], references: [topics.id] }),
}));

export const revisionQueueRelations = relations(revisionQueue, ({ one }) => ({
  user: one(user, { fields: [revisionQueue.userId], references: [user.id] }),
  patternType: one(patternTypes, { fields: [revisionQueue.patternTypeId], references: [patternTypes.id] }),
  originalQuestion: one(questions, { fields: [revisionQueue.originalQuestionId], references: [questions.id] }),
}));

export const patternProgressRelations = relations(patternProgress, ({ one }) => ({
  user: one(user, { fields: [patternProgress.userId], references: [user.id] }),
  patternType: one(patternTypes, { fields: [patternProgress.patternTypeId], references: [patternTypes.id] }),
}));
