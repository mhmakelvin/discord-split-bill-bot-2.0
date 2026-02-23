import * as Discord from "discord.js";

import { messageReactionAdd } from "./message-reaction-add.js";

export interface DiscordEvent {
  action: keyof Discord.ClientEvents;
  execute: (...args: any[]) => Promise<void> | void;
}

export const events: DiscordEvent[] = [messageReactionAdd];
