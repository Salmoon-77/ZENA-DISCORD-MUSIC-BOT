// src/music/setVolume.js
import { musicManager } from "./manager.js";
import { saveVolume } from "../db/volumeStore.js";

/**
 * 안전한 볼륨 조절
 * - 유저 기준: 1 ~ 10
 * - 실제 출력: 0.1 ~ 1.0 (증폭 없음)
 */
export async function setGuildVolume(guildId, volume) {
  const queue = musicManager.get(guildId);
  if (!queue) return false;

  const v = Math.max(1, Math.min(10, Number(volume)));
  const volumeFloat = v / 10; // 0.1 ~ 1.0

  queue.volume = v;

  const p = queue.player;
  if (p && typeof p.setFilters === "function") {
    await p.setFilters({ volume: volumeFloat });
  }

  await saveVolume(guildId, v);
  return true;
}
