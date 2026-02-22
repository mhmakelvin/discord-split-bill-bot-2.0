import { SlashCommandBuilder } from "@discordjs/builders";
import type { CommandInteraction } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("Check if the bot is online");

export async function execute(interaction: CommandInteraction) {
  await interaction.reply({
    content: "Discord Split Bill Bot is online!",
    ephemeral: true,
});
}


