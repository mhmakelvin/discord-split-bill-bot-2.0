import { REST, Routes } from "discord.js";
import { commands } from "./commands/index.js";

const body = commands.map(c => c.data.toJSON());

const rest = new REST().setToken(process.env.DISCORD_BOT_TOKEN!);

await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID!),
    { body }
);