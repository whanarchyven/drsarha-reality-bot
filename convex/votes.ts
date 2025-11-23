import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("votes")
      .withIndex("byUserId", q => q.eq("userId", userId))
      .unique(); // либо null, если ещё не голосовал
  },
});

export const set = mutation({
  args: {
    userId: v.string(),
    choice: v.string(),
  },
  handler: async (ctx, { userId, choice }) => {
    const existing = await ctx.db
      .query("votes")
      .withIndex("byUserId", q => q.eq("userId", userId))
      .unique();

    if (existing) {
      // один юзер — один ответ: обновляем/игнорируем
      await ctx.db.patch(existing._id, { choice });
      return;
    }

    await ctx.db.insert("votes", { userId, choice });
  },
});