import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { UserService } from "../backend/service/user.service.js";

const userService = new UserService();

export const data = new SlashCommandBuilder()
  .setName("activate")
  .setDescription("Activate to start using the bot")
  .addStringOption((option) =>
    option
      .setName("name")
      .setDescription("Display name for user")
      .setRequired(false),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const user = interaction.user;
  const displayName = interaction.options.getString("name") ?? user.username;

  const existingUser = await userService.findUserByServerAndUserId(
    interaction.guildId!,
    user.id,
  );

  if (existingUser) {
    userService.updateUser(existingUser.id, displayName, true);
  } else {
    await userService.createUser(interaction.guildId!, user.id, displayName);
  }

  interaction.reply({
    content: `Welcome! You can now start using Split Bill Bot.`,
    ephemeral: true,
  });
}
