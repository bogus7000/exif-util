import { OutputFlags } from "@oclif/parser";
import BaseCommand from "../base/base-command";

export default class ShuffleDir extends BaseCommand {
  static description = "describe the command here";

  static flags = {
    ...BaseCommand.flags,
  };

  static args = [
    {
      ...BaseCommand.args[0],
      description: "Path to directory to shuffle",
      required: false,
    },
  ];

  async run() {
    if (this.parsedArgs && this.parsedFlags) {
      // Read flags and args
      const flags = this.parsedFlags as OutputFlags<typeof ShuffleDir.flags>;
      const args = this.parsedArgs;
    }
  }

  printFlags(flags: any): void {
    throw new Error("Method not implemented.");
  }
}
