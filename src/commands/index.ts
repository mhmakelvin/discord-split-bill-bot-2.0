import * as ping from "./ping.js";
import * as activate from "./activate.js";
import * as splitBill from "./split-bill.js";
import * as cancel from "./cancel.js";
import * as profile from "./profile.js";
import * as settle from "./settle.js";

export interface CommandModule {
  data: any;
  execute: (interaction: any) => Promise<void>;
}

export const commands: CommandModule[] = [
  ping,
  activate,
  splitBill,
  cancel,
  profile,
  settle,
];
