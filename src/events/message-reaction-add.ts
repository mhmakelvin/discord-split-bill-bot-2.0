import { Events, MessageReaction, User } from "discord.js";
import type { PartialMessageReaction, PartialUser } from "discord.js";
import type { DiscordEvent } from "./index.js";
import { TransactionService } from "../backend/service/transaction.service.js";

const transactionService = new TransactionService();

export const messageReactionAdd: DiscordEvent = {
  action: Events.MessageReactionAdd,
  async execute(
    reaction: MessageReaction | PartialMessageReaction,
    user: User | PartialUser,
  ) {
    if (reaction.partial) {
      await reaction.fetch();
    }

    const transactions = await transactionService.findTransactionsByMessageId(
      reaction.message.id,
    );
    console.log(transactions);
  },
};
