import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import {
  ensureGuildQueue,
  connectToChannel,
  resolveTracks,
  playNext,
  clearIdleNotices,
  canAddTrack,
} from "../music/manager.js";
import { getShoukaku } from "../index.js";
import { isPremium } from "../lib/premiumManager.js";
import { checkVote } from "../lib/checkVote.js";

export const data = new SlashCommandBuilder()
  .setName("재생")
  .setDescription("노래를 재생합니다.")
  .addStringOption((option) =>
    option
      .setName("제목")
      .setDescription("노래 제목, URL 또는 플레이리스트 URL")
      .setRequired(true)
  );

export async function execute(interaction) {
  const query = interaction.options.getString("제목");
  const guildId = interaction.guild.id;
  const userId = interaction.user.id;

  const queue1 = ensureGuildQueue(guildId);
  queue1.textChannelId = interaction.channel.id;

  const member = interaction.member;
  const voiceChannel =
    member?.voice?.channel ??
    (member?.voice?.channelId
      ? interaction.guild.channels.cache.get(member.voice.channelId)
      : null);

  if (!voiceChannel) {
    return interaction.reply({
      content: "⚠️ 먼저 음성 채널에 들어가주세요!",
      ephemeral: true,
    });
  }

  await interaction.deferReply();

  const shoukaku = getShoukaku();

  let node;
  if (await isPremium(guildId)) {
    node = shoukaku.nodes.get("premium");
  } else {
    node = shoukaku.nodes.get("main");
  }

  if (!node) {
    node =
      shoukaku.idleNodes?.[0] ||
      [...shoukaku.nodes.values()][0];
  }

  if (!node) {
    return interaction.editReply({
      content: "❌ 사용할 수 있는 Lavalink 노드가 없습니다.",
    });
  }

  const queue = ensureGuildQueue(guildId);

  if (!queue.player) {
    try {
      queue.player = await connectToChannel(
        guildId,
        voiceChannel.id,
        interaction.guild.shardId
      );
      queue.nodeName = node.name ?? "main";
    } catch (err) {
      console.error(err);
      return interaction.editReply({
        content: `❌ 채널 접속 실패: ${err.message}`,
      });
    }
  }

  const isUrl = /^https?:\/\//i.test(query);
  const tracks = await resolveTracks(node, query);

  if (!tracks.length) {
    return interaction.editReply({ content: "⚠️ 트랙을 찾을 수 없습니다." });
  }

  // 🔥 최대 곡 수 계산
  let maxSongs;

  if (await isPremium(guildId)) {
    const check = await canAddTrack(guildId);
    maxSongs = check.max;
  } else {
    const voted = await checkVote(userId);
    maxSongs = voted ? 20 : 10;
  }

  const currentCount =
    queue.tracks.length + (queue.current ? 1 : 0);

  // ================================
  // ✅ URL 바로 추가
  // ================================
  if (isUrl) {
    if (tracks.length > 1) {
      const available = maxSongs - currentCount;
      const addable = tracks.slice(0, available);

      if (!addable.length) {
        return interaction.editReply({
          content: `❌ 더 이상 곡을 추가할 수 없습니다. (최대 ${maxSongs}곡)`,
        });
      }

      queue.tracks.push(...addable);

      await interaction.editReply(
        `🎶 플레이리스트에서 **${addable.length}곡**을 추가했습니다. (최대 ${maxSongs}곡)`
      );
    } else {
      if (currentCount >= maxSongs) {
        return interaction.editReply({
          content: `❌ 현재 최대 ${maxSongs}곡까지만 추가 가능합니다.`,
        });
      }

      const track = tracks[0];
      queue.tracks.push(track);

      await interaction.editReply(
        `🎶 **${track.info?.title ?? "제목 없음"}** 추가됨`
      );
    }

    if (!queue.playing) await playNext(guildId).catch(console.error);
    return;
  }

  // ================================
  // ✅ 검색 결과 버튼 처리
  // ================================

  const top = tracks.slice(0, 10);

  const embed = new EmbedBuilder()
    .setTitle("🔎 검색 결과")
    .setDescription(
      top
        .map(
          (t, i) =>
            `\`\`${i + 1}\`\`  ${t.info.title} — ${t.info.author} (${Math.floor(
              t.info.length / 60000
            )}:${String(Math.floor((t.info.length % 60000) / 1000)).padStart(
              2,
              "0"
            )})`
        )
        .join("\n")
    )
    .setFooter({
      text: "아래 버튼을 눌러 원하는 곡을 선택하세요. (20초 제한)",
    });

  const rows = [];
  for (let i = 0; i < 2; i++) {
    const row = new ActionRowBuilder();
    for (let j = 1; j <= 5; j++) {
      const num = i * 5 + j;
      if (num > top.length) break;
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`choose_${num}`)
          .setLabel(num.toString())
          .setStyle(ButtonStyle.Primary)
      );
    }
    if (row.components.length) rows.push(row);
  }

  rows.push(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("cancel")
        .setLabel("취소")
        .setStyle(ButtonStyle.Danger)
    )
  );

  const msg = await interaction.editReply({
    embeds: [embed],
    components: rows,
  });

  const collector = msg.createMessageComponentCollector({
    time: 20000,
  });

  collector.on("collect", async (btn) => {
    if (btn.user.id !== userId) {
      return btn.reply({
        content: "⚠️ 명령어 실행자만 선택할 수 있습니다.",
        ephemeral: true,
      });
    }

    if (btn.customId === "cancel") {
      await btn.update({
        content: "❌ 선택이 취소되었습니다.",
        embeds: [],
        components: [],
      });
      collector.stop();
      return;
    }

    const choice = parseInt(btn.customId.split("_")[1], 10);
    const track = top[choice - 1];

    const currentCountNow =
      queue.tracks.length + (queue.current ? 1 : 0);

    if (currentCountNow >= maxSongs) {
      return btn.reply({
        content: `❌ 현재 최대 ${maxSongs}곡까지만 추가 가능합니다.`,
        ephemeral: true,
      });
    }

    queue.tracks.push(track);

    await btn.update({
      content: `🎶 선택됨: **${track.info.title ?? "제목 없음"}**`,
      embeds: [],
      components: [],
    });

    await clearIdleNotices(guildId);

    if (!queue.playing) await playNext(guildId).catch(console.error);
    collector.stop();
  });

  collector.on("end", async (_, reason) => {
    if (reason === "time") {
      await interaction.editReply({
        content: "⌛ 시간 초과! 선택이 취소되었습니다.",
        embeds: [],
        components: [],
      });
    }
  });
}
