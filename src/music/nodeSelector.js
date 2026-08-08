import { isPremium } from "../lib/premiumManager.js";
import { getShoukaku } from "../index.js";

export async function getNodeForGuild(guildId) {
  const shoukaku = getShoukaku();

  if (await isPremium(guildId)) {
    return shoukaku.getNode("premium");
  }

  return shoukaku.getNode("normal");
}
