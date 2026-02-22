import * as ping from "./ping.js";
import * as activate from "./activate.js";

export const commands: CommandModule[] = [ping, activate];

export interface CommandModule {
  data: any;
  execute: (interaction: any) => Promise<void>;
}
