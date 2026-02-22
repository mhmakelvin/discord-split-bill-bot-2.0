import { SlashCommandBuilder, CommandInteraction } from 'discord.js';

export interface CommandModule {
  data: SlashCommandBuilder;
  execute: (interaction: CommandInteraction) => Promise<void>;
}

import * as ping from "./ping.js";

export const commands: CommandModule[] = [ping];