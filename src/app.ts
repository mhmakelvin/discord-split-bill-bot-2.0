import * as Discord from "discord.js";
import { commands } from "./commands/index.js";
import { events } from "./events/index.js";
import type { CommandModule } from "./commands/index.js";
import type { DiscordEvent } from "./events/index.js";

const client = new Discord.Client({
  intents: [
    Discord.GatewayIntentBits.Guilds,
    Discord.GatewayIntentBits.GuildMessages,
    Discord.GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [
    Discord.Partials.Message,
    Discord.Partials.Channel,
    Discord.Partials.Reaction,
  ],
});

const clientCommands = new Discord.Collection(
  commands.map((cmd) => [cmd.data.name, cmd as CommandModule]),
);

client.on(Discord.Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = clientCommands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);

    await interaction.reply({
      content:
        "There was an error while executing this command. Please contact administrator.",
      ephemeral: true,
    });
  }
});

events.forEach((event: DiscordEvent) => {
  client.on(event.action, (...args) => event.execute(...args));
});

client.login(process.env.DISCORD_BOT_TOKEN);
