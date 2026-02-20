import { Client, Events, GatewayIntentBits } from "discord.js";
import { db } from "./db";

const client: Client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.login(process.env.DISCORD_BOT_TOKEN);

const result = await db.execute("select 1");
console.log(result);
