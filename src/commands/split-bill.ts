import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  UserSelectMenuBuilder,
  ActionRowBuilder,
  type MessageActionRowComponentBuilder,
} from "discord.js";
import { UserService } from "../backend/service/user.service.js";
import { TransactionService } from "../backend/service/transaction.service.js";
import type { Currency } from "../backend/interface/user-balance.repository.interface.js";
import { approvedEmoji } from "../backend/constants.js";
import {
  buildMentionableUsersFromIds,
  createSplitBillTransactionMessageEmbed,
} from "../helper/discord-message-builder.js";

const userService = new UserService();
const transactionService = new TransactionService();

const currencyOptions = [
  { name: "USD", value: "USD" },
  { name: "HKD", value: "HKD" },
  { name: "JPY", value: "JPY" },
];

export const data = new SlashCommandBuilder()
  .setName("split_bill")
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
  .addStringOption((option) =>
    option
      .setName("description")
      .setDescription("Description")
      .setRequired(false),
  )
  .addUserOption((option) =>
    option
      .setName("payer")
      .setDescription("Mention who are paying the bill")
      .setRequired(false),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const serverId = interaction.guildId;
  const author = interaction.user;
  const amount = interaction.options.getNumber("amount", true);
  const currency = interaction.options.getString("currency", true);
  const description = interaction.options.getString("description");
  const payer = interaction.options.getUser("payer") ?? interaction.user;

  const authorUser = await userService.findUserByServerAndUserId(
    serverId!,
    payer.id,
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

  if (!payerUser || payerUser.isActive === false) {
    await interaction.reply({
      content: `${payer} must activate before using the bot in this server.`,
      ephemeral: true,
    });
    return;
  }

  const userSelectMenu = new UserSelectMenuBuilder()
    .setCustomId("payees")
    .setPlaceholder("Participants")
    .setMinValues(1)
    .setMaxValues(25);

  const selectParticipantReply = await interaction.reply({
    content: "Select participants to split the bill with:",
    components: [
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        userSelectMenu,
      ),
    ],
    ephemeral: true,
    withResponse: true,
  });

  const replyMessage = selectParticipantReply.resource?.message;

  let participants: string[] = [];
  try {
    const response = await replyMessage?.awaitMessageComponent({ time: 60000 });
    if (response?.isUserSelectMenu()) {
      participants = response.values;
    }
  } catch (error) {
    await interaction.editReply({
      content: "Timed out. Please run the command again.",
      components: [],
    });
    return;
  }

  const transactionMessage = await interaction.followUp({
    content: `Creating Transaction`,
  });

  try {
    const payees = await userService.findUsersByServerAndUserIdList(
      participants.map((userId) => ({ serverId: serverId!, userId })),
    );

    if (payees.length !== participants.length) {
      const missingUserIds = participants.filter(
        (userId) => !payees.some((payee) => payee.userId === userId),
      );
      await interaction.editReply({
        content: `${buildMentionableUsersFromIds(missingUserIds)} must activate before using the bot in this server.`,
        components: [],
      });
      return;
    }

    const count = payees.length;
    const roundedAmount = Math.ceil(amount / count) * count;

    await transactionService.createTransaction({
      author: { serverId: serverId!, userId: author.id },
      payer: { serverId: serverId!, userId: payer.id },
      payees: payees.map((payee) => ({
        serverId: serverId!,
        userId: payee.userId,
      })),
      amount: roundedAmount,
      currency: currency as Currency,
      description: description ?? "",
      serverId: serverId!,
      channelId: interaction.channelId,
      messageId: transactionMessage.id,
    });

    const embed = createSplitBillTransactionMessageEmbed({
      description: description ?? `Split bill of ${amount} ${currency}`,
      author: authorUser,
      payer: payerUser,
      payees,
      amount: roundedAmount,
      currency: currency as Currency,
      messageId: transactionMessage.id,
    });

    transactionMessage.edit({
      content: `${author} has initiated a transaction of ${amount} ${currency} splitting between ${buildMentionableUsersFromIds(participants)}\n Please confirm by reacting with ${approvedEmoji}`,
      embeds: [embed],
    });
    transactionMessage.react(approvedEmoji);
    transactionMessage.pin();

    interaction.deleteReply();
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
