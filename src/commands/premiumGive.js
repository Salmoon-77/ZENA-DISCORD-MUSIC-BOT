import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import PremiumGuild from "../models/PremiumGuild.js";

export const data = new SlashCommandBuilder()
  .setName("프리미엄지급")
  .setDescription("특정 서버에 프리미엄을 수동 지급합니다.")
  .addStringOption(option =>
    option
      .setName("서버아이디")
      .setDescription("프리미엄을 지급할 서버 ID")
      .setRequired(true)
  )
  .addIntegerOption(option =>
    option
      .setName("기간")
      .setDescription("지급할 개월 수")
      .setRequired(true)
  )
  .addStringOption(option =>
    option
      .setName("사유")
      .setDescription("프리미엄 지급 사유")
      .setRequired(false)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction) {
  if (interaction.user.id !== "835523695887384647") {
    return interaction.reply({
      content: "❌ 이 명령어는 봇 관리자만 사용할 수 있습니다.",
      ephemeral: true
    });
  }

  const guildId = interaction.options.getString("서버아이디");
  const months = interaction.options.getInteger("기간");
  const reason =
    interaction.options.getString("사유") ?? "관리자 수동 지급";

  if (months <= 0) {
    return interaction.reply({
      content: "❌ 기간은 1개월 이상이어야 합니다.",
      ephemeral: true
    });
  }

  const now = new Date();
  let guildData = await PremiumGuild.findOne({ guildId });

  if (!guildData) {
    guildData = new PremiumGuild({ guildId });
  }

  let baseDate = now;

  if (guildData.premiumUntil && guildData.premiumUntil > now) {
    baseDate = guildData.premiumUntil;
  }

  const newExpire = new Date(baseDate);
  newExpire.setMonth(newExpire.getMonth() + months);

  guildData.premiumUntil = newExpire;
  guildData.premiumReason = reason; // ✅ 사유 저장

  await guildData.save();

  return interaction.reply({
    content:
      `✅ 서버 \`${guildId}\`에 프리미엄 ${months}개월 지급 완료\n` +
      `📌 사유: ${reason}\n` +
      `🗓 만료일: <t:${Math.floor(newExpire.getTime() / 1000)}:F>`,
    ephemeral: false
  });
}