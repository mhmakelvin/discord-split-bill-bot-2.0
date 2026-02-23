import { SlashCommandBuilder } from "@discordjs/builders";
import type { ChatInputCommandInteraction } from "discord.js";
import { TransactionService } from "../backend/service/transaction.service.js";
import { updateTransactionMessageForCancellation } from "../helper/discord-message-builder.js";
import { fetchMessage } from "../helper/discord-message-helper.js";

const transactionService = new TransactionService();

export const data = new SlashCommandBuilder()
  .setName("cancel")
  .setDescription("Cancel unprocessed transaction with given ID")
  .addStringOption((option) =>
    option.setName("id").setDescription("Transaction ID").setRequired(true),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const transactionMessageId = interaction.options.getString("id", true);
  const userId = interaction.user.id;
  const serverId = interaction.guildId!;

  try {
    if (!/^[0-9]+$/.test(transactionMessageId)) {
      interaction.reply("Invalid transaction ID. Please input a number");
      return;
    }

    const cancelledTransactions = await transactionService.cancelTransaction(
      transactionMessageId,
      userId,
      serverId,
    );
    interaction.reply(`Transaction ${transactionMessageId} has been cancelled`);

    const client = interaction.client;
    for (const transaction of cancelledTransactions) {
      const msg = await fetchMessage(
        client,
        transaction.channelId,
        transaction.messageId,
      );
      if (!msg) continue;

      updateTransactionMessageForCancellation(msg, userId);
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred. Please contact the administrator.";

    interaction.reply({
      content: `Error when cancelling transaction: ${errorMessage}`,
    });
  }
}
