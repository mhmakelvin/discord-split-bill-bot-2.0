import * as ping from "./ping.js";
import * as activate from "./activate.js";
import * as splitBill from "./split-bill.js";

export interface CommandModule {
  data: any;
  execute: (interaction: any) => Promise<void>;
}

export const commands: CommandModule[] = [ping, activate, splitBill];
