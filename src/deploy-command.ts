import { REST, Routes } from "discord.js";
import * as commands from "./commands/index.js";
import type { CommandModule } from "./commands/index.js";

const body = (Object.values(commands) as CommandModule[]).map((c) =>
  c.data.toJSON(),
);

const rest = new REST().setToken(process.env.DISCORD_BOT_TOKEN!);

await rest.put(Routes.applicationCommands(process.env.CLIENT_ID!), { body });
