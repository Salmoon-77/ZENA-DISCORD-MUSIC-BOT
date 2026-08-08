import mongoose from "mongoose";

const premiumGuildSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },

  premiumUntil: { type: Date, default: null },
  voteUntil: { type: Date, default: null },

  premiumReason: { type: String, default: null }, // ✅ 지급 사유 추가

  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("PremiumGuild", premiumGuildSchema);