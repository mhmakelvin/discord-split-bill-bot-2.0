export * as ping from "./ping.js";
export * as activate from "./activate.js";
export interface CommandModule {
  data: any;
  execute: (interaction: any) => Promise<void>;
}
