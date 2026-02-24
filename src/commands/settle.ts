import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { UserService } from "../backend/service/user.service.js";
import { TransactionService } from "../backend/service/transaction.service.js";
import type { Currency } from "../backend/interface/user-balance.repository.interface.js";
import { approvedEmoji } from "../backend/constants.js";
import { createSettlementMessageEmbed } from "../helper/discord-message-builder.js";

const userService = new UserService();
const transactionService = new TransactionService();

const currencyOptions = [
  { name: "USD", value: "USD" },
  { name: "HKD", value: "HKD" },
  { name: "JPY", value: "JPY" },
];

export const data = new SlashCommandBuilder()
  .setName("settle")
  .setDescription("Add a bill that split between @mentioned")
  .addNumberOption((option) =>
    option.setName("amount").setDescription("Amount").setRequired(true),
  )
  .addStringOption((option) =>
    option
      .setName("currency")
      .setDescription("Currency")
      .setRequired(true)
      .addChoices(currencyOptions),
  )
  .addUserOption((option) =>
    option
      .setName("payer")
      .setDescription("Mention who are paying back")
      .setRequired(true),
  )
  .addUserOption((option) =>
    option
      .setName("recipient")
      .setDescription("Mention who are receiving money")
      .setRequired(true),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const serverId = interaction.guildId;
  const author = interaction.user;
  const amount = interaction.options.getNumber("amount", true);
  const currency = interaction.options.getString("currency", true);
  const payer = interaction.options.getUser("payer");
  const recipient = interaction.options.getUser("recipient");

  if (!payer || !recipient) {
    await interaction.reply({
      content: "Please mention both payer and recipient.",
      ephemeral: true,
    });
    return;
  }

  if (payer.id === recipient.id) {
    await interaction.reply({
      content: "Payer and recipient cannot be the same user.",
      ephemeral: true,
    });
    return;
  }

  const authorUser = await userService.findUserByServerAndUserId(
    serverId!,
    author.id,
  );

  if (!authorUser || authorUser.isActive === false) {
    await interaction.reply({
      content: "Please activate before using the bot in this server.",
      ephemeral: true,
    });
    return;
  }

  const payerUser = await userService.findUserByServerAndUserId(
    serverId!,
    payer.id,
  );

  if (!payerUser || !payerUser.isActive) {
    await interaction.reply({
      content: `${payer} must activate before using the bot in this server.`,
      ephemeral: true,
    });
    return;
  }

  const recipientUser = await userService.findUserByServerAndUserId(
    serverId!,
    recipient.id,
  );

  if (!recipientUser || !recipientUser.isActive) {
    await interaction.reply({
      content: `${recipient} must activate before using the bot in this server.`,
      ephemeral: true,
    });
    return;
  }

  const resp = await interaction.reply({
    content: `Creating Transaction...`,
    withResponse: true,
  });

  const transactionMessage = resp.resource?.message;
  if (!transactionMessage) {
    await interaction.editReply({
      content: "Failed to create transaction. Please try again.",
    });
    return;
  }

  try {
    const description = `${payerUser.name} pays back ${recipientUser.name} ${amount} ${currency}`;

    await transactionService.createTransaction({
      author: { serverId: serverId!, userId: author.id },
      payer: { serverId: serverId!, userId: payer.id },
      payees: [{ serverId: serverId!, userId: recipient.id }],
      amount,
      currency: currency as Currency,
      description,
      serverId: serverId!,
      channelId: interaction.channelId,
      messageId: transactionMessage.id,
    });

    const embed = createSettlementMessageEmbed({
      description,
      payer: payerUser,
      recipient: recipientUser,
      amount,
      currency: currency as Currency,
      messageId: transactionMessage.id,
    });

    await transactionMessage.edit({
      content: `${author} has initiated a transaction of ${amount} ${currency} from ${payer} to ${recipient}\n Please confirm by reacting with ${approvedEmoji}`,
      embeds: [embed],
    });
    transactionMessage.react(approvedEmoji);
    transactionMessage.pin();
  } catch (error) {
    console.error("Error creating transaction:", error);

    transactionMessage.delete();

    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred. Please contact the administrator.";
    await interaction.editReply({
      content:
        "An error occurred while creating the transaction. " + errorMessage,
      components: [],
    });
  }
}
