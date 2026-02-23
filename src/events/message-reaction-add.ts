import * as Discord from "discord.js";
import type { DiscordEvent } from "./index.js";
import { TransactionService } from "../backend/service/transaction.service.js";
import type { User } from "../backend/interface/user.repository.interface.js";
import { approvedEmoji } from "../backend/constants.js";
import {
  updateApprovedUsersInEmbed,
  updateTransactionMessageAfterProcessed,
} from "../helper/discord-message-builder.js";

const transactionService = new TransactionService();

export const messageReactionAdd: DiscordEvent = {
  action: Discord.Events.MessageReactionAdd,
  async execute(
    reaction: Discord.MessageReaction | Discord.PartialMessageReaction,
    user: Discord.User | Discord.PartialUser,
  ) {
    if (reaction.emoji.name !== approvedEmoji) return;
    if (user.bot) return;

    if (reaction.partial) await reaction.fetch();

    const message = reaction.message.partial
      ? await reaction.message.fetch()
      : reaction.message;

    const transactions = await transactionService.findTransactionsByMessageId(
      message.id,
    );

    if (transactions.some((tx) => tx.status !== "pending")) return;

    const requiredApprovers = Array.from(
      transactions
        .flatMap((tx) => [tx.payer, ...tx.payees])
        .reduce((map, user) => {
          if (!map.has(user.userId)) {
            map.set(user.userId, user);
          }
          return map;
        }, new Map<string, User>())
        .values(),
    );

    const reactedUsers = await reaction.users.fetch();

    const approvedUsers = requiredApprovers.filter((u) =>
      reactedUsers.some((r) => r.id === u.userId),
    );
    const pendingUsers = requiredApprovers.filter(
      (a) => !reactedUsers.some((u) => u.id === a.userId),
    );

    updateApprovedUsersInEmbed(message, approvedUsers, pendingUsers);
    if (pendingUsers.length === 0) {
      try {
        await transactionService.approveTransaction(message.id);
        await transactionService.processTransaction(message.id);
        updateTransactionMessageAfterProcessed(message);
      } catch (error) {
        console.error(
          `Error when processing transaction ${message.id}:`,
          error,
        );
      }
    }
  },
};
