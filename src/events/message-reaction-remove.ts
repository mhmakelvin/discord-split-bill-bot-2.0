import * as Discord from "discord.js";
import type { DiscordEvent } from "./index.js";
import { TransactionService } from "../backend/service/transaction.service.js";
import type { User } from "../backend/interface/user.repository.interface.js";
import { approvedEmoji } from "../backend/constants.js";
import { updateApprovedUsersInEmbed } from "../helper/discord-message-builder.js";

const transactionService = new TransactionService();

export const messageReactionRemove: DiscordEvent = {
  action: Discord.Events.MessageReactionRemove,
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
  },
};
