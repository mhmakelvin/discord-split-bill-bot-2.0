import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { UserService } from "../backend/service/user.service.js";
import { createUserProfileEmbed } from "../helper/discord-message-builder.js";

const userService = new UserService();

export const data = new SlashCommandBuilder()
  .setName("profile")
  .setDescription("Shows the balance of the user")
  .addUserOption((option) =>
    option
      .setName("user")
      .setDescription("Select a user to view their profile")
      .setRequired(false),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    const serverId = interaction.guildId!;
    const mentionedUser =
      interaction.options.getUser("user") ?? interaction.user;

    const user = await userService.findUserByServerAndUserId(
      serverId,
      mentionedUser.id,
    );

    if (!user || !user.isActive) {
      interaction.reply({
        content: `${mentionedUser} has not activated to use the bot in this server.`,
        ephemeral: true,
      });
      return;
    }

    const embed = createUserProfileEmbed(user);
    interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.log("Error when fetching user profile:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred. Please contact the administrator.";

    interaction.reply({
      content: `Error when fetching user profile: ${errorMessage}`,
    });
  }
}
