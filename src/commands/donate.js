import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("후원")
  .setDescription("후원 방법 및 프리미엄 혜택을 간략하게 안내합니다.");

export async function execute(interaction) {
  const embed = new EmbedBuilder()
    .setColor("#5865F2")
    .setTitle("💙 후원 및 프리미엄 안내")
    .setDescription("봇 운영을 위한 후원 및 프리미엄 혜택 안내입니다.")
    .addFields(
      {
        name: "💳 후원 방법",
        value:
          "[카카오페이 후원하기](https://qr.kakaopay.com/FXpicaIIO)\n" +
          "후원 후 서포트서버 **문의센터 채널**에\n예금주명 + 후원금액을 보내주세요.\n" + 
          "서포트 서버 : https://discord.gg/RfGwkc6tAE",
      },
      {
        name: "🚀 프리미엄 혜택",
        value:
          "기본 대기열 10곡\n" +
          "투표 시 12시간 동안 20곡\n\n" +
          "후원자: 5,000원당 1개월\n" +
          "대기열 120곡 + 전용 음악 서버",
      },
      {
        name: "📌 환불 정책",
        value:
          "후원 24시간 이내 요청 시\n90% 환불 가능\n(자발적 후원 특성상 기본 환불 불가)",
      }
    )
    .setFooter({ text: "후원금은 서버 유지 및 밀알복지재단 후원에 사용됩니다." });

  await interaction.reply({ embeds: [embed], ephemeral: false });
}