import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  votes: defineTable({
    userId: v.string(),      // ID пользователя (как вы его определите в боте)
    choice: v.string(),      // выбранный участник
  }).index("byUserId", ["userId", "choice"]),
});