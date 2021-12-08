// src/base.ts
import { Command, flags } from "@oclif/command";
import { Input, OutputArgs, OutputFlags } from "@oclif/parser";
import * as signal from "signale";
import chalk = require("chalk");
import CFonts = require("cfonts");

export default abstract class BaseCommand extends Command {
  static flags = {
    help: flags.help({ char: "h" }),
  };
  protected parsedArgs?: OutputArgs;
  protected parsedFlags?: OutputFlags<typeof BaseCommand.flags>;
  protected sig!: signal.Signale<signal.DefaultMethods>;
  private sigOptions = {
    scope: "exif-util",
  };

  async init(): Promise<void> {
    // init Signale
    this.sig = new signal.Signale({
      ...this.sigOptions,
    });
    // init args and flags
    const { args, flags } = this.parse(
      this.constructor as Input<typeof BaseCommand.flags>
    );
    this.parsedArgs = args;
    this.parsedFlags = flags;
  }

  async catch(err: any) {
    if (err.oclif.exit === 0) {
      return super.catch(err);
    } else {
      this.sig.error("Oooops...ERROR!");
      return super.catch(err);
    }
  }

  //   Helper
  protected showSeparator(): void {
    this.log("-----------------------------------------------------------");
  }

  protected welcome(): void {
    console.clear();
    this.log("\n");
    CFonts.say("exif-util", {
      font: "simple",
      align: "left",
      space: false,
      colors: ["green"],
      background: "transparent",
      env: "node",
    });
    this.log("\n");
    this.log(
      chalk.bgGreen.black(`  exif-util version ${this.config.version}   `)
    );
    this.log("\n");
    this.showSeparator();
  }
}
