import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import PremiumGuild from "../models/PremiumGuild.js";
import { checkVote } from "../lib/checkVote.js";

export const data = new SlashCommandBuilder()
  .setName("서버상태")
  .setDescription("현재 서버의 프리미엄 및 투표 상태를 확인합니다.");

export async function execute(interaction) {
  const guildId = interaction.guild.id;
  const userId = interaction.user.id;
  const now = new Date();

  await interaction.deferReply();

  // 🔹 프리미엄 조회
  const guildData = await PremiumGuild.findOne({ guildId });

  let premiumActive = false;
  let premiumUntil = null;
  let premiumReason = null;

  if (
    guildData &&
    guildData.premiumUntil &&
    guildData.premiumUntil > now
  ) {
    premiumActive = true;
    premiumUntil = guildData.premiumUntil;
    premiumReason = guildData.premiumReason ?? "사유 없음";
  }

  // 🔹 투표 확인 (한디리)
  const voted = await checkVote(userId);

  // 🔹 상태 결정
  let statusText = "🟢 기본 상태 (10곡 제한)";

  if (premiumActive) {
    statusText = "💎 프리미엄 적용중";
  } else if (voted) {
    statusText = "🗳️ 한디리 투표 보상 활성화";
  }

  // 🔹 Embed 생성
  const embed = new EmbedBuilder()
    .setTitle("📊 서버 상태 조회")
    .addFields(
      {
        name: "현재 상태",
        value: statusText,
        inline: false,
      },
      {
        name: "한디리 투표 보상",
        value: voted ? "✅ 활성화됨 (20곡 제한)" : "❌ 비활성화",
        inline: true,
      },
      {
        name: "프리미엄",
        value: premiumActive ? "✅ 적용중" : "❌ 없음",
        inline: true,
      }
    )
    .setColor(premiumActive ? 0xf1c40f : voted ? 0x3498db : 0x2ecc71)
    .setTimestamp();

  if (premiumActive) {
    embed.addFields(
      {
        name: "만료일",
        value: `<t:${Math.floor(premiumUntil.getTime() / 1000)}:F>`,
        inline: false,
      },
      {
        name: "지급 사유",
        value: premiumReason,
        inline: false,
      }
    );
  }

  return interaction.editReply({ embeds: [embed] });
}