import * as Discord from "discord.js";
import { commands, type CommandModule } from './commands/index.js';

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


client.once(Discord.Events.ClientReady, (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
});


const clientCommands = new Discord.Collection<string, CommandModule>();

for (const command of commands) {
    clientCommands.set(command.data.name, command);
}

client.on(Discord.Events.InteractionCreate, async (interaction) => {
    // We only care about Slash Commands (Chat Input)
    if (!interaction.isChatInputCommand()) return;

    // Look up the command in our Collection by name
    const command = clientCommands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        // Execute the command logic!
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        
        // Always try to tell the user if something crashed
        const errorMessage = { content: 'There was an error while executing this command!', ephemeral: true };
        
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(errorMessage);
        } else {
            await interaction.reply(errorMessage);
        }
    }
});

client.login(process.env.DISCORD_BOT_TOKEN);
