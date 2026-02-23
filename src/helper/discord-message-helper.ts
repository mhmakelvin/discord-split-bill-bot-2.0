import { Client, Message } from "discord.js";

export async function fetchMessage(
  client: Client,
  channelId: string,
  messageId: string,
): Promise<Message | null> {
  try {
    const channel = await client.channels.fetch(channelId);

    if (!channel || !channel.isTextBased()) {
      console.error(`Channel ${channelId} not found or is not a text channel.`);
      return null;
    }

    const message = await channel.messages.fetch(messageId);

    return message;
  } catch (error) {
    console.error(`Failed to fetch message ${messageId}:`, error);
    return null;
  }
}
