import * as Discord from "discord.js";
import type { User } from "../backend/interface/user.repository.interface.js";
import type { Currency } from "../backend/interface/user-balance.repository.interface.js";

export function buildMentionableUsersFromIds(userIds: string[]): string {
  return userIds.map((id) => `<@${id}>`).join(", ");
}

export function createSplitBillTransactionMessageEmbed(params: {
  description?: string;
  payer: User;
  payees: User[];
  amount: number;
  currency: Currency;
  messageId: string;
}) {
  const { description, payer, payees, amount, currency, messageId } = params;

  const payeeAmount = amount / payees.length;

  const requiredApprovers = Array.from(
    [payer, ...payees]
      .reduce((map, user) => {
        if (!map.has(user.userId)) {
          map.set(user.userId, user);
        }
        return map;
      }, new Map<string, User>())
      .values(),
  );

  const embed: Discord.APIEmbed = {
    title: description ?? "Settlement Request",
    timestamp: new Date().toISOString(),
  };

  upsertEmbedFields(embed, "Transaction ID", messageId);
  upsertEmbedFields(embed, "Payer", payer.name);
  upsertEmbedFields(
    embed,
    "Participants",
    `${payees.map((p) => p.name).join(", ")}`,
  );
  upsertEmbedFields(
    embed,
    "Amount",
    `${amount} ${currency} (${payeeAmount} ${currency} per person)`,
  );
  upsertEmbedFields(embed, "Approved", `0`);
  upsertEmbedFields(
    embed,
    "Pending Approval",
    `${requiredApprovers.length}` +
      (requiredApprovers.length > 0
        ? ` (${requiredApprovers.map((user) => user.name).join(", ")})`
        : ""),
  );
  upsertEmbedFields(embed, "Status", `Pending`);
  upsertEmbedFields(embed, "Last Updated", new Date().toUTCString());

  return embed;
}

export function createSettlementMessageEmbed(params: {
  description?: string;
  payer: User;
  recipient: User;
  amount: number;
  currency: Currency;
  messageId: string;
}) {
  const { description, payer, recipient, amount, currency, messageId } = params;

  const requiredApprovers = Array.from(
    [payer, recipient]
      .reduce((map, user) => {
        if (!map.has(user.userId)) {
          map.set(user.userId, user);
        }
        return map;
      }, new Map<string, User>())
      .values(),
  );

  const embed: Discord.APIEmbed = {
    title: description ?? "Settlement Request",
    timestamp: new Date().toISOString(),
  };

  upsertEmbedFields(embed, "Transaction ID", messageId);
  upsertEmbedFields(embed, "Payer", payer.name);
  upsertEmbedFields(embed, "Recipient", recipient.name);
  upsertEmbedFields(embed, "Amount", `${amount} ${currency}`);
  upsertEmbedFields(embed, "Approved", `0`);
  upsertEmbedFields(
    embed,
    "Pending Approval",
    `${requiredApprovers.length}` +
      (requiredApprovers.length > 0
        ? ` (${requiredApprovers.map((user) => user.name).join(", ")})`
        : ""),
  );
  upsertEmbedFields(embed, "Status", `Pending`);
  upsertEmbedFields(embed, "Last Updated", new Date().toUTCString());

  return embed;
}

export function updateApprovedUsersInEmbed(
  message: Discord.Message,
  approvedUsers: User[],
  pendingUsers: User[],
) {
  const embed = message.embeds[0];
  if (!embed) return;

  upsertEmbedFields(
    embed.data,
    "Approved",
    `${approvedUsers.length}` +
      (approvedUsers.length > 0
        ? ` (${approvedUsers.map((user) => user.name).join(", ")})`
        : ""),
  );
  upsertEmbedFields(
    embed.data,
    "Pending Approval",
    `${pendingUsers.length}` +
      (pendingUsers.length > 0
        ? ` (${pendingUsers.map((user) => user.name).join(", ")})`
        : ""),
  );
  if (pendingUsers.length === 0) {
    upsertEmbedFields(embed.data, "Status", `Approved`);
  }
  upsertEmbedFields(embed.data, "Last Updated", new Date().toUTCString());

  message.edit({ embeds: [embed.data] });
}

export function updateTransactionMessageForCancellation(
  message: Discord.Message,
  userId: string,
) {
  message.edit({
    content: `This transaction has been cancelled by ${buildMentionableUsersFromIds([userId])} on ${new Date().toUTCString()}`,
  });
  message.unpin();
}

export function updateTransactionMessageAfterProcessed(
  message: Discord.Message,
) {
  const embed = message.embeds[0];
  if (!embed) return;

  upsertEmbedFields(embed.data, "Status", `Processed`);
  upsertEmbedFields(embed.data, "Last Updated", new Date().toUTCString());

  message.edit({ embeds: [embed.data] });
  message.edit({
    content: `This transaction has been processed on ${new Date().toUTCString()}`,
  });
  message.unpin();
}

export function createUserProfileEmbed(user: User) {
  const embed: Discord.APIEmbed = {
    title: `${user.name}'s Profile`,
    timestamp: new Date().toISOString(),
  };

  upsertEmbedFields(embed, "Discord ID", user.userId);
  upsertEmbedFields(embed, "Display Name", user.name);
  upsertEmbedFields(
    embed,
    "Balance",
    user.balances.map((b) => `${b.currency}: ${b.balance}`).join("\n"),
  );

  return embed;
}

export function upsertEmbedFields(
  embed: Discord.APIEmbed,
  name: string,
  value: string,
) {
  embed.fields = embed.fields ?? [];
  embed.fields = embed.fields.filter((field) => field.name !== name);
  embed.fields.push({ name, value });
}
