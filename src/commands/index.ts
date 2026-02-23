export * as ping from "./ping.js";
export * as activate from "./activate.js";
export * as splitBill from "./split-bill.js";

export interface CommandModule {
  data: any;
  execute: (interaction: any) => Promise<void>;
}
