import {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} from "discord.js";

const OWNER_ID = "835523695887384647";

export const data = new SlashCommandBuilder()
  .setName("전체공지")
  .setDescription("모든 서버에 공지를 전송합니다.")
  .addStringOption(option =>
    option
      .setName("내용")
      .setDescription("보낼 공지 내용을 입력하세요")
      .setRequired(true)
  );

export async function execute(interaction) {
  if (!interaction.inGuild()) {
    return interaction.reply({
      content: "⚠️ 서버에서만 사용 가능합니다.",
      ephemeral: true,
    });
  }

  // 🔥 봇 소유자만 실행 가능
  if (interaction.user.id !== OWNER_ID) {
    return interaction.reply({
      content: "⛔ 이 명령어는 봇 소유자만 사용할 수 있습니다.",
      ephemeral: true,
    });
  }

  const messageContent = interaction.options.getString("내용");

  const loadingEmbed = new EmbedBuilder()
    .setColor("Yellow")
    .setTitle("📢 전체 공지 전송 시작")
    .setDescription(
      `총 서버 수: ${interaction.client.guilds.cache.size}개\n\n공지 전송중입니다...`
    )
    .setTimestamp();

  await interaction.reply({ embeds: [loadingEmbed] });

  let success = 0;
  let fail = 0;
  let skipped = 0;

  for (const guild of interaction.client.guilds.cache.values()) {
    // 🔥 특정 서버 제외
    if (guild.id === "653083797763522580") {
      skipped++;
      continue;
    }

    try {
      const channel = guild.channels.cache
        .filter(ch => ch.isTextBased() && ch.viewable)
        .find(ch =>
          ch.permissionsFor(guild.members.me)?.has([
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ViewChannel,
          ])
        );

      if (!channel) {
        fail++;
        continue;
      }

      await channel.send({
  embeds: [
    new EmbedBuilder()
      .setColor("Blue")
      .setTitle("📢 ZENA 서비스 변경 안내")
      .setDescription(
`
# 2월 후원 내역 공개

안녕하세요.
항상 Zena를 이용해주시고 응원해주시는 모든 분들께 감사드립니다.

## 📌 2월 후원 통계

* **2월 총 후원 금액**: 10,000원
* **총 지출 금액**: 17,280원 (호스팅 비용)
* **누적 후원 금액**: -7,280원

현재 운영 비용이 후원 금액을 초과한 상태이며,
부족한 금액은 운영자가 부담하여 서버를 유지하고 있습니다.

---

또한, 후원금의 일부는 **밀알복지재단**에 기부할 예정입니다.
작은 금액이지만 좋은 곳에 의미 있게 사용될 수 있도록 하겠습니다.

앞으로도 투명한 운영과 정기적인 후원 내역 공개를 통해
신뢰받는 서비스가 될 수 있도록 노력하겠습니다.

많은 관심과 응원 부탁드립니다 🙏
감사합니다.

후원 방법은 /후원 명령어를 통해 확인가능합니다. 
`
      )
      .setFooter({ text: "ZENA Music Bot" })
      .setTimestamp(),
  ],
});

      success++;

      // 🔥 700서버 안정용 딜레이
      await new Promise(res => setTimeout(res, 200));

    } catch (err) {
      fail++;
    }
  }

  const resultEmbed = new EmbedBuilder()
    .setColor("Green")
    .setTitle("✅ 전체 공지 전송 완료")
    .addFields(
      { name: "성공 서버", value: `\`${success}\`개`, inline: true },
      { name: "실패 서버", value: `\`${fail}\`개`, inline: true },
      { name: "제외 서버", value: `\`${skipped}\`개`, inline: true }
    )
    .setTimestamp();

  await interaction.editReply({ embeds: [resultEmbed] });
}