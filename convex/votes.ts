import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: { userId: v.string(), choice: v.string() },
  handler: async (ctx, { userId, choice }) => {
    return await ctx.db
      .query("votes")
      .withIndex("byUserId", q => q.eq("userId", userId).eq("choice", choice))
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

export const pushVote = mutation({
  args: { userId: v.string(), choice: v.string() },
  handler: async (ctx, { userId, choice }) => {
    await ctx.db.insert("votes", { userId, choice });
  },
});

export const deleteVote = mutation({
  args: { userId: v.string(), choice: v.string() },
  handler: async (ctx, { userId, choice }) => {
    await ctx.db.query("votes").withIndex("byUserId", q => q.eq("userId", userId).eq("choice", choice)).unique().then(async (vote) => {
      if (vote) {
        await ctx.db.delete(vote._id);
      }
    });
  },
});



export const getVotesByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return await ctx.db.query("votes").withIndex("byUserId", q => q.eq("userId", userId)).collect();
  },
});

export const getVotesByGroup=query({
  handler: async (ctx)=>{
    const results= await ctx.db.query('votes').collect()
    const resultVotes=new Map()
    results.map(result=>{
      const existResult=resultVotes.get(result.choice)
      if(existResult){
        resultVotes.set(result.choice,existResult+1)
      }
      else{
        resultVotes.set(result.choice,1)
      }
    })
    const result = Array.from(resultVotes, ([key, votes]) => {
      const [candidateId, ...nameParts] = key.split(' ');
      const name = nameParts.join(' ').trim();
      return {
        candidateId: candidateId.replace(/[^0-9]/g, ''), // берем только цифры для id
        name,
        votes,
      };
    });
    
    return result
    
  }
})