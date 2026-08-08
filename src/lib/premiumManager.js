import PremiumGuild from "../models/PremiumGuild.js";

export async function getGuildPremium(guildId) {
  let data = await PremiumGuild.findOne({ guildId });
  if (!data) {
    data = await PremiumGuild.create({ guildId });
  }
  return data;
}

export async function isPremium(guildId) {
  const data = await getGuildPremium(guildId);
  return data.premiumUntil && data.premiumUntil > new Date();
}

export async function isVoteActive(guildId) {
  const data = await getGuildPremium(guildId);
  return data.voteUntil && data.voteUntil > new Date();
}

export async function getMaxQueueSize(guildId) {
  if (await isPremium(guildId)) return 100;
  if (await isVoteActive(guildId)) return 15;
  return 5;
}

export async function grantPremium(guildId, months) {
  const data = await getGuildPremium(guildId);

  const now = new Date();
  const base = data.premiumUntil && data.premiumUntil > now
    ? data.premiumUntil
    : now;

  base.setMonth(base.getMonth() + months);

  data.premiumUntil = base;
  await data.save();
}

export async function activateVote(guildId, hours = 12) {
  const data = await getGuildPremium(guildId);
  const now = new Date();
  now.setHours(now.getHours() + hours);
  data.voteUntil = now;
  await data.save();
}
